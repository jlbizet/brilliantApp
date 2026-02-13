import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto } from './dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    async findAll(query: PaginationDto & AppointmentQueryDto) {
        const where: any = {};
        if (query.startDate && query.endDate) {
            where.startTime = { gte: new Date(query.startDate), lte: new Date(query.endDate) };
        }
        if (query.dentistId) where.dentistId = query.dentistId;
        if (query.status) where.status = query.status;
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { patient: { firstName: { contains: query.search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: query.search, mode: 'insensitive' } } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
                skip: query.skip,
                take: query.limit,
                orderBy: { startTime: 'asc' },
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return new PaginatedResponseDto(data, total, query.page!, query.limit!);
    }

    async getCalendar(query: AppointmentQueryDto) {
        const where: any = {};
        if (query.startDate && query.endDate) {
            where.startTime = { gte: new Date(query.startDate) };
            where.endTime = { lte: new Date(query.endDate) };
        }
        if (query.dentistId) where.dentistId = query.dentistId;
        if (query.status) where.status = query.status;

        return this.prisma.appointment.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                dentist: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { startTime: 'asc' },
        });
    }

    async findOne(id: string) {
        const apt = await this.prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                dentist: { select: { id: true, firstName: true, lastName: true, specialization: true } },
            },
        });
        if (!apt) throw new NotFoundException('Appointment not found');
        return apt;
    }

    async create(dto: CreateAppointmentDto) {
        // Verify patient exists
        const patient = await this.prisma.patient.findUnique({
            where: { id: dto.patientId },
        });

        if (!patient) {
            throw new NotFoundException(`Patient with ID "${dto.patientId}" not found`);
        }

        // Verify dentist exists
        const dentist = await this.prisma.user.findUnique({
            where: { id: dto.dentistId },
        });

        if (!dentist) {
            throw new NotFoundException(`Dentist with ID "${dto.dentistId}" not found`);
        }

        // Check for time conflicts
        const conflict = await this.prisma.appointment.findFirst({
            where: {
                dentistId: dto.dentistId,
                status: { notIn: ['CANCELLED'] },
                OR: [
                    { startTime: { lte: new Date(dto.startTime) }, endTime: { gt: new Date(dto.startTime) } },
                    { startTime: { lt: new Date(dto.endTime) }, endTime: { gte: new Date(dto.endTime) } },
                ],
            },
        });

        if (conflict) {
            throw new BadRequestException('Time slot conflicts with an existing appointment');
        }

        try {
            if (!dto.isRecurring) {
                const appointment = await this.prisma.appointment.create({
                    data: {
                        ...dto,
                        startTime: new Date(dto.startTime),
                        endTime: new Date(dto.endTime),
                    },
                    include: {
                        patient: { select: { id: true, firstName: true, lastName: true } },
                        dentist: { select: { id: true, firstName: true, lastName: true } },
                    },
                });

                // Notify dentist about new appointment
                await this.notifyAppointmentCreated(appointment);

                return appointment;
            }

            // Handle Recurring Appointments
            const appointments = [];
            const start = new Date(dto.startTime);
            const end = new Date(dto.endTime);
            const stopAt = dto.recurringEndDate ? new Date(dto.recurringEndDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days
            const groupId = crypto.randomUUID();

            let currentStart = new Date(start);
            let currentEnd = new Date(end);

            while (currentStart <= stopAt) {
                appointments.push({
                    ...dto,
                    startTime: new Date(currentStart),
                    endTime: new Date(currentEnd),
                    isRecurring: true,
                    recurringGroupId: groupId,
                });

                // Advance time based on pattern
                switch (dto.recurringPattern) {
                    case 'daily':
                        currentStart.setDate(currentStart.getDate() + 1);
                        currentEnd.setDate(currentEnd.getDate() + 1);
                        break;
                    case 'weekly':
                        currentStart.setDate(currentStart.getDate() + 7);
                        currentEnd.setDate(currentEnd.getDate() + 7);
                        break;
                    case 'biweekly':
                        currentStart.setDate(currentStart.getDate() + 14);
                        currentEnd.setDate(currentEnd.getDate() + 14);
                        break;
                    case 'monthly':
                        currentStart.setMonth(currentStart.getMonth() + 1);
                        currentEnd.setMonth(currentEnd.getMonth() + 1);
                        break;
                    default:
                        currentStart.setDate(currentStart.getDate() + 7); // Default weekly
                        currentEnd.setDate(currentEnd.getDate() + 7);
                }
            }

            // Bulk create might not return nested includes easily, so we loop or just create first and return
            // For now, let's just use createMany or loop for simple implementation
            await this.prisma.appointment.createMany({ data: appointments });

            return { message: `${appointments.length} recurring appointments created`, groupId };
        } catch (error) {
            throw new BadRequestException('Could not create appointment: ' + error.message);
        }
    }

    async update(id: string, dto: UpdateAppointmentDto) {
        // Get old appointment data before updating
        const oldAppointment = await this.findOne(id);

        const data: any = { ...dto };
        if (dto.startTime) data.startTime = new Date(dto.startTime);
        if (dto.endTime) data.endTime = new Date(dto.endTime);

        const appointment = await this.prisma.appointment.update({
            where: { id },
            data,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                dentist: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        // Notify dentist about appointment update
        await this.notifyAppointmentUpdated(appointment, oldAppointment);

        return appointment;
    }

    async remove(id: string) {
        const appointment = await this.findOne(id);

        await this.prisma.appointment.delete({
            where: { id },
        });

        // Notify both dentist and patient about cancellation/deletion
        if (appointment) {
            await this.notificationsService.createAppointmentNotification(
                appointment.dentistId,
                appointment.patientId,
                'Appointment Deleted',
                `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} has been permanently removed`,
                'Appointment Cancelled',
                'Your appointment has been removed from the schedule',
            );
        }

        return { message: 'Appointment deleted successfully' };
    }

    async getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.prisma.appointment.count({
            where: {
                startTime: { gte: today, lt: tomorrow },
                status: { notIn: ['CANCELLED'] },
            },
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async handleReminders() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setDate(tomorrow.getDate() + 1);

        const upcoming = await this.prisma.appointment.findMany({
            where: {
                startTime: { gte: tomorrow, lt: endOfTomorrow },
                status: 'SCHEDULED',
            },
            include: { patient: true, dentist: true },
        });

        console.log(`[Reminders] Found ${upcoming.length} appointments for tomorrow. Creating notifications...`);

        for (const apt of upcoming) {
            const timeStr = apt.startTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            // Notify BOTH dentist AND patient
            await this.notificationsService.createAppointmentNotification(
                apt.dentistId,
                apt.patientId,
                'Upcoming Appointment Tomorrow',
                `You have an appointment with ${apt.patient.firstName} ${apt.patient.lastName} tomorrow at ${timeStr}`,
                'Appointment Reminder',
                `Reminder: You have an appointment with Dr. ${apt.dentist.firstName} ${apt.dentist.lastName} tomorrow at ${timeStr}`,
            );

            console.log(`[Reminders] Created notifications for appointment with ${apt.patient.firstName} ${apt.patient.lastName}`);
        }
    }

    private async notifyAppointmentCreated(appointment: any) {
        const timeStr = appointment.startTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const dateStr = appointment.startTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // Notify BOTH dentist AND patient
        await this.notificationsService.createAppointmentNotification(
            appointment.dentistId,
            appointment.patientId,
            'New Appointment Scheduled',
            `New appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} on ${dateStr} at ${timeStr}`,
            'Appointment Confirmed',
            `Your appointment with Dr. ${appointment.dentist?.firstName} ${appointment.dentist?.lastName} has been scheduled for ${dateStr} at ${timeStr}`,
        );
    }

    private async notifyAppointmentUpdated(appointment: any, oldData: any) {
        const timeStr = appointment.startTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const dateStr = appointment.startTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        let dentistMessage = '';
        let patientMessage = '';
        let dentistTitle = 'Appointment Updated';
        let patientTitle = 'Appointment Update';

        if (oldData.startTime.getTime() !== appointment.startTime.getTime()) {
            dentistMessage = `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} rescheduled to ${dateStr} at ${timeStr}`;
            patientMessage = `Your appointment has been rescheduled to ${dateStr} at ${timeStr}`;
            dentistTitle = 'Appointment Rescheduled';
            patientTitle = 'Appointment Rescheduled';
        } else if (appointment.status !== oldData.status) {
            dentistMessage = `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} status changed to ${appointment.status}`;
            patientMessage = `Your appointment status has been updated to ${appointment.status}`;
            if (appointment.status === 'CANCELLED') {
                dentistTitle = 'Appointment Cancelled';
                patientTitle = 'Appointment Cancelled';
                patientMessage = 'Your appointment has been cancelled';
            }
        } else {
            dentistMessage = `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} has been updated`;
            patientMessage = 'Your appointment details have been updated';
        }

        // Notify BOTH dentist AND patient
        await this.notificationsService.createAppointmentNotification(
            appointment.dentistId,
            appointment.patientId,
            dentistTitle,
            dentistMessage,
            patientTitle,
            patientMessage,
        );
    }
}

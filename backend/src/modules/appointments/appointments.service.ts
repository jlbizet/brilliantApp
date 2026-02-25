import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto } from './dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);

    private readonly timezone: string;

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private configService: ConfigService,
    ) {
        this.timezone = this.configService.get<string>('CLINIC_TIMEZONE') || 'UTC';
    }

    /**
     * Format date for display
     */
    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: this.timezone
        }).format(date);
    }

    /**
     * Format time for display
     */
    private formatTime(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: this.timezone
        }).format(date);
    }

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

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        const [data, total] = await Promise.all([
            this.prisma.appointment.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { startTime: 'asc' },
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
            this.prisma.appointment.count({ where }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
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
        console.log(`[CREATE] Received dto.startTime: ${dto.startTime}`);
        console.log(`[CREATE] Parsed Date: ${new Date(dto.startTime).toISOString()}`);

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
            const appointment = await this.prisma.appointment.create({
                data: {
                    patientId: dto.patientId,
                    dentistId: dto.dentistId,
                    title: dto.title,
                    description: dto.description,
                    startTime: new Date(dto.startTime),
                    endTime: new Date(dto.endTime),
                    type: dto.type,
                    notes: dto.notes,
                },
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
            });

            // Notify BOTH dentist AND patient
            await this.notifyAppointmentCreated(appointment);

            return appointment;
        } catch (error) {
            throw new BadRequestException('Could not create appointment: ' + error.message);
        }
    }

    async createRecurring(dto: CreateAppointmentDto) {
        const { isRecurring, recurringPattern, recurringEndDate, ...baseData } = dto;

        if (!isRecurring || !recurringPattern || !recurringEndDate) {
            throw new BadRequestException('Invalid recurring appointment data');
        }

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

        // Generate a group ID for this recurring series
        const groupId = crypto.randomUUID();

        const appointments = [];
        const endDate = new Date(recurringEndDate);
        let currentStart = new Date(dto.startTime);
        let currentEnd = new Date(dto.endTime);

        while (currentStart <= endDate) {
            // Check for conflict
            const conflict = await this.prisma.appointment.findFirst({
                where: {
                    dentistId: dto.dentistId,
                    status: { notIn: ['CANCELLED'] },
                    OR: [
                        { startTime: { lte: currentStart }, endTime: { gt: currentStart } },
                        { startTime: { lt: currentEnd }, endTime: { gte: currentEnd } },
                    ],
                },
            });

            if (!conflict) {
                appointments.push({
                    patientId: dto.patientId,
                    dentistId: dto.dentistId,
                    title: dto.title,
                    description: dto.description,
                    startTime: currentStart,
                    endTime: currentEnd,
                    type: dto.type,
                    notes: dto.notes,
                    isRecurring: true,
                    recurringPattern,
                    recurringGroupId: groupId,
                    recurringEndDate: new Date(recurringEndDate),
                });
            }

            // Advance date based on pattern
            switch (recurringPattern) {
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
        console.log(`[Recurring] Created ${appointments.length} appointments in series ${groupId}`);

        // Notify for the FIRST one as a confirmation of the series
        const firstApt = await this.prisma.appointment.findFirst({
            where: { recurringGroupId: groupId },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                dentist: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { startTime: 'asc' },
        });
        console.log(`[Recurring] First appointment in series: ${firstApt?.id}, patient: ${firstApt?.patient?.email}`);
        if (firstApt) await this.notifyAppointmentCreated(firstApt);

        return { message: `${appointments.length} recurring appointments created`, groupId };
    }

    async update(id: string, dto: UpdateAppointmentDto) {
        console.log(`[UPDATE] Received update request for id=${id}`);
        console.log(`[UPDATE] Raw dto:`, JSON.stringify(dto, null, 2));

        // Get old appointment data before updating
        const oldAppointment = await this.findOne(id);
        console.log(`[UPDATE] Found appointment:`, oldAppointment.id);

        // Whitelist allowed fields to prevent "property should not exist" errors
        const allowedFields = [
            'patientId', 'dentistId', 'title', 'description',
            'startTime', 'endTime', 'type', 'notes',
            'status', 'isRecurring', 'recurringPattern', 'recurringEndDate'
        ];

        const dtoAny = dto as any;
        const data: any = {};
        for (const key of allowedFields) {
            if (dtoAny[key] !== undefined) {
                data[key] = dtoAny[key];
            }
        }

        console.log(`[UPDATE] Filtered data keys:`, Object.keys(data));

        try {
            if (data.startTime) data.startTime = new Date(data.startTime);
            if (data.endTime) data.endTime = new Date(data.endTime);
            if (data.recurringEndDate) data.recurringEndDate = new Date(data.recurringEndDate);
        } catch (dateError) {
            console.error(`[UPDATE] Date parsing error:`, dateError.message);
            throw new BadRequestException('Invalid date format: ' + dateError.message);
        }

        const appointment = await this.prisma.appointment.update({
            where: { id },
            data,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                dentist: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        // Notify BOTH dentist AND patient if status changed or rescheduled
        await this.notifyAppointmentUpdated(appointment, oldAppointment);

        return appointment;
    }

    async remove(id: string) {
        const appointment = await this.findOne(id);

        // Notify about cancellation
        const timeStr = this.formatTime(appointment.startTime);
        const dateStr = this.formatDate(appointment.startTime);

        await this.notificationsService.createAppointmentNotification(
            appointment.dentistId,
            appointment.patientId,
            'Appointment Cancelled',
            `Appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} on ${dateStr} at ${timeStr} has been cancelled`,
            'Appointment Cancelled',
            `Your appointment with Dr. ${appointment.dentist?.firstName} ${appointment.dentist?.lastName} on ${dateStr} at ${timeStr} has been cancelled`,
            {
                startTime: appointment.startTime,
                dentistName: `${appointment.dentist?.firstName} ${appointment.dentist?.lastName}`,
                patientName: `${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
                patientEmail: appointment.patient?.email ?? undefined,
                patientPhone: appointment.patient?.phone ?? undefined,
            }
        );

        return this.prisma.appointment.delete({ where: { id } });
    }

    async getCalendar(query: AppointmentQueryDto) {
        const where: any = {};
        if (query.startDate && query.endDate) {
            const startDate = new Date(query.startDate);
            const endDate = new Date(query.endDate);
            where.OR = [
                {
                    startTime: { gte: startDate, lt: endDate },
                },
                {
                    endTime: { gt: startDate, lte: endDate },
                },
                {
                    startTime: { lte: startDate },
                    endTime: { gte: endDate },
                },
            ];
        }
        if (query.dentistId) {
            console.log(`[CalendarFetch] Filtering by single dentistId: ${query.dentistId}`);
            where.dentistId = query.dentistId;
        } else if (query.dentistIds) {
            console.log(`[CalendarFetch] Filtering by multiple dentistIds: ${query.dentistIds}`);
            where.dentistId = { in: query.dentistIds };
        }
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

    async getTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.prisma.appointment.count({
            where: {
                startTime: { gte: today, lt: tomorrow },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            },
        });
    }

    @Cron(CronExpression.EVERY_DAY_AT_9AM, { timeZone: 'America/Montevideo' })
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

        this.logger.log(`[Reminders] Found ${upcoming.length} appointments for tomorrow in clinic timezone. Creating notifications...`);

        for (const apt of upcoming) {
            await this.sendReminder(apt, 'Upcoming Appointment Tomorrow');
        }
    }

    @Cron(CronExpression.EVERY_HOUR, { timeZone: 'America/Montevideo' })
    async handleSameDayReminders() {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const twoHoursAndFiveMinutesLater = new Date(now.getTime() + (2 * 60 + 5) * 60 * 1000);

        const upcoming = await this.prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: twoHoursLater,
                    lt: twoHoursAndFiveMinutesLater
                },
                status: 'SCHEDULED',
            },
            include: { patient: true, dentist: true },
        });

        if (upcoming.length > 0) {
            this.logger.log(`[SameDayReminders] Found ${upcoming.length} appointments starting in ~2 hours. Sending urgent reminders...`);
            for (const apt of upcoming) {
                await this.sendReminder(apt, 'Appointment Reminder (2 hours)');
            }
        }
    }

    private async sendReminder(apt: any, reminderTitle: string) {
        const timeStr = this.formatTime(apt.startTime);

        await this.notificationsService.createAppointmentNotification(
            apt.dentistId,
            apt.patientId,
            reminderTitle,
            `You have an appointment with ${apt.patient.firstName} ${apt.patient.lastName} at ${timeStr}`,
            'Appointment Reminder',
            `Reminder: You have an appointment with Dr. ${apt.dentist.firstName} ${apt.dentist.lastName} at ${timeStr}`,
            {
                startTime: apt.startTime,
                dentistName: `${apt.dentist?.firstName} ${apt.dentist?.lastName}`,
                patientName: `${apt.patient?.firstName} ${apt.patient?.lastName}`,
                patientEmail: apt.patient?.email ?? undefined,
                patientPhone: apt.patient?.phone ?? undefined,
            }
        );

        this.logger.log(`[Reminders] Successfully sent ${reminderTitle} to patient ${apt.patient.firstName} ${apt.patient.lastName}`);
    }

    private async notifyAppointmentCreated(appointment: any) {
        console.log("=> notifyAppointmentCreated triggered. Patient Email:", appointment.patient?.email, "Patient Phone:", appointment.patient?.phone);
        const timeStr = this.formatTime(appointment.startTime);
        const dateStr = this.formatDate(appointment.startTime);

        // Notify BOTH dentist AND patient with email
        await this.notificationsService.createAppointmentNotification(
            appointment.dentistId,
            appointment.patientId,
            'New Appointment Scheduled',
            `New appointment with ${appointment.patient?.firstName} ${appointment.patient?.lastName} on ${dateStr} at ${timeStr}`,
            'Appointment Confirmed',
            `Your appointment with Dr. ${appointment.dentist?.firstName} ${appointment.dentist?.lastName} has been scheduled for ${dateStr} at ${timeStr}`,
            {
                startTime: appointment.startTime,
                dentistName: `${appointment.dentist?.firstName} ${appointment.dentist?.lastName}`,
                patientName: `${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
                patientEmail: appointment.patient?.email ?? undefined,
                patientPhone: appointment.patient?.phone ?? undefined,
            }
        );
    }

    private async notifyAppointmentUpdated(appointment: any, oldData: any) {
        const timeStr = this.formatTime(appointment.startTime);
        const dateStr = this.formatDate(appointment.startTime);

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

        // Notify BOTH dentist AND patient with email for updates
        await this.notificationsService.createAppointmentNotification(
            appointment.dentistId,
            appointment.patientId,
            dentistTitle,
            dentistMessage,
            patientTitle,
            patientMessage,
            {
                startTime: appointment.startTime,
                dentistName: `${appointment.dentist?.firstName} ${appointment.dentist?.lastName}`,
                patientName: `${appointment.patient?.firstName} ${appointment.patient?.lastName}`,
                patientEmail: appointment.patient?.email ?? undefined,
                patientPhone: appointment.patient?.phone ?? undefined,
            }
        );
    }
}

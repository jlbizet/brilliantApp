import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentQueryDto } from './dto';
import { PaginationDto } from '../../common/dto';

describe('AppointmentsService', () => {
    let service: AppointmentsService;
    let prisma: any;
    let notificationsService: any;

    const mockPatient = {
        id: 'patient-123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-5678',
    };

    const mockDentist = {
        id: 'dentist-123',
        firstName: 'John',
        lastName: 'Doe',
        specialization: 'Orthodontics',
    };

    const mockAppointment = {
        id: 'appointment-123',
        patientId: 'patient-123',
        dentistId: 'dentist-123',
        title: 'Regular Checkup',
        description: 'Annual dental checkup',
        startTime: new Date('2026-02-20T10:00:00Z'),
        endTime: new Date('2026-02-20T11:00:00Z'),
        status: 'SCHEDULED',
        type: 'general',
        notes: null,
        isRecurring: false,
        recurringPattern: null,
        recurringGroupId: null,
        recurringEndDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        patient: mockPatient,
        dentist: mockDentist,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppointmentsService,
                {
                    provide: PrismaService,
                    useValue: {
                        appointment: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            findFirst: jest.fn(),
                            create: jest.fn(),
                            createMany: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                            count: jest.fn(),
                        },
                        patient: {
                            findUnique: jest.fn(),
                        },
                        user: {
                            findUnique: jest.fn(),
                        },
                    },
                },
                {
                    provide: NotificationsService,
                    useValue: {
                        createAppointmentNotification: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AppointmentsService>(AppointmentsService);
        prisma = module.get<PrismaService>(PrismaService);
        notificationsService = module.get<NotificationsService>(NotificationsService);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        const query = {
            page: 1,
            limit: 10,
            get skip() { return ((this.page ?? 1) - 1) * (this.limit ?? 20); },
        };

        it('should return paginated appointments', async () => {
            const mockAppointments = [mockAppointment];
            prisma.appointment.findMany.mockResolvedValue(mockAppointments);
            prisma.appointment.count.mockResolvedValue(1);

            const result = await service.findAll(query as PaginationDto & AppointmentQueryDto);

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(prisma.appointment.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
                skip: 0,
                take: 10,
                orderBy: { startTime: 'asc' },
            });
        });

        it('should filter by date range', async () => {
            const dateQuery = {
                ...query,
                startDate: '2026-02-01',
                endDate: '2026-02-28',
            };
            prisma.appointment.findMany.mockResolvedValue([mockAppointment]);
            prisma.appointment.count.mockResolvedValue(1);

            await service.findAll(dateQuery as any);

            expect(prisma.appointment.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        startTime: {
                            gte: new Date('2026-02-01'),
                            lte: new Date('2026-02-28'),
                        },
                    },
                }),
            );
        });
    });

    describe('getCalendar', () => {
        const query: AppointmentQueryDto = {
            startDate: '2026-02-01',
            endDate: '2026-02-28',
        };

        it('should return appointments for calendar view', async () => {
            prisma.appointment.findMany.mockResolvedValue([mockAppointment]);

            const result = await service.getCalendar(query);

            expect(result).toHaveLength(1);
            expect(prisma.appointment.findMany).toHaveBeenCalledWith({
                where: {
                    startTime: { gte: new Date('2026-02-01') },
                    endTime: { lte: new Date('2026-02-28') },
                },
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { startTime: 'asc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return appointment with relations', async () => {
            prisma.appointment.findUnique.mockResolvedValue(mockAppointment);

            const result = await service.findOne('appointment-123');

            expect(result).toEqual(mockAppointment);
            expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
                where: { id: 'appointment-123' },
                include: {
                    patient: true,
                    dentist: { select: { id: true, firstName: true, lastName: true, specialization: true } },
                },
            });
        });

        it('should throw NotFoundException if appointment not found', async () => {
            prisma.appointment.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        const createDto: CreateAppointmentDto = {
            patientId: 'patient-123',
            dentistId: 'dentist-123',
            title: 'Regular Checkup',
            description: 'Annual dental checkup',
            startTime: '2026-02-20T10:00:00Z',
            endTime: '2026-02-20T11:00:00Z',
            type: 'general',
            isRecurring: false,
        };

        it('should create a single appointment successfully', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.user.findUnique.mockResolvedValue(mockDentist);
            prisma.appointment.findFirst.mockResolvedValue(null);
            prisma.appointment.create.mockResolvedValue(mockAppointment);
            notificationsService.createAppointmentNotification.mockResolvedValue({});

            const result = await service.create(createDto);

            expect(result).toEqual(mockAppointment);
            expect(prisma.appointment.create).toHaveBeenCalledWith({
                data: {
                    ...createDto,
                    startTime: new Date(createDto.startTime),
                    endTime: new Date(createDto.endTime),
                },
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            expect(notificationsService.createAppointmentNotification).toHaveBeenCalled();
        });

        it('should throw NotFoundException if patient not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(null);

            await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
            await expect(service.create(createDto)).rejects.toThrow('Patient with ID "patient-123" not found');
        });

        it('should throw NotFoundException if dentist not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
            await expect(service.create(createDto)).rejects.toThrow('Dentist with ID "dentist-123" not found');
        });

        it('should throw BadRequestException if time slot conflicts', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.user.findUnique.mockResolvedValue(mockDentist);
            prisma.appointment.findFirst.mockResolvedValue({ id: 'conflict-appointment' });

            await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
            await expect(service.create(createDto)).rejects.toThrow('Time slot conflicts with an existing appointment');
        });

        it('should create recurring appointments', async () => {
            const recurringDto: CreateAppointmentDto = {
                ...createDto,
                isRecurring: true,
                recurringPattern: 'weekly',
                recurringEndDate: '2026-03-20',
            };

            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.user.findUnique.mockResolvedValue(mockDentist);
            prisma.appointment.findFirst.mockResolvedValue(null);
            prisma.appointment.createMany.mockResolvedValue({ count: 5 });

            const result = await service.create(recurringDto);

            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('groupId');
            expect(prisma.appointment.createMany).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        const updateDto: UpdateAppointmentDto = {
            title: 'Updated Title',
            status: 'CONFIRMED',
        };

        it('should update appointment successfully', async () => {
            const oldAppointment = { ...mockAppointment };
            prisma.appointment.findUnique.mockResolvedValueOnce(oldAppointment);
            prisma.appointment.update.mockResolvedValue({ ...mockAppointment, ...updateDto });
            notificationsService.createAppointmentNotification.mockResolvedValue({});

            const result = await service.update('appointment-123', updateDto);

            expect(result.title).toBe('Updated Title');
            expect(result.status).toBe('CONFIRMED');
            expect(prisma.appointment.update).toHaveBeenCalledWith({
                where: { id: 'appointment-123' },
                data: updateDto,
                include: {
                    patient: { select: { id: true, firstName: true, lastName: true } },
                    dentist: { select: { id: true, firstName: true, lastName: true } },
                },
            });
        });

        it('should convert dates when provided', async () => {
            const dtoWithDates: UpdateAppointmentDto = {
                startTime: '2026-02-21T14:00:00Z',
                endTime: '2026-02-21T15:00:00Z',
            };
            const oldAppointment = { ...mockAppointment };
            const updatedAppointment = {
                ...mockAppointment,
                startTime: new Date('2026-02-21T14:00:00Z'),
                endTime: new Date('2026-02-21T15:00:00Z'),
            };
            prisma.appointment.findUnique.mockResolvedValueOnce(oldAppointment);
            prisma.appointment.update.mockResolvedValue(updatedAppointment);
            notificationsService.createAppointmentNotification.mockResolvedValue({});

            const result = await service.update('appointment-123', dtoWithDates);

            expect(prisma.appointment.update).toHaveBeenCalledWith({
                where: { id: 'appointment-123' },
                data: {
                    startTime: new Date('2026-02-21T14:00:00Z'),
                    endTime: new Date('2026-02-21T15:00:00Z'),
                },
                include: expect.any(Object),
            });
            expect(result.startTime).toEqual(new Date('2026-02-21T14:00:00Z'));
        });
    });

    describe('remove', () => {
        it('should delete appointment and send notifications', async () => {
            prisma.appointment.findUnique.mockResolvedValue(mockAppointment);
            prisma.appointment.delete.mockResolvedValue({});
            notificationsService.createAppointmentNotification.mockResolvedValue({});

            const result = await service.remove('appointment-123');

            expect(result).toEqual({ message: 'Appointment deleted successfully' });
            expect(prisma.appointment.delete).toHaveBeenCalledWith({
                where: { id: 'appointment-123' },
            });
            expect(notificationsService.createAppointmentNotification).toHaveBeenCalled();
        });

        it('should throw NotFoundException if appointment not found', async () => {
            prisma.appointment.findUnique.mockResolvedValue(null);

            await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getTodayCount', () => {
        it('should return count of today\'s appointments', async () => {
            prisma.appointment.count.mockResolvedValue(5);

            const result = await service.getTodayCount();

            expect(result).toBe(5);
            expect(prisma.appointment.count).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    status: { notIn: ['CANCELLED'] },
                }),
            });
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, CreateMedicalHistoryDto, CreateAllergyDto } from './dto';
import { PaginationDto } from '../../common/dto';

describe('PatientsService', () => {
    let service: PatientsService;
    let prisma: any;

    const mockPatient = {
        id: 'patient-123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-5678',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'FEMALE',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        emergencyContact: 'John Smith',
        emergencyPhone: '+1-555-9999',
        insuranceProvider: 'Blue Cross',
        insurancePolicyNumber: 'BC123456789',
        insuranceGroupNumber: 'GRP001',
        notes: 'Regular patient',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPatientWithRelations = {
        ...mockPatient,
        medicalHistory: [],
        allergies: [],
        appointments: [],
        treatmentPlans: [],
        documents: [],
        _count: {
            appointments: 5,
            invoices: 3,
            documents: 2,
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PatientsService,
                {
                    provide: PrismaService,
                    useValue: {
                        patient: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            count: jest.fn(),
                        },
                        medicalHistory: {
                            create: jest.fn(),
                            delete: jest.fn(),
                        },
                        allergy: {
                            create: jest.fn(),
                            delete: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<PatientsService>(PatientsService);
        prisma = module.get<PrismaService>(PrismaService);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        const query = {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc' as const,
            get skip() { return ((this.page ?? 1) - 1) * (this.limit ?? 20); },
        };

        it('should return paginated patients', async () => {
            const mockPatients = [{ ...mockPatient, _count: { appointments: 5, treatmentPlans: 2 } }];
            prisma.patient.findMany.mockResolvedValue(mockPatients);
            prisma.patient.count.mockResolvedValue(1);

            const result = await service.findAll(query);

            expect(result.data).toHaveLength(1);
            expect(result.meta.total).toBe(1);
            expect(result.meta.page).toBe(1);
            expect(prisma.patient.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                include: { _count: { select: { appointments: true, treatmentPlans: true } } },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should filter patients by search term', async () => {
            const searchQuery = {
                page: 1,
                limit: 10,
                search: 'Jane',
                sortBy: 'createdAt',
                sortOrder: 'desc' as const,
                get skip() { return ((this.page ?? 1) - 1) * (this.limit ?? 20); },
            };
            const mockPatients = [{ ...mockPatient, _count: { appointments: 5, treatmentPlans: 2 } }];
            prisma.patient.findMany.mockResolvedValue(mockPatients);
            prisma.patient.count.mockResolvedValue(1);

            await service.findAll(searchQuery as PaginationDto);

            expect(prisma.patient.findMany).toHaveBeenCalledWith({
                where: {
                    isActive: true,
                    OR: [
                        { firstName: { contains: 'Jane', mode: 'insensitive' } },
                        { lastName: { contains: 'Jane', mode: 'insensitive' } },
                        { email: { contains: 'Jane', mode: 'insensitive' } },
                        { phone: { contains: 'Jane' } },
                    ],
                },
                include: { _count: { select: { appointments: true, treatmentPlans: true } } },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findOne', () => {
        it('should return patient with relations', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatientWithRelations);

            const result = await service.findOne('patient-123');

            expect(result).toEqual(mockPatientWithRelations);
            expect(prisma.patient.findUnique).toHaveBeenCalledWith({
                where: { id: 'patient-123' },
                include: {
                    medicalHistory: true,
                    allergies: true,
                    appointments: { orderBy: { startTime: 'desc' }, take: 10 },
                    treatmentPlans: { include: { treatments: true } },
                    documents: { orderBy: { uploadedAt: 'desc' } },
                    _count: { select: { appointments: true, invoices: true, documents: true } },
                },
            });
        });

        it('should throw NotFoundException if patient not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(null);

            await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('non-existent')).rejects.toThrow('Patient not found');
        });
    });

    describe('create', () => {
        const createDto: CreatePatientDto = {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1-555-5678',
            dateOfBirth: '1990-05-15',
            gender: 'FEMALE',
        };

        it('should create a new patient', async () => {
            prisma.patient.create.mockResolvedValue(mockPatient);

            const result = await service.create(createDto);

            expect(result).toEqual(mockPatient);
            expect(prisma.patient.create).toHaveBeenCalledWith({
                data: {
                    ...createDto,
                    dateOfBirth: new Date(createDto.dateOfBirth),
                },
            });
        });
    });

    describe('update', () => {
        const updateDto: UpdatePatientDto = {
            firstName: 'Jane Updated',
            phone: '+1-555-9999',
        };

        it('should update patient successfully', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.patient.update.mockResolvedValue({ ...mockPatient, ...updateDto });

            const result = await service.update('patient-123', updateDto);

            expect(result.firstName).toBe('Jane Updated');
            expect(prisma.patient.update).toHaveBeenCalledWith({
                where: { id: 'patient-123' },
                data: updateDto,
            });
        });

        it('should convert dateOfBirth to Date object if provided', async () => {
            const dtoWithDate = { ...updateDto, dateOfBirth: '1991-06-20' };
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.patient.update.mockResolvedValue({ ...mockPatient, ...dtoWithDate });

            await service.update('patient-123', dtoWithDate);

            expect(prisma.patient.update).toHaveBeenCalledWith({
                where: { id: 'patient-123' },
                data: {
                    ...updateDto,
                    dateOfBirth: new Date('1991-06-20'),
                },
            });
        });

        it('should throw NotFoundException if patient not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(null);

            await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should deactivate patient (soft delete)', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.patient.update.mockResolvedValue({ ...mockPatient, isActive: false });

            const result = await service.remove('patient-123');

            expect(result).toEqual({ message: 'Patient deactivated successfully' });
            expect(prisma.patient.update).toHaveBeenCalledWith({
                where: { id: 'patient-123' },
                data: { isActive: false },
            });
        });

        it('should throw NotFoundException if patient not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(null);

            await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    describe('addMedicalHistory', () => {
        const dto: CreateMedicalHistoryDto = {
            condition: 'Diabetes',
            description: 'Type 2 diabetes',
            isOngoing: true,
            diagnosedAt: '2020-01-15',
        };

        const mockMedicalHistory = {
            id: 'history-123',
            patientId: 'patient-123',
            condition: 'Diabetes',
            description: 'Type 2 diabetes',
            isOngoing: true,
            diagnosedAt: new Date('2020-01-15'),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should add medical history to patient', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.medicalHistory.create.mockResolvedValue(mockMedicalHistory);

            const result = await service.addMedicalHistory('patient-123', dto);

            expect(result).toEqual(mockMedicalHistory);
            expect(prisma.medicalHistory.create).toHaveBeenCalledWith({
                data: {
                    ...dto,
                    patientId: 'patient-123',
                    diagnosedAt: new Date('2020-01-15'),
                },
            });
        });

        it('should throw NotFoundException if patient not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(null);

            await expect(service.addMedicalHistory('non-existent', dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeMedicalHistory', () => {
        it('should remove medical history entry', async () => {
            prisma.medicalHistory.delete.mockResolvedValue({});

            const result = await service.removeMedicalHistory('history-123');

            expect(result).toEqual({ message: 'Medical history entry removed' });
            expect(prisma.medicalHistory.delete).toHaveBeenCalledWith({
                where: { id: 'history-123' },
            });
        });
    });

    describe('addAllergy', () => {
        const dto: CreateAllergyDto = {
            allergen: 'Penicillin',
            severity: 'severe',
            reaction: 'Rash and difficulty breathing',
        };

        const mockAllergy = {
            id: 'allergy-123',
            patientId: 'patient-123',
            allergen: 'Penicillin',
            severity: 'severe',
            reaction: 'Rash and difficulty breathing',
            createdAt: new Date(),
        };

        it('should add allergy to patient', async () => {
            prisma.patient.findUnique.mockResolvedValue(mockPatient);
            prisma.allergy.create.mockResolvedValue(mockAllergy);

            const result = await service.addAllergy('patient-123', dto);

            expect(result).toEqual(mockAllergy);
            expect(prisma.allergy.create).toHaveBeenCalledWith({
                data: { ...dto, patientId: 'patient-123' },
            });
        });

        it('should throw NotFoundException if patient not found', async () => {
            prisma.patient.findUnique.mockResolvedValue(null);

            await expect(service.addAllergy('non-existent', dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeAllergy', () => {
        it('should remove allergy entry', async () => {
            prisma.allergy.delete.mockResolvedValue({});

            const result = await service.removeAllergy('allergy-123');

            expect(result).toEqual({ message: 'Allergy removed' });
            expect(prisma.allergy.delete).toHaveBeenCalledWith({
                where: { id: 'allergy-123' },
            });
        });
    });
});

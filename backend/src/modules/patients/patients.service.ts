import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto, CreateMedicalHistoryDto, CreateAllergyDto } from './dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class PatientsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: PaginationDto) {
        const where: any = { isActive: true };
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { phone: { contains: query.search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.patient.findMany({
                where,
                include: { _count: { select: { appointments: true, treatmentPlans: true } } },
                skip: query.skip,
                take: query.limit,
                orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
            }),
            this.prisma.patient.count({ where }),
        ]);

        return new PaginatedResponseDto(data, total, query.page!, query.limit!);
    }

    async findOne(id: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { id },
            include: {
                medicalHistory: true,
                allergies: true,
                appointments: { orderBy: { startTime: 'desc' }, take: 10 },
                treatmentPlans: { include: { treatments: true } },
                documents: { orderBy: { uploadedAt: 'desc' } },
                _count: { select: { appointments: true, invoices: true, documents: true } },
            },
        });
        if (!patient) throw new NotFoundException('Patient not found');
        return patient;
    }

    async create(dto: CreatePatientDto) {
        return this.prisma.patient.create({
            data: { ...dto, dateOfBirth: new Date(dto.dateOfBirth) },
        });
    }

    async update(id: string, dto: UpdatePatientDto) {
        await this.findOne(id);
        const data: any = { ...dto };
        if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
        return this.prisma.patient.update({ where: { id }, data });
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.patient.update({ where: { id }, data: { isActive: false } });
        return { message: 'Patient deactivated successfully' };
    }

    // Medical History
    async addMedicalHistory(patientId: string, dto: CreateMedicalHistoryDto) {
        await this.findOne(patientId);
        return this.prisma.medicalHistory.create({
            data: {
                ...dto,
                patientId,
                diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : null,
            },
        });
    }

    async removeMedicalHistory(id: string) {
        await this.prisma.medicalHistory.delete({ where: { id } });
        return { message: 'Medical history entry removed' };
    }

    // Allergies
    async addAllergy(patientId: string, dto: CreateAllergyDto) {
        await this.findOne(patientId);
        return this.prisma.allergy.create({ data: { ...dto, patientId } });
    }

    async removeAllergy(id: string) {
        await this.prisma.allergy.delete({ where: { id } });
        return { message: 'Allergy removed' };
    }
}

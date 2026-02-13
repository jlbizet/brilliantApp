import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto';

@Injectable()
export class PrescriptionsService {
    constructor(private prisma: PrismaService) { }

    async findAll(patientId?: string) {
        const where: any = {};
        if (patientId) {
            where.patientId = patientId;
        }

        return this.prisma.prescription.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { prescribedAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
        });
        if (!prescription) throw new NotFoundException('Prescription not found');
        return prescription;
    }

    async create(dto: CreatePrescriptionDto) {
        return this.prisma.prescription.create({
            data: {
                patientId: dto.patientId,
                medication: dto.medication,
                dosage: dto.dosage,
                frequency: dto.frequency,
                duration: dto.duration,
                notes: dto.notes,
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async update(id: string, dto: UpdatePrescriptionDto) {
        await this.findOne(id);
        return this.prisma.prescription.update({
            where: { id },
            data: dto,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.prescription.delete({ where: { id } });
        return { message: 'Prescription deleted successfully' };
    }
}

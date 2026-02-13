import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto, CreateTreatmentDto, UpdateTreatmentDto } from './dto';

@Injectable()
export class TreatmentsService {
    constructor(private prisma: PrismaService) { }

    async findAllPlans(patientId?: string) {
        const where: any = {};
        if (patientId) where.patientId = patientId;
        return this.prisma.treatmentPlan.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                treatments: true,
                _count: { select: { treatments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOnePlan(id: string) {
        const plan = await this.prisma.treatmentPlan.findUnique({
            where: { id },
            include: { patient: true, treatments: { orderBy: { createdAt: 'asc' } } },
        });
        if (!plan) throw new NotFoundException('Treatment plan not found');
        return plan;
    }

    async createPlan(dto: CreateTreatmentPlanDto) {
        return this.prisma.treatmentPlan.create({
            data: dto as any,
            include: { patient: { select: { id: true, firstName: true, lastName: true } }, treatments: true },
        });
    }

    async updatePlan(id: string, dto: UpdateTreatmentPlanDto) {
        await this.findOnePlan(id);
        return this.prisma.treatmentPlan.update({ where: { id }, data: dto as any });
    }

    async deletePlan(id: string) {
        await this.findOnePlan(id);
        await this.prisma.treatmentPlan.delete({ where: { id } });
        return { message: 'Treatment plan deleted' };
    }

    async createTreatment(dto: CreateTreatmentDto) {
        return this.prisma.treatment.create({ data: dto as any });
    }

    async updateTreatment(id: string, dto: UpdateTreatmentDto) {
        const data: any = { ...dto };
        if (dto.status === 'COMPLETED') data.performedAt = new Date();
        return this.prisma.treatment.update({ where: { id }, data });
    }

    async deleteTreatment(id: string) {
        await this.prisma.treatment.delete({ where: { id } });
        return { message: 'Treatment deleted' };
    }
}

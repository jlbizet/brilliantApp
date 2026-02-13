import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOdontogramDto, UpdateOdontogramDto, CreateToothConditionDto, UpdateToothConditionDto } from './dto';

@Injectable()
export class OdontogramService {
    constructor(private prisma: PrismaService) { }

    async findByPatient(patientId: string) {
        const odontogram = await this.prisma.odontogram.findUnique({
            where: { patientId },
            include: {
                conditions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!odontogram) {
            // Auto-create for convenience if it doesn't exist? 
            // Better to return null or throw depending on requirement. 
            // For this app, let's return null to let frontend decide or create explicitly.
            return null;
        }

        return odontogram;
    }

    async createOrGet(dto: CreateOdontogramDto) {
        const existing = await this.prisma.odontogram.findUnique({
            where: { patientId: dto.patientId }
        });

        if (existing) return existing;

        return this.prisma.odontogram.create({
            data: dto
        });
    }

    async update(id: string, dto: UpdateOdontogramDto) {
        return this.prisma.odontogram.update({
            where: { id },
            data: dto
        });
    }

    async addCondition(patientId: string, dto: CreateToothConditionDto) {
        let odontogram = await this.prisma.odontogram.findUnique({
            where: { patientId }
        });

        if (!odontogram) {
            // Initialize default odontogram if missing
            odontogram = await this.prisma.odontogram.create({
                data: { patientId }
            });
        }

        return this.prisma.toothCondition.create({
            data: {
                odontogramId: odontogram.id,
                ...dto
            }
        });
    }

    async updateCondition(conditionId: string, dto: UpdateToothConditionDto) {
        const condition = await this.prisma.toothCondition.findUnique({
            where: { id: conditionId }
        });

        if (!condition) throw new NotFoundException('Condition not found');

        return this.prisma.toothCondition.update({
            where: { id: conditionId },
            data: dto
        });
    }

    async removeCondition(conditionId: string) {
        return this.prisma.toothCondition.delete({
            where: { id: conditionId }
        });
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWaitlistEntryDto, UpdateWaitlistEntryDto } from './dto/waitlist.dto';

@Injectable()
export class WaitlistService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.waitlistEntry.findMany({
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' },
            ],
        });
    }

    async findByPatient(patientId: string) {
        return this.prisma.waitlistEntry.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(dto: CreateWaitlistEntryDto) {
        return this.prisma.waitlistEntry.create({
            data: dto,
            include: {
                patient: true,
            },
        });
    }

    async update(id: string, dto: UpdateWaitlistEntryDto) {
        const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
        if (!entry) throw new NotFoundException('Waitlist entry not found');

        return this.prisma.waitlistEntry.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });
        if (!entry) throw new NotFoundException('Waitlist entry not found');

        return this.prisma.waitlistEntry.delete({ where: { id } });
    }
}

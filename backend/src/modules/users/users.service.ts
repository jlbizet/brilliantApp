import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: PaginationDto) {
        const where: any = {};
        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, specialization: true, licenseNumber: true, isActive: true, lastLoginAt: true, createdAt: true },
                skip: query.skip,
                take: query.limit,
                orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return new PaginatedResponseDto(data, total, query.page!, query.limit!);
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, avatar: true, specialization: true, licenseNumber: true, isActive: true, lastLoginAt: true, createdAt: true },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async create(dto: CreateUserDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email already exists');

        const hashedPassword = await bcrypt.hash(dto.password, 12);
        return this.prisma.user.create({
            data: { ...dto, password: hashedPassword },
            select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, specialization: true, licenseNumber: true, isActive: true, createdAt: true },
        });
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id);
        const data: any = { ...dto };
        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 12);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, specialization: true, licenseNumber: true, isActive: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.user.delete({ where: { id } });
        return { message: 'User deleted successfully' };
    }

    async getDentists() {
        return this.prisma.user.findMany({
            where: { role: { in: ['DENTIST', 'HYGIENIST'] }, isActive: true },
            select: { id: true, firstName: true, lastName: true, role: true, specialization: true, licenseNumber: true },
            orderBy: { firstName: 'asc' },
        });
    }

    async updatePassword(id: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) throw new ConflictException('Current password is incorrect');

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return { message: 'Password updated successfully' };
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async findByUser(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({ where: { userId, isRead: false } });
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    }

    async markAllRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { message: 'All notifications marked as read' };
    }

    async create(userId: string, title: string, message: string, type: any = 'GENERAL') {
        return this.prisma.notification.create({
            data: { userId, title, message, type },
        });
    }
}

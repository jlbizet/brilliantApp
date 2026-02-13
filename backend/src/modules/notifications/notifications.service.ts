import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private notificationGateway: NotificationGateway,
    ) { }

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
        const notification = await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
        return notification;
    }

    async markAllRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { message: 'All notifications marked as read' };
    }

    /**
     * Create a single notification and optionally send via WebSocket
     */
    async create(params: {
        userId?: string;
        recipientPatientId?: string;
        title: string;
        message: string;
        type?: string;
        sendRealtime?: boolean;
    }) {
        const data: any = {
            title: params.title,
            message: params.message,
            type: params.type || 'GENERAL',
        };

        if (params.userId) data.userId = params.userId;
        if (params.recipientPatientId) data.recipientPatientId = params.recipientPatientId;

        const notification = await this.prisma.notification.create({
            data
        });

        if (params.sendRealtime && params.userId) {
            await this.notificationGateway.sendNotification(params.userId, notification);
        }
        return notification;
    }

    /**
     * Create multiple notifications at once
     */
    async createMultiple(notifications: Array<{ userId?: string; recipientPatientId?: string; title: string; message: string; type?: string }>) {
        const created = await Promise.all(notifications.map(notif =>
            this.create({ userId: notif.userId, recipientPatientId: notif.recipientPatientId, title: notif.title, message: notif.message, type: notif.type ?? 'GENERAL' })
        ));
        return created;
    }

    /**
     * Create appointment notifications for dentist and patient
     */
    async createAppointmentNotification(
        dentistId: string,
        patientId: string,
        dentistTitle: string,
        dentistMessage: string,
        patientTitle: string,
        patientMessage: string,
    ) {
        return this.createMultiple([
            { userId: dentistId, title: dentistTitle, message: dentistMessage, type: 'APPOINTMENT_REMINDER' },
            { recipientPatientId: patientId, title: patientTitle, message: patientMessage, type: 'APPOINTMENT_REMINDER' }
        ]);
    }

    /**
     * Delete old read notifications (for cleanup)
     */
    async cleanupOldNotifications(daysOld: number = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.notification.deleteMany({
            where: {
                isRead: true,
                createdAt: { lt: cutoffDate },
            },
        });

        return { deleted: result.count };
    }
}

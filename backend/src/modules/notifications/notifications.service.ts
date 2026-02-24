import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { CalendarService } from './calendar.service';
import { ConfigService } from '@nestjs/config';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
    userId?: string;
    recipientPatientId?: string;
    title: string;
    message: string;
    type?: NotificationType;
    sendRealtime?: boolean;
    sendEmail?: boolean;
    sendSms?: boolean; // Kept for interface compatibility, but we use calendar instead
    metadata?: any;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private calendarEnabled = false;
    private emailEnabled = false;

    constructor(
        private prisma: PrismaService,
        private notificationGateway: NotificationGateway,
        private emailService: EmailService,
        private calendarService: CalendarService,
        private configService: ConfigService,
    ) {
        const rawEmailEnv = this.configService.get('ENABLE_EMAIL_NOTIFICATIONS');
        this.emailEnabled = rawEmailEnv === 'true' || rawEmailEnv === true;
        // Don't cache calendarEnabled here, check it dynamically to avoid initialization race conditions

        this.logger.log(`Notifications initialized | Email Enabled: ${this.emailEnabled} | Calendar Enabled: checked dynamically`);
    }

    /**
     * Format time for display - Bypasses timezone conversion to preserve original time
     */
    private formatTime(date: Date): string {
        // Extract time components directly from the Date object
        // This bypasses any timezone conversion that might happen with toLocaleTimeString
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        // Convert to 12-hour format
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        
        // Format with leading zeros
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes} ${period}`;
    }

    private isCalendarEnabled(): boolean {
        const enabled = this.calendarService.isSmsEnabled();
        this.logger.log(`[Trace] isCalendarEnabled() = ${enabled}`);
        return enabled;
    }

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

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async create(params: CreateNotificationParams) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: params.userId,
                recipientPatientId: params.recipientPatientId,
                title: params.title,
                message: params.message,
                type: params.type || 'GENERAL',
                metadata: params.metadata || {},
            },
        });

        // Send realtime notification if requested
        if (params.sendRealtime && params.userId) {
            this.notificationGateway.sendNotification(params.userId, {
                id: notification.id,
                title: params.title,
                message: params.message,
                type: params.type,
                createdAt: notification.createdAt,
            });
        }

        return notification;
    }

    async createMultiple(params: CreateNotificationParams[]) {
        return Promise.all(params.map(p => this.create(p)));
    }

    /**
     * Send appointment notification to both dentist and patient
     */
    async createAppointmentNotification(
        dentistId: string,
        patientId: string,
        dentistTitle: string,
        dentistMessage: string,
        patientTitle: string,
        patientMessage: string,
        appointmentData?: {
            startTime: Date;
            dentistName: string;
            patientName: string;
            patientEmail?: string;
            patientPhone?: string | null;
        },
    ) {
        this.logger.log(`createAppointmentNotification called for dentistId=${dentistId}, patientId=${patientId}`);
        const notifications: CreateNotificationParams[] = [
            { userId: dentistId, title: dentistTitle, message: dentistMessage, type: 'APPOINTMENT_REMINDER', sendRealtime: true },
            { recipientPatientId: patientId, title: patientTitle, message: patientMessage, type: 'APPOINTMENT_REMINDER' },
        ];

        // If we have appointment data and patient contact info, send email
        if (appointmentData) {
            // sendEmail: false here to avoid duplicate — email is sent directly below
            const patientNotification: CreateNotificationParams = {
                recipientPatientId: patientId,
                title: patientTitle,
                message: patientMessage,
                type: 'APPOINTMENT_REMINDER',
                sendRealtime: false,
                sendEmail: false,
            };

            // Replace the patient notification with enhanced version
            notifications[1] = patientNotification;

            // Send email directly
            const calendarEnabled = this.isCalendarEnabled();
            this.logger.log(`[Trace] createAppointmentNotification: patientEmail=${appointmentData.patientEmail}, emailEnabled=${this.emailEnabled}, calendarEnabled=${calendarEnabled}`);

            if (appointmentData.patientEmail && this.emailEnabled) {
                const timeStr = this.formatTime(appointmentData.startTime);
                this.logger.log(`[Trace] Email time formatted: ${timeStr}`);

                if (patientTitle === 'Appointment Confirmed') {
                    await this.emailService.sendAppointmentConfirmation({
                        to: appointmentData.patientEmail,
                        patientName: appointmentData.patientName,
                        dentistName: appointmentData.dentistName,
                        appointmentDate: appointmentData.startTime,
                        appointmentTime: timeStr,
                    });
                } else {
                    await this.emailService.sendAppointmentUpdate({
                        to: appointmentData.patientEmail,
                        patientName: appointmentData.patientName,
                        dentistName: appointmentData.dentistName,
                        appointmentDate: appointmentData.startTime,
                        appointmentTime: timeStr,
                        updateType: patientTitle,
                        updateMessage: patientMessage,
                    });
                }
                this.logger.log(`Appointment email sent to ${appointmentData.patientEmail} (Type: ${patientTitle})`);
            }

            // Instead of SMS, send a Calendar Invite for appointment confirmations
            if (appointmentData.patientEmail && calendarEnabled) {
                this.logger.log(`[Trace] Creating calendar event for ${appointmentData.patientEmail}`);
                await this.calendarService.createAppointmentEvent({
                    patientEmail: appointmentData.patientEmail,
                    patientName: appointmentData.patientName,
                    dentistName: appointmentData.dentistName,
                    appointmentDate: appointmentData.startTime,
                });
            } else {
                this.logger.log(`[Trace] Skipping calendar event - patientEmail: ${appointmentData.patientEmail}, calendarEnabled: ${calendarEnabled}`);
            }
        }

        return this.createMultiple(notifications);
    }

    /**
     * Send appointment reminder email and SMS
     */
    async sendAppointmentReminder(
        patientId: string,
        patientEmail: string,
        patientPhone: string | null,
        patientName: string,
        dentistName: string,
        appointmentTime: Date,
    ) {
        const timeStr = this.formatTime(appointmentTime);

        // Send Email reminder
        if (this.emailEnabled && patientEmail) {
            await this.emailService.sendAppointmentReminder({
                to: patientEmail,
                patientName,
                dentistName,
                appointmentDate: appointmentTime,
                appointmentTime: timeStr,
            });
            this.logger.log(`Appointment reminder email sent to ${patientEmail}`);
        }

        // Create in-app notification
        await this.create({
            recipientPatientId: patientId,
            title: 'Appointment Reminder',
            message: `Reminder: Your appointment with Dr. ${dentistName} is tomorrow at ${timeStr}`,
            type: 'APPOINTMENT_REMINDER',
            sendRealtime: false,
        });
    }

    /**
     * Send invoice notification via email and SMS
     */
    async sendInvoiceNotification(
        patientId: string,
        patientEmail: string,
        patientPhone: string | null,
        patientName: string,
        invoiceNumber: string,
        amount: number,
        dueDate: Date,
    ) {
        // Send Email notification
        if (this.emailEnabled && patientEmail) {
            await this.emailService.sendInvoiceNotification({
                to: patientEmail,
                patientName,
                invoiceNumber,
                amount,
                dueDate,
            });
            this.logger.log(`Invoice email sent to ${patientEmail}`);
        }

        // Create in-app notification
        await this.create({
            recipientPatientId: patientId,
            title: 'New Invoice Available',
            message: `Invoice #${invoiceNumber} for $${amount.toFixed(2)} is now available. Due date: ${dueDate.toLocaleDateString()}`,
            type: 'PAYMENT_DUE',
            sendRealtime: false,
        });
    }

    /**
     * Send welcome email to patient
     */
    async sendWelcomeEmail(
        patientId: string,
        patientEmail: string,
        patientName: string,
        loginUrl?: string,
    ) {
        // Send Email
        if (this.emailEnabled && patientEmail) {
            await this.emailService.sendWelcomeEmail({
                to: patientEmail,
                patientName,
                loginUrl,
            });
            this.logger.log(`Welcome email sent to ${patientEmail}`);
        }

        // Create in-app notification
        await this.create({
            recipientPatientId: patientId,
            title: 'Welcome to Brilliant Dental',
            message: 'Your account has been created successfully. Welcome to our clinic!',
            type: 'GENERAL',
            sendRealtime: false,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(
        patientId: string,
        patientEmail: string,
        patientName: string,
        resetToken: string,
        resetUrl: string,
    ) {
        // Send Email
        if (this.emailEnabled && patientEmail) {
            await this.emailService.sendPasswordReset({
                to: patientEmail,
                patientName,
                resetToken,
                resetUrl,
            });
            this.logger.log(`Password reset email sent to ${patientEmail}`);
        }
    }
}

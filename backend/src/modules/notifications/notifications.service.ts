import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { CalendarService } from './calendar.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
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
    sendSms?: boolean;
    metadata?: any;
}

export interface AppointmentNotificationParams {
    dentistId: string;
    patientId: string;
    dentistTitle: string;
    dentistMessage: string;
    patientTitle: string;
    patientMessage: string;
    appointmentData?: {
        startTime: Date;
        endTime?: Date;
        dentistName: string;
        patientName: string;
        patientEmail?: string;
        patientPhone?: string | null;
    };
    /**
     * Context of this notification:
     * - 'create': New appointment created (should create calendar event)
     * - 'update': Appointment updated (should update calendar event if exists)
     * - 'reschedule': Appointment rescheduled (should update/replace calendar event)
     * - 'status': Status changed (should NOT create/update calendar event)
     * - 'reminder': Reminder notification (should NOT create/update calendar event)
     * - 'cancel': Appointment cancelled (should delete calendar event)
     */
    context?: 'create' | 'update' | 'reschedule' | 'status' | 'reminder' | 'cancel' | string;
    /**
     * Google Calendar event ID if already exists
     */
    googleCalendarEventId?: string | null;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private emailEnabled = false;
    private whatsappEnabled = false;

    constructor(
        private prisma: PrismaService,
        private notificationGateway: NotificationGateway,
        private emailService: EmailService,
        private calendarService: CalendarService,
        private whatsAppService: WhatsAppService,
        private configService: ConfigService,
    ) {
        const rawEmailEnv = this.configService.get('ENABLE_EMAIL_NOTIFICATIONS');
        this.emailEnabled = rawEmailEnv === 'true' || rawEmailEnv === true;
        
        const rawWhatsAppEnv = this.configService.get('ENABLE_WHATSAPP_NOTIFICATIONS');
        this.whatsappEnabled = rawWhatsAppEnv === 'true' || rawWhatsAppEnv === true;
        
        this.logger.log(`Notifications initialized | Email: ${this.emailEnabled} | WhatsApp: ${this.whatsappEnabled}`);
    }

    /**
     * Format time for display (uses server local timezone)
     */
    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
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
                type: params.type || NotificationType.GENERAL,
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
     * @returns The Google Calendar event ID (if created/updated), or null
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
            endTime?: Date;
            dentistName: string;
            patientName: string;
            patientEmail?: string;
            patientPhone?: string | null;
        },
        context: 'create' | 'update' | 'reschedule' | 'status' | 'reminder' | 'cancel' | string = 'create',
        existingCalendarEventId?: string | null,
    ): Promise<string | null> {
        this.logger.log(`createAppointmentNotification called: context=${context}, dentistId=${dentistId}, patientId=${patientId}`);
        
        const notifications: CreateNotificationParams[] = [
            { userId: dentistId, title: dentistTitle, message: dentistMessage, type: NotificationType.APPOINTMENT_REMINDER, sendRealtime: true },
            { recipientPatientId: patientId, title: patientTitle, message: patientMessage, type: NotificationType.APPOINTMENT_REMINDER },
        ];

        let calendarEventId: string | null = existingCalendarEventId || null;
        const calendarEnabled = this.isCalendarEnabled();

        // Handle Calendar Event based on context
        if (appointmentData?.patientEmail && calendarEnabled) {
            const calendarParams = {
                patientEmail: appointmentData.patientEmail,
                patientName: appointmentData.patientName,
                dentistName: appointmentData.dentistName,
                appointmentDate: appointmentData.startTime,
                endTime: appointmentData.endTime,
            };

            switch (context) {
                case 'create':
                    // New appointment - create calendar event
                    this.logger.log(`[Calendar] Creating new calendar event for new appointment`);
                    calendarEventId = await this.calendarService.createAppointmentEvent(calendarParams);
                    break;

                case 'reschedule':
                    // Rescheduled - delete old event and create new one
                    if (existingCalendarEventId) {
                        this.logger.log(`[Calendar] Deleting old calendar event ${existingCalendarEventId} and creating new one for reschedule`);
                        await this.calendarService.deleteAppointmentEvent(existingCalendarEventId);
                    }
                    calendarEventId = await this.calendarService.createAppointmentEvent(calendarParams);
                    break;

                case 'update':
                    // Updated (but not rescheduled) - update existing event
                    if (existingCalendarEventId) {
                        this.logger.log(`[Calendar] Updating existing calendar event ${existingCalendarEventId}`);
                        calendarEventId = await this.calendarService.updateAppointmentEvent(existingCalendarEventId, calendarParams);
                    } else {
                        // No existing event, create one
                        this.logger.log(`[Calendar] No existing event to update, creating new one`);
                        calendarEventId = await this.calendarService.createAppointmentEvent(calendarParams);
                    }
                    break;

                case 'cancel':
                    // Cancelled - delete calendar event
                    if (existingCalendarEventId) {
                        this.logger.log(`[Calendar] Deleting calendar event ${existingCalendarEventId} for cancelled appointment`);
                        await this.calendarService.deleteAppointmentEvent(existingCalendarEventId);
                        calendarEventId = null;
                    }
                    break;

                case 'status':
                case 'reminder':
                    // Status changes and reminders - don't touch calendar events
                    this.logger.log(`[Calendar] Skipping calendar event for context: ${context}`);
                    calendarEventId = existingCalendarEventId || null;
                    break;

                default:
                    this.logger.warn(`[Calendar] Unknown context: ${context}, skipping calendar event`);
                    calendarEventId = existingCalendarEventId || null;
            }
        }

        // Send email based on context
        if (appointmentData?.patientEmail && this.emailEnabled) {
            const timeStr = this.formatTime(appointmentData.startTime);
            
            switch (context) {
                case 'create':
                    await this.emailService.sendAppointmentConfirmation({
                        to: appointmentData.patientEmail,
                        patientName: appointmentData.patientName,
                        dentistName: appointmentData.dentistName,
                        appointmentDate: appointmentData.startTime,
                        appointmentTime: timeStr,
                    });
                    break;

                case 'reminder':
                    await this.emailService.sendAppointmentReminder({
                        to: appointmentData.patientEmail,
                        patientName: appointmentData.patientName,
                        dentistName: appointmentData.dentistName,
                        appointmentDate: appointmentData.startTime,
                        appointmentTime: timeStr,
                    });
                    break;

                case 'cancel':
                    // Could add a cancellation email here if needed
                    this.logger.log(`Appointment cancelled - email notification skipped`);
                    break;

                default:
                    // Update, reschedule, status - send update email
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
            
            this.logger.log(`Appointment email sent to ${appointmentData.patientEmail} (Context: ${context})`);
        }

        await this.createMultiple(notifications);
        return calendarEventId;
    }

    /**
     * Send appointment reminder via email, WhatsApp and in-app notification
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
        const dateStr = appointmentTime.toLocaleDateString('es-UY', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

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

        // Send WhatsApp reminder
        if (this.whatsappEnabled && patientPhone) {
            try {
                const patient = await this.prisma.patient.findUnique({
                    where: { id: patientId },
                    select: { whatsappOptIn: true, whatsappNotificationsEnabled: true },
                });

                if (patient?.whatsappOptIn && patient?.whatsappNotificationsEnabled) {
                    await this.whatsAppService.sendAppointmentReminder(
                        patientPhone,
                        patientName,
                        dateStr,
                        timeStr,
                        dentistName,
                    );
                    this.logger.log(`Appointment reminder WhatsApp sent to ${patientPhone}`);
                }
            } catch (error) {
                this.logger.error(`Failed to send WhatsApp reminder: ${error.message}`);
            }
        }

        // Create in-app notification
        await this.create({
            recipientPatientId: patientId,
            title: 'Appointment Reminder',
            message: `Reminder: Your appointment with Dr. ${dentistName} is tomorrow at ${timeStr}`,
            type: NotificationType.APPOINTMENT_REMINDER,
            sendRealtime: false,
        });
    }

    /**
     * Send same-day appointment reminder via WhatsApp
     */
    async sendSameDayReminder(
        patientId: string,
        patientPhone: string | null,
        patientName: string,
        dentistName: string,
        appointmentTime: Date,
    ) {
        if (!this.whatsappEnabled || !patientPhone) return;

        const timeStr = this.formatTime(appointmentTime);

        try {
            const patient = await this.prisma.patient.findUnique({
                where: { id: patientId },
                select: { whatsappOptIn: true, whatsappNotificationsEnabled: true },
            });

            if (patient?.whatsappOptIn && patient?.whatsappNotificationsEnabled) {
                await this.whatsAppService.sendSameDayReminder(
                    patientPhone,
                    patientName,
                    timeStr,
                    dentistName,
                );
                this.logger.log(`Same-day WhatsApp reminder sent to ${patientPhone}`);
            }
        } catch (error) {
            this.logger.error(`Failed to send same-day WhatsApp reminder: ${error.message}`);
        }
    }

    /**
     * Send invoice notification via email
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
            type: NotificationType.PAYMENT_DUE,
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
            type: NotificationType.SYSTEM,
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

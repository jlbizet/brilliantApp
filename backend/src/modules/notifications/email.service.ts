import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';

export interface EmailTemplateData {
    [key: string]: string | number | boolean;
}

type Language = 'en' | 'es';

const TRANSLATIONS = {
    en: {
        appointmentReminder: {
            title: 'Appointment Reminder',
            greeting: 'We look forward to seeing you!',
            subtitle: 'This is a friendly reminder of your upcoming appointment:',
            date: 'DATE',
            time: 'TIME',
            dentist: 'DENTIST',
            location: 'Location',
            confirmWhatsApp: 'Confirm via WhatsApp',
            viewMaps: 'View Location in Maps',
            arrivalNote: 'Please arrive 10 minutes before your scheduled time.',
            contact: 'Contact',
            thankYou: 'Thank you for choosing',
            automatedReminder: 'This is an automated reminder. Please do not reply to this email.',
            copyright: 'All rights reserved.',
        },
        appointmentConfirmation: {
            title: 'Appointment Confirmed',
            greeting: 'Your appointment has been scheduled!',
            subtitle: 'Here are the details:',
            date: 'DATE',
            time: 'TIME',
            dentist: 'DENTIST',
            location: 'Location',
            contact: 'Contact',
            thankYou: 'Thank you for choosing',
            questions: 'If you have any questions, please contact us.',
            copyright: 'All rights reserved.',
        },
        appointmentUpdate: {
            title: 'Appointment Update',
            greeting: 'Your appointment has been updated.',
            date: 'DATE',
            time: 'TIME',
            dentist: 'DENTIST',
            location: 'Location',
            contact: 'Contact',
            thankYou: 'Thank you for choosing',
            questions: 'If you have any questions, please contact us.',
            copyright: 'All rights reserved.',
            rescheduled: 'Your appointment has been rescheduled to',
            statusUpdated: 'Your appointment status has been updated to',
            detailsUpdated: 'Your appointment details have been updated',
            cancelled: 'Your appointment has been cancelled',
        },
        appointmentCancelled: {
            title: 'Appointment Cancelled',
            greeting: 'Your appointment has been cancelled.',
            subtitle: 'We hope to see you soon!',
            date: 'DATE',
            time: 'TIME',
            dentist: 'DENTIST',
            contact: 'Contact',
            reschedule: 'To reschedule, please contact us.',
            thankYou: 'Thank you for choosing',
        },
    },
    es: {
        appointmentReminder: {
            title: 'Recordatorio de Cita',
            greeting: '¡Te esperamos!',
            subtitle: 'Este es un recordatorio de tu próxima cita:',
            date: 'FECHA',
            time: 'HORA',
            dentist: 'DENTISTA',
            location: 'Ubicación',
            confirmWhatsApp: 'Confirmar vía WhatsApp',
            viewMaps: 'Ver Ubicación en Mapa',
            arrivalNote: 'Por favor llega 10 minutos antes de tu hora programada.',
            contact: 'Contacto',
            thankYou: 'Gracias por elegir',
            automatedReminder: 'Este es un recordatorio automático. Por favor no respondas a este correo.',
            copyright: 'Todos los derechos reservados.',
        },
        appointmentConfirmation: {
            title: 'Cita Confirmada',
            greeting: '¡Tu cita ha sido programada!',
            subtitle: 'Aquí están los detalles:',
            date: 'FECHA',
            time: 'HORA',
            dentist: 'DENTISTA',
            location: 'Ubicación',
            contact: 'Contacto',
            thankYou: 'Gracias por elegir',
            questions: 'Si tienes alguna pregunta, por favor contáctanos.',
            copyright: 'Todos los derechos reservados.',
        },
        appointmentUpdate: {
            title: 'Cita Actualizada',
            greeting: 'Tu cita ha sido actualizada.',
            date: 'FECHA',
            time: 'HORA',
            dentist: 'DENTISTA',
            location: 'Ubicación',
            contact: 'Contacto',
            thankYou: 'Gracias por elegir',
            questions: 'Si tienes alguna pregunta, por favor contáctanos.',
            copyright: 'Todos los derechos reservados.',
            rescheduled: 'Tu cita ha sido reprogramada para el',
            statusUpdated: 'El estado de tu cita ha sido actualizado a',
            detailsUpdated: 'Los detalles de tu cita han sido actualizados',
            cancelled: 'Tu cita ha sido cancelada',
        },
        appointmentCancelled: {
            title: 'Cita Cancelada',
            greeting: 'Tu cita ha sido cancelada.',
            subtitle: '¡esperamos verte pronto!',
            date: 'FECHA',
            time: 'HORA',
            dentist: 'DENTISTA',
            contact: 'Contacto',
            reschedule: 'Para reprogramar, por favor contáctanos.',
            thankYou: 'Gracias por elegir',
        },
    },
};

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private isConfigured = false;
    private readonly timezone: string;
    private readonly defaultLanguage: Language;

    constructor(private configService: ConfigService) {
        this.timezone = this.configService.get<string>('CLINIC_TIMEZONE') || process.env.CLINIC_TIMEZONE || 'UTC';
        const appLang = process.env.APP_LANGUAGE;
        this.defaultLanguage = appLang === 'en' ? 'en' : 'es';

        this.logger.log(`Email service initialized with language: ${this.defaultLanguage}, timezone: ${this.timezone}`);

        const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
        const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASS');

        if (smtpUser && smtpUser !== 'your_email@gmail.com' && smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                tls: {
                    // Do not fail on invalid certs or when behind proxies
                    rejectUnauthorized: false
                },
                // Add timeouts so it doesn't hang forever
                connectionTimeout: 10000,
                greetingTimeout: 5000,
                socketTimeout: 20000,
                // Force IPv4 using a custom lookup function as a fail-safe
                lookup: (hostname: string, options: any, callback: (err: any, address: string | any, family: number) => void) => {
                    dns.lookup(hostname, { family: 4 }, callback);
                }
            } as any);

            // Verify the connection configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    this.logger.error(`SMTP Connection Error [${smtpHost}:${smtpPort}]:`, error);
                } else {
                    this.logger.log('SMTP Server is ready to take our messages');
                }
            });

            this.isConfigured = true;
            this.logger.log(`Nodemailer SMTP email service configured on ${smtpHost}:${smtpPort}`);
        } else {
            this.logger.warn('SMTP credentials not configured. Email notifications will be disabled.');
        }
    }

    /**
     * Format date for display (uses configured clinic timezone)
     */
    private formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: this.timezone
        }).format(date);
    }

    /**
     * Send an email using Nodemailer
     */
    async sendEmail(options: {
        to: string;
        subject: string;
        html: string;
        text?: string;
        from?: string;
        fromName?: string;
    }): Promise<boolean> {
        if (!this.isConfigured || !this.transporter) {
            this.logger.warn('Email service not configured. Skipping email to:', options.to);
            return false;
        }

        try {
            const fromEmail = options.from || this.configService.get<string>('SMTP_USER');
            const fromName = options.fromName || this.configService.get<string>('EMAIL_FROM_NAME') || 'Brilliant Dental Clinic';

            const info = await this.transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: options.to,
                subject: options.subject,
                text: options.text || this.stripHtml(options.html),
                html: options.html,
            });

            this.logger.log(`Email sent successfully to ${options.to}, Message ID: ${info.messageId}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${options.to}:`, error.message);
            return false;
        }
    }

    /**
     * Send appointment reminder email
     */
    async sendAppointmentReminder(params: {
        to: string;
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        appointmentTime: string;
        clinicName?: string;
        clinicAddress?: string;
        clinicPhone?: string;
        language?: Language;
    }): Promise<boolean> {
        const lang = params.language || this.defaultLanguage;
        const html = this.getAppointmentReminderTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: lang === 'es' ? `Recordatorio de Cita - ${params.clinicName || 'Brilliant Dental'}` : `Appointment Reminder - ${params.clinicName || 'Brilliant Dental'}`,
            html,
        });
    }

    /**
     * Send appointment confirmation email
     */
    async sendAppointmentConfirmation(params: {
        to: string;
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        appointmentTime: string;
        clinicName?: string;
        clinicAddress?: string;
        clinicPhone?: string;
        language?: Language;
    }): Promise<boolean> {
        const lang = params.language || this.defaultLanguage;
        const html = this.getAppointmentConfirmationTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: lang === 'es' ? `Cita Confirmada - ${params.clinicName || 'Brilliant Dental'}` : `Appointment Confirmed - ${params.clinicName || 'Brilliant Dental'}`,
            html,
        });
    }

    /**
     * Send appointment update email
     */
    async sendAppointmentUpdate(params: {
        to: string;
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        appointmentTime: string;
        updateType: string;
        updateMessage: string;
        clinicName?: string;
        clinicAddress?: string;
        clinicPhone?: string;
        language?: Language;
    }): Promise<boolean> {
        const lang = params.language || this.defaultLanguage;
        const html = this.getAppointmentUpdateTemplate(params);

        const subject = lang === 'es'
            ? `Cita Actualizada - ${params.clinicName || 'Brilliant Dental'}`
            : `Appointment Update - ${params.clinicName || 'Brilliant Dental'}`;

        return this.sendEmail({
            to: params.to,
            subject,
            html,
        });
    }

    /**
     * Send invoice email
     */
    async sendInvoiceNotification(params: {
        to: string;
        patientName: string;
        invoiceNumber: string;
        amount: number;
        dueDate: Date;
        clinicName?: string;
        invoiceUrl?: string;
    }): Promise<boolean> {
        const html = this.getInvoiceTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: `Invoice #${params.invoiceNumber} - ${params.clinicName || 'Brilliant Dental'}`,
            html,
        });
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(params: {
        to: string;
        patientName: string;
        clinicName?: string;
        loginUrl?: string;
    }): Promise<boolean> {
        const html = this.getWelcomeTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: `Welcome to ${params.clinicName || 'Brilliant Dental'}`,
            html,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(params: {
        to: string;
        patientName: string;
        resetToken: string;
        resetUrl: string;
        clinicName?: string;
    }): Promise<boolean> {
        const html = this.getPasswordResetTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: `Password Reset Request - ${params.clinicName || 'Brilliant Dental'}`,
            html,
        });
    }

    /**
     * Appointment Reminder Template
     */
    private getAppointmentReminderTemplate(params: {
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        appointmentTime: string;
        clinicName?: string;
        clinicAddress?: string;
        clinicPhone?: string;
        language?: Language;
    }): string {
        const lang = (params.language || this.defaultLanguage) as Language;
        const t = TRANSLATIONS[lang].appointmentReminder;

        const dateStr = this.formatDate(params.appointmentDate);
        const clinicName = params.clinicName || 'Brilliant Dental';
        const clinicPhone = params.clinicPhone || '+598 9000 0000';
        const clinicAddress = params.clinicAddress || 'Av. 18 de Julio, Montevideo, Uruguay';

        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress)}`;
        const whatsappText = lang === 'es'
            ? `Hola, quiero confirmar mi cita para el ${dateStr} a las ${params.appointmentTime}`
            : `Hello, I want to confirm my appointment for ${dateStr} at ${params.appointmentTime}`;
        const whatsappUrl = `https://wa.me/${clinicPhone.replace(/\s+/g, '')}?text=${encodeURIComponent(whatsappText)}`;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t.title}</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">${clinicName}</h1>
                    <p style="color: rgba(255,255,255,0.8); margin-top: 10px;">${t.greeting}</p>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <h2 style="color: #667eea; margin-top: 0; font-size: 22px;">${t.title}</h2>
                    <p>${lang === 'es' ? 'Hola' : 'Hello'} <strong>${params.patientName}</strong>,</p>
                    <p>${t.subtitle}</p>
                    
                    <div style="background: #f8faff; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #eef2ff;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="padding-bottom: 10px; color: #6b7280; font-size: 14px; width: 80px;">${t.date}</td>
                                <td style="padding-bottom: 10px; color: #1f2937; font-weight: 600;">${dateStr}</td>
                            </tr>
                            <tr>
                                <td style="padding-bottom: 10px; color: #6b7280; font-size: 14px;">${t.time}</td>
                                <td style="padding-bottom: 10px; color: #1f2937; font-weight: 600;">${params.appointmentTime}</td>
                            </tr>
                            <tr>
                                <td style="padding-bottom: 0; color: #6b7280; font-size: 14px;">${t.dentist}</td>
                                <td style="padding-bottom: 0; color: #1f2937; font-weight: 600;">Dr. ${params.dentistName}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${whatsappUrl}" style="display: inline-block; background-color: #25d366; color: white; padding: 14px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-bottom: 10px; width: 80%;">
                            ${t.confirmWhatsApp}
                        </a>
                        <br>
                        <a href="${mapsUrl}" style="display: inline-block; background-color: #ffffff; color: #4285f4; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: 600; border: 1px solid #4285f4; width: 80%;">
                            ${t.viewMaps}
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #4b5563;">
                        <strong>${t.location}:</strong> ${clinicAddress}<br>
                        <strong>${t.contact}:</strong> ${clinicPhone}
                    </p>
                    
                    <p style="margin-top: 30px; font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                        ${t.arrivalNote}
                    </p>
                    
                    <p style="margin-top: 25px; font-size: 12px; color: #9ca3af; text-align: center;">
                        © ${new Date().getFullYear()} ${clinicName}. ${t.copyright}<br>
                        ${t.automatedReminder}
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Appointment Confirmation Template
     */
    private getAppointmentConfirmationTemplate(params: {
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        appointmentTime: string;
        clinicName?: string;
        clinicAddress?: string;
        clinicPhone?: string;
        language?: Language;
    }): string {
        const lang = (params.language || this.defaultLanguage) as Language;
        const t = TRANSLATIONS[lang].appointmentConfirmation;

        const dateStr = this.formatDate(params.appointmentDate);
        const clinicName = params.clinicName || 'Brilliant Dental';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t.title}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${clinicName}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #11998e; margin-top: 0;">✓ ${t.title}</h2>
                    <p>${lang === 'es' ? 'Hola' : 'Hello'} ${params.patientName},</p>
                    <p>${t.subtitle}</p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                        <p style="margin: 5px 0;"><strong>${t.date}:</strong> ${dateStr}</p>
                        <p style="margin: 5px 0;"><strong>${t.time}:</strong> ${params.appointmentTime}</p>
                        <p style="margin: 5px 0;"><strong>${t.dentist}:</strong> Dr. ${params.dentistName}</p>
                    </div>
                    
                    ${params.clinicAddress ? `<p><strong>${t.location}:</strong><br>${params.clinicAddress}</p>` : ''}
                    ${params.clinicPhone ? `<p><strong>${t.contact}:</strong> ${params.clinicPhone}</p>` : ''}
                    
                    <p style="margin-top: 30px;">${t.greeting}</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        ${t.thankYou} ${clinicName}!
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Appointment Update Template
     */
    private getAppointmentUpdateTemplate(params: {
        patientName: string;
        dentistName: string;
        appointmentDate: Date;
        appointmentTime: string;
        updateType: string;
        updateMessage: string;
        clinicName?: string;
        clinicAddress?: string;
        clinicPhone?: string;
        language?: Language;
    }): string {
        const lang = (params.language || this.defaultLanguage) as Language;
        const t = TRANSLATIONS[lang].appointmentUpdate;

        const dateStr = this.formatDate(params.appointmentDate);
        const clinicName = params.clinicName || 'Brilliant Dental';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t.title}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${clinicName}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #fda085; margin-top: 0;">${t.title}</h2>
                    <p>${lang === 'es' ? 'Hola' : 'Hello'} ${params.patientName},</p>
                    <p>${params.updateMessage}</p>
                    
                    <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffb300;">
                        <p style="margin: 5px 0;"><strong>${t.date}:</strong> ${dateStr}</p>
                        <p style="margin: 5px 0;"><strong>${t.time}:</strong> ${params.appointmentTime}</p>
                        <p style="margin: 5px 0;"><strong>${t.dentist}:</strong> Dr. ${params.dentistName}</p>
                    </div>
                    
                    ${params.clinicAddress ? `<p><strong>${t.location}:</strong><br>${params.clinicAddress}</p>` : ''}
                    ${params.clinicPhone ? `<p><strong>${t.contact}:</strong> ${params.clinicPhone}</p>` : ''}
                    
                    <p style="margin-top: 30px;">${t.questions}</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        ${t.thankYou} ${clinicName}!
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Invoice Template
     */
    private getInvoiceTemplate(params: {
        patientName: string;
        invoiceNumber: string;
        amount: number;
        dueDate: Date;
        clinicName?: string;
        invoiceUrl?: string;
    }): string {
        const dueDateStr = params.dueDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${params.clinicName || 'Brilliant Dental'}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #f5576c; margin-top: 0;">Invoice Available</h2>
                    <p>Hello ${params.patientName},</p>
                    <p>A new invoice has been generated for your recent treatment:</p>
                    
                    <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                        <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${params.invoiceNumber}</p>
                        <p style="margin: 5px 0;"><strong>Amount Due:</strong> $${params.amount.toFixed(2)}</p>
                        <p style="margin: 5px 0;"><strong>Due Date:</strong> ${dueDateStr}</p>
                    </div>
                    
                    ${params.invoiceUrl ? `<p><a href="${params.invoiceUrl}" style="display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Invoice</a></p>` : ''}
                    
                    <p style="margin-top: 30px;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Thank you for your business!<br>
                        ${params.clinicName || 'Brilliant Dental'}
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Welcome Email Template
     */
    private getWelcomeTemplate(params: {
        patientName: string;
        clinicName?: string;
        loginUrl?: string;
    }): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${params.clinicName || 'Brilliant Dental'}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #4facfe; margin-top: 0;">Hello ${params.patientName}!</h2>
                    <p>Thank you for joining ${params.clinicName || 'Brilliant Dental'}. We're excited to be your dental care partner.</p>
                    
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1976d2;">What you can do:</h3>
                        <ul style="padding-left: 20px;">
                            <li>Schedule appointments online</li>
                            <li>View your treatment history</li>
                            <li>Access invoices and payment history</li>
                            <li>Receive appointment reminders</li>
                        </ul>
                    </div>
                    
                    ${params.loginUrl ? `<p><a href="${params.loginUrl}" style="display: inline-block; background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Access Your Account</a></p>` : ''}
                    
                    <p style="margin-top: 30px;">If you have any questions, our team is here to help.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Welcome aboard!<br>
                        The ${params.clinicName || 'Brilliant Dental'} Team
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Password Reset Template
     */
    private getPasswordResetTemplate(params: {
        patientName: string;
        resetToken: string;
        resetUrl: string;
        clinicName?: string;
    }): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${params.clinicName || 'Brilliant Dental'}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #fa709a; margin-top: 0;">Password Reset Request</h2>
                    <p>Hello ${params.patientName},</p>
                    <p>We received a request to reset your password. If you made this request, click the button below to reset your password:</p>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${params.resetUrl}" style="display: inline-block; background: #fa709a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    </p>
                    
                    <p style="margin-top: 30px;">This link will expire in 1 hour for security reasons.</p>
                    <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Best regards,<br>
                        ${params.clinicName || 'Brilliant Dental'} Support Team
                    </p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Strip HTML tags for text version
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<style[^>]*>.*<\/style>/gs, '')
            .replace(/<script[^>]*>.*<\/script>/gs, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}

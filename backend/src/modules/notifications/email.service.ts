import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailTemplateData {
    [key: string]: string | number | boolean;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private isConfigured = false;

    constructor(private configService: ConfigService) {
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
            });
            this.isConfigured = true;
            this.logger.log('Nodemailer SMTP email service configured');
        } else {
            this.logger.warn('SMTP credentials not configured. Email notifications will be disabled.');
        }
    }

    /**
     * Format date for display (uses server local timezone)
     */
    private formatDate(date: Date): string {
        // Use toLocaleDateString with explicit options to avoid timezone conversion issues
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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
    }): Promise<boolean> {
        const html = this.getAppointmentReminderTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: `Appointment Reminder - ${params.clinicName || 'Brilliant Dental'}`,
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
    }): Promise<boolean> {
        const html = this.getAppointmentConfirmationTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: `Appointment Confirmed - ${params.clinicName || 'Brilliant Dental'}`,
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
    }): Promise<boolean> {
        const html = this.getAppointmentUpdateTemplate(params);

        return this.sendEmail({
            to: params.to,
            subject: `${params.updateType} - ${params.clinicName || 'Brilliant Dental'}`,
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
    }): string {
        const dateStr = this.formatDate(params.appointmentDate);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Reminder</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${params.clinicName || 'Brilliant Dental'}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #667eea; margin-top: 0;">Appointment Reminder</h2>
                    <p>Hello ${params.patientName},</p>
                    <p>This is a friendly reminder of your upcoming appointment:</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${dateStr}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${params.appointmentTime}</p>
                        <p style="margin: 5px 0;"><strong>Dentist:</strong> Dr. ${params.dentistName}</p>
                    </div>
                    
                    ${params.clinicAddress ? `<p><strong>Location:</strong><br>${params.clinicAddress}</p>` : ''}
                    ${params.clinicPhone ? `<p><strong>Contact:</strong> ${params.clinicPhone}</p>` : ''}
                    
                    <p style="margin-top: 30px;">Please arrive 10 minutes before your scheduled time. If you need to reschedule, please contact us as soon as possible.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Thank you for choosing ${params.clinicName || 'Brilliant Dental'}!<br>
                        This is an automated reminder. Please do not reply to this email.
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
    }): string {
        const dateStr = this.formatDate(params.appointmentDate);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Confirmed</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${params.clinicName || 'Brilliant Dental'}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #11998e; margin-top: 0;">✓ Appointment Confirmed</h2>
                    <p>Hello ${params.patientName},</p>
                    <p>Your appointment has been successfully scheduled:</p>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${dateStr}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${params.appointmentTime}</p>
                        <p style="margin: 5px 0;"><strong>Dentist:</strong> Dr. ${params.dentistName}</p>
                    </div>
                    
                    ${params.clinicAddress ? `<p><strong>Location:</strong><br>${params.clinicAddress}</p>` : ''}
                    ${params.clinicPhone ? `<p><strong>Contact:</strong> ${params.clinicPhone}</p>` : ''}
                    
                    <p style="margin-top: 30px;">We look forward to seeing you!</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Thank you for choosing ${params.clinicName || 'Brilliant Dental'}!
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
    }): string {
        const dateStr = this.formatDate(params.appointmentDate);

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${params.updateType}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${params.clinicName || 'Brilliant Dental'}</h1>
                </div>
                <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #fda085; margin-top: 0;">${params.updateType}</h2>
                    <p>Hello ${params.patientName},</p>
                    <p>${params.updateMessage}</p>
                    
                    <div style="background: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffb300;">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${dateStr}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${params.appointmentTime}</p>
                        <p style="margin: 5px 0;"><strong>Dentist:</strong> Dr. ${params.dentistName}</p>
                    </div>
                    
                    ${params.clinicAddress ? `<p><strong>Location:</strong><br>${params.clinicAddress}</p>` : ''}
                    ${params.clinicPhone ? `<p><strong>Contact:</strong> ${params.clinicPhone}</p>` : ''}
                    
                    <p style="margin-top: 30px;">If you have any questions, please contact us.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #666;">
                        Thank you for choosing ${params.clinicName || 'Brilliant Dental'}!
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

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

interface SendMessageParams {
    to: string;
    templateName: string;
    templateParams: Record<string, string>;
}

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private client: WhatsAppClient;
    private phoneNumberId: string;
    private isConfigured = false;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.initializeClient();
    }

    private initializeClient() {
        const kapsoApiKey = this.configService.get<string>('KAPSO_API_KEY') || '';
        const phoneNumberId = (this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '').replace(/\D/g, '');
        
        this.phoneNumberId = phoneNumberId;

        if (kapsoApiKey && kapsoApiKey !== 'your_kapso_api_key' && this.phoneNumberId) {
            this.client = new WhatsAppClient({
                baseUrl: 'https://api.kapso.ai/meta/whatsapp',
                kapsoApiKey,
            });
            this.isConfigured = true;
            this.logger.log(`WhatsApp service initialized with Kapso. Phone ID: ${this.phoneNumberId}`);
        } else {
            this.logger.warn(`KAPSO_API_KEY not configured or missing phoneNumberId. WhatsApp service will not send messages.`);
        }
    }

    async sendAppointmentReminder(
        patientPhone: string,
        patientName: string,
        appointmentDate: string,
        appointmentTime: string,
        dentistName: string,
    ): Promise<boolean> {
        if (!this.isConfigured) {
            this.logger.warn('WhatsApp service not configured');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(patientPhone);
            
            // Build template parameters for appointment_reminder template
            const templateComponents = [
                {
                    type: 'body' as const,
                    parameters: [
                        { type: 'text' as const, text: patientName },
                        { type: 'text' as const, text: appointmentDate },
                        { type: 'text' as const, text: appointmentTime },
                        { type: 'text' as const, text: dentistName },
                    ],
                },
            ];

            const result = await this.client.messages.sendTemplate({
                phoneNumberId: this.phoneNumberId,
                to: formattedPhone,
                template: {
                    name: 'appointment_reminder',
                    language: { code: 'es' },
                    components: templateComponents,
                },
            });

            // Log the message
            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                templateName: 'appointment_reminder',
                status: 'SENT',
                whatsappMessageId: result.messages?.[0]?.id,
            });

            this.logger.log(`Appointment reminder sent to ${patientPhone}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send appointment reminder: ${error.message}`, error.stack);
            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                templateName: 'appointment_reminder',
                status: 'FAILED',
                error: error.message,
            });
            throw error;
        }
    }

    async sendAppointmentConfirmation(
        patientPhone: string,
        patientName: string,
        appointmentDate: string,
        appointmentTime: string,
        dentistName: string,
    ): Promise<boolean> {
        if (!this.isConfigured) {
            this.logger.warn('WhatsApp service not configured');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(patientPhone);
            
            const templateComponents = [
                {
                    type: 'body' as const,
                    parameters: [
                        { type: 'text' as const, text: patientName },
                        { type: 'text' as const, text: appointmentDate },
                        { type: 'text' as const, text: appointmentTime },
                        { type: 'text' as const, text: dentistName },
                    ],
                },
            ];

            const result = await this.client.messages.sendTemplate({
                phoneNumberId: this.phoneNumberId,
                to: formattedPhone,
                template: {
                    name: 'appointment_confirmation',
                    language: { code: 'es' },
                    components: templateComponents,
                },
            });

            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                templateName: 'appointment_confirmation',
                status: 'SENT',
                whatsappMessageId: result.messages?.[0]?.id,
            });

            this.logger.log(`Appointment confirmation sent to ${patientPhone}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send appointment confirmation: ${error.message}`);
            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                templateName: 'appointment_confirmation',
                status: 'FAILED',
                error: error.message,
            });
            return false;
        }
    }

    async sendTextMessage(patientPhone: string, message: string): Promise<boolean> {
        if (!this.isConfigured) {
            this.logger.warn('WhatsApp service not configured');
            throw new Error('WhatsApp service not configured');
        }

        try {
            const formattedPhone = this.formatPhoneNumber(patientPhone);
            this.logger.log(`Sending text message to ${formattedPhone} with phoneNumberId: ${this.phoneNumberId}`);
            
            const result = await this.client.messages.sendText({
                phoneNumberId: this.phoneNumberId,
                to: formattedPhone,
                body: message,
            });

            this.logger.log(`Kapso response: ${JSON.stringify(result)}`);

            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEXT',
                content: message,
                status: 'SENT',
                whatsappMessageId: result.messages?.[0]?.id,
            });

            this.logger.log(`Text message sent to ${patientPhone}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send text message: ${error.message}`, error.stack);
            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEXT',
                content: message,
                status: 'FAILED',
                error: error.message,
            });
            throw error;
        }
    }

    async sendSameDayReminder(
        patientPhone: string,
        patientName: string,
        appointmentTime: string,
        dentistName: string,
    ): Promise<boolean> {
        if (!this.isConfigured) {
            this.logger.warn('WhatsApp service not configured');
            return false;
        }

        try {
            const formattedPhone = this.formatPhoneNumber(patientPhone);
            
            const templateComponents = [
                {
                    type: 'body' as const,
                    parameters: [
                        { type: 'text' as const, text: patientName },
                        { type: 'text' as const, text: appointmentTime },
                        { type: 'text' as const, text: dentistName },
                    ],
                },
            ];

            const result = await this.client.messages.sendTemplate({
                phoneNumberId: this.phoneNumberId,
                to: formattedPhone,
                template: {
                    name: 'same_day_reminder',
                    language: { code: 'es' },
                    components: templateComponents,
                },
            });

            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                templateName: 'same_day_reminder',
                status: 'SENT',
                whatsappMessageId: result.messages?.[0]?.id,
            });

            this.logger.log(`Same-day reminder sent to ${patientPhone}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send same-day reminder: ${error.message}`);
            await this.logMessage({
                phoneNumber: patientPhone,
                direction: 'OUTBOUND',
                type: 'TEMPLATE',
                templateName: 'same_day_reminder',
                status: 'FAILED',
                error: error.message,
            });
            return false;
        }
    }

    private formatPhoneNumber(phone: string): string {
        if (!phone) {
            throw new Error('Phone number is required');
        }
        // Remove any non-digit characters and ensure it starts with country code
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('598')) {
            return '+' + cleaned;
        }
        // Assuming Uruguay numbers, add country code if missing
        return '+598' + cleaned;
    }

    async logMessage(data: {
        patientId?: string;
        phoneNumber: string;
        direction: string;
        type: string;
        content?: string;
        templateName?: string;
        status: string;
        whatsappMessageId?: string;
        error?: string;
    }): Promise<void> {
        try {
            await this.prisma.whatsAppMessage.create({
                data: {
                    patientId: data.patientId,
                    whatsappMessageId: data.whatsappMessageId,
                    phoneNumber: data.phoneNumber,
                    direction: data.direction,
                    type: data.type,
                    content: data.content,
                    templateName: data.templateName,
                    status: data.status,
                    errorMessage: data.error || null,
                },
            });
        } catch (error) {
            this.logger.warn(`Failed to log WhatsApp message: ${error.message}`);
        }
    }

    async updateMessageStatus(whatsappMessageId: string, status: string): Promise<void> {
        try {
            await this.prisma.whatsAppMessage.updateMany({
                where: { whatsappMessageId },
                data: { status },
            });
        } catch (error) {
            this.logger.warn(`Failed to update message status: ${error.message}`);
        }
    }

    async findPatientByPhone(phoneNumber: string): Promise<any> {
        try {
            const patient = await this.prisma.patient.findFirst({
                where: { phone: phoneNumber },
            });
            return patient;
        } catch (error) {
            this.logger.warn(`Failed to find patient by phone: ${error.message}`);
            return null;
        }
    }

    isServiceConfigured(): boolean {
        return this.isConfigured;
    }

    getPhoneNumberId(): string {
        return this.phoneNumberId;
    }
}

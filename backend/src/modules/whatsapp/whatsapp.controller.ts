import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

class TestMessageDto {
    phone: string;
    message?: string;
}

class TestTemplateDto {
    phone: string;
    templateName: string;
    params: {
        patientName?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        dentistName?: string;
    };
}

@Controller('whatsapp')
export class WhatsAppController {
    private readonly logger = new Logger(WhatsAppController.name);

    constructor(private readonly whatsAppService: WhatsAppService) {}

    /**
     * Test endpoint to send a simple text message
     */
    @Post('test-text')
    async testTextMessage(
        @Body('phone') phone: string,
        @Body('message') message?: string,
    ) {
        this.logger.log(`Testing text message to phone: "${phone}", message: "${message}"`);

        if (!phone) {
            return {
                success: false,
                message: 'Phone number is required',
            };
        }

        try {
            const result = await this.whatsAppService.sendTextMessage(
                phone,
                message || 'Test message from Brilliant Dental Clinic',
            );

            return {
                success: result,
                message: result
                    ? 'Text message sent successfully'
                    : 'Failed to send text message',
                phone: phone,
            };
        } catch (error) {
            this.logger.error(`Error sending text message: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Error sending text message',
                error: error.message,
                stack: error.stack,
                phone: phone,
            };
        }
    }

    /**
     * Test endpoint to send an appointment reminder template
     */
    @Post('test-reminder')
    async testReminder(@Body() body: any) {
        const phone = body?.phone;
        const params = body?.params || {};
        this.logger.log(`Testing reminder to: ${phone}, params: ${JSON.stringify(params)}`);
        
        if (!phone) {
            return { success: false, message: 'Phone required', received: body };
        }

        try {
            const result = await this.whatsAppService.sendAppointmentReminder(
                phone,
                params?.patientName || 'Test Patient',
                params?.appointmentDate || 'lunes, 15 de enero de 2024',
                params?.appointmentTime || '10:00 AM',
                params?.dentistName || 'Dr. García',
            );

            return {
                success: result,
                message: result
                    ? 'Appointment reminder sent successfully'
                    : 'Failed to send appointment reminder',
                phone: phone,
                template: 'appointment_reminder',
            };
        } catch (error) {
            this.logger.error(`Error sending reminder: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Error sending reminder',
                error: error.message,
                phone: phone,
            };
        }
    }

    /**
     * Test endpoint to send an appointment confirmation template
     */
    @Post('test-confirmation')
    async testConfirmation(@Body() dto: TestTemplateDto) {
        this.logger.log(`Testing confirmation template to ${dto.phone}`);

        const result = await this.whatsAppService.sendAppointmentConfirmation(
            dto.phone,
            dto.params.patientName || 'Test Patient',
            dto.params.appointmentDate || 'lunes, 15 de enero de 2024',
            dto.params.appointmentTime || '10:00 AM',
            dto.params.dentistName || 'Dr. García',
        );

        return {
            success: result,
            message: result
                ? 'Appointment confirmation sent successfully'
                : 'Failed to send appointment confirmation',
            phone: dto.phone,
            template: 'appointment_confirmation',
        };
    }

    /**
     * Test endpoint to send same-day reminder template
     */
    @Post('test-same-day')
    async testSameDay(@Body() dto: TestTemplateDto) {
        this.logger.log(`Testing same-day reminder to ${dto.phone}`);

        const result = await this.whatsAppService.sendSameDayReminder(
            dto.phone,
            dto.params.patientName || 'Test Patient',
            dto.params.appointmentTime || '14:00',
            dto.params.dentistName || 'Dr. García',
        );

        return {
            success: result,
            message: result
                ? 'Same-day reminder sent successfully'
                : 'Failed to send same-day reminder',
            phone: dto.phone,
            template: 'same_day_reminder',
        };
    }

    /**
     * Test endpoint to check WhatsApp configuration status
     */
    @Post('test-status')
    async testStatus() {
        const isConfigured = this.whatsAppService.isServiceConfigured();
        const phoneNumberId = this.whatsAppService.getPhoneNumberId();
        
        return {
            configured: isConfigured,
            phoneNumberId: phoneNumberId,
            message: isConfigured
                ? 'WhatsApp service is configured and ready'
                : 'WhatsApp service is not configured. Check environment variables.',
        };
    }
}

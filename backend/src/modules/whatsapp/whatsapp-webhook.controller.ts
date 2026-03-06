import { Controller, Get, Post, Body, Headers, Query, Logger, HttpStatus, RawBody } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('whatsapp/webhook')
export class WhatsAppWebhookController {
    private readonly logger = new Logger(WhatsAppWebhookController.name);

    constructor(
        private configService: ConfigService,
        private whatsAppService: WhatsAppService,
        private prisma: PrismaService,
    ) {}

    /**
     * Webhook verification endpoint
     * Meta will call this endpoint to verify the webhook subscription
     */
    @Get()
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
    ): string | { statusCode: number } {
        const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

        if (mode === 'subscribe' && token === verifyToken) {
            this.logger.log('Webhook verified successfully');
            return challenge;
        }

        this.logger.warn('Webhook verification failed');
        return { statusCode: HttpStatus.FORBIDDEN };
    }

    /**
     * Webhook event handler
     * Receives incoming messages and status updates from WhatsApp
     */
    @Post()
    async handleWebhook(
        @Body() payload: any,
        @Headers('x-hub-signature-256') signatureHeader: string,
    ): Promise<{ statusCode: number }> {
        const appSecret = this.configService.get<string>('META_APP_SECRET');

        // TODO: Implement webhook signature verification if needed
        // Note: When using Kapso proxy, signature verification may not be required
        // as Kapso handles it on their end

        try {
            // Handle incoming messages
            if (payload.entry) {
                for (const entry of payload.entry) {
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            const value = change.value;

                            // Handle messages
                            if (value.messages) {
                                for (const message of value.messages) {
                                    await this.handleIncomingMessage(message, value.metadata);
                                }
                            }

                            // Handle status updates
                            if (value.statuses) {
                                for (const status of value.statuses) {
                                    await this.handleStatusUpdate(status);
                                }
                            }
                        }
                    }
                }
            }

            return { statusCode: HttpStatus.OK };
        } catch (error) {
            this.logger.error(`Error handling webhook: ${error.message}`);
            return { statusCode: HttpStatus.OK }; // Always return 200 to prevent retries
        }
    }

    private async handleIncomingMessage(message: any, metadata: any): Promise<void> {
        const from = message.from;
        const messageId = message.id;
        const timestamp = message.timestamp;

        this.logger.log(`Received inbound message ${messageId} from ${from}`);

        // Find patient by phone number
        const patient = await this.whatsAppService.findPatientByPhone(from);

        if (message.type === 'text' && message.text?.body) {
            const text = message.text.body;
            this.logger.log(`Text: ${text}`);

            // Log the incoming message
            await this.whatsAppService.logMessage({
                patientId: patient?.id,
                phoneNumber: from,
                direction: 'INBOUND',
                type: 'TEXT',
                content: text,
                status: 'RECEIVED',
                whatsappMessageId: messageId,
            });

            // Future: Integrate with AI chatbot for automated response
            // const response = await this.chatbotService.processMessage(text, from);
            // await this.whatsAppService.sendTextMessage(from, response);
        } else if (message.type === 'image') {
            this.logger.log(`Image received from ${from}`);
            // Handle images if needed
        } else if (message.type === 'document') {
            this.logger.log(`Document received from ${from}`);
            // Handle documents if needed
        }
    }

    private async handleStatusUpdate(status: any): Promise<void> {
        this.logger.log(`Status update for ${status.id}: ${status.status}`);

        await this.whatsAppService.updateMessageStatus(status.id, status.status.toUpperCase());

        if (status.status === 'failed' && status.errors?.length > 0) {
            const error = status.errors[0];
            this.logger.error(`Message failed with error: ${error.code} - ${error.message}`);
        }
    }
}

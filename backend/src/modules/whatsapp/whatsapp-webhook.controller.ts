import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
    Post,
    Query,
    RawBody,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
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
    ): string {
        const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

        if (!verifyToken || mode !== 'subscribe' || !token || !this.matches(token, verifyToken)) {
            this.logger.warn('Webhook verification failed');
            throw new ForbiddenException('Webhook verification failed');
        }

        this.logger.log('Webhook verified successfully');
        return challenge;
    }

    /**
     * Webhook event handler
     * Receives incoming messages and status updates from WhatsApp
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() payload: any,
        @RawBody() rawBody: Buffer | undefined,
        @Headers('x-webhook-signature') kapsoSignature?: string,
        @Headers('x-hub-signature-256') metaSignature?: string,
    ): Promise<{ statusCode: number }> {
        if (!this.isValidSignature(rawBody, kapsoSignature, metaSignature)) {
            this.logger.warn('Rejected webhook request with missing or invalid signature');
            throw new UnauthorizedException('Invalid webhook signature');
        }

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

    private isValidSignature(
        rawBody: Buffer | undefined,
        kapsoSignature?: string,
        metaSignature?: string,
    ): boolean {
        if (!rawBody || rawBody.length === 0) {
            return false;
        }

        // Kapso signs webhooks with X-Webhook-Signature: HMAC-SHA256 hex over the raw body.
        const kapsoSecret = this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET');
        if (kapsoSecret && kapsoSignature) {
            return this.matches(
                kapsoSignature.trim().toLowerCase(),
                this.hmacHex(rawBody, kapsoSecret),
            );
        }

        // Raw Meta forwarding signs with x-hub-signature-256: sha256=<hex>.
        const metaSecret = this.configService.get<string>('META_APP_SECRET');
        if (metaSecret && metaSignature) {
            const provided = metaSignature.trim().replace(/^sha256=/i, '').toLowerCase();
            return this.matches(provided, this.hmacHex(rawBody, metaSecret));
        }

        return false;
    }

    private hmacHex(body: Buffer, secret: string): string {
        return createHmac('sha256', secret).update(body).digest('hex');
    }

    private matches(provided: string, expected: string): boolean {
        const providedHash = createHash('sha256').update(provided).digest();
        const expectedHash = createHash('sha256').update(expected).digest();

        return timingSafeEqual(providedHash, expectedHash);
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

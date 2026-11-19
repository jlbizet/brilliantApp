import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';

const sign = (secret: string, body: Buffer): string =>
    createHmac('sha256', secret).update(body).digest('hex');

describe('WhatsAppWebhookController', () => {
    const buildController = (config: Record<string, string | undefined>) => {
        const configService = { get: (key: string) => config[key] } as unknown as ConfigService;
        const whatsAppService = {
            findPatientByPhone: jest.fn(),
            logMessage: jest.fn(),
            updateMessageStatus: jest.fn(),
        } as unknown as WhatsAppService;
        const prisma = {} as PrismaService;

        return new WhatsAppWebhookController(configService, whatsAppService, prisma);
    };

    const payload = { entry: [] };
    const rawBody = Buffer.from(JSON.stringify(payload));

    it('accepts a valid Kapso signature', async () => {
        const controller = buildController({ WHATSAPP_WEBHOOK_SECRET: 'kapso-secret' });

        await expect(
            controller.handleWebhook(payload, rawBody, sign('kapso-secret', rawBody), undefined),
        ).resolves.toEqual({ statusCode: 200 });
    });

    it('accepts a valid Meta signature', async () => {
        const controller = buildController({ META_APP_SECRET: 'meta-secret' });

        await expect(
            controller.handleWebhook(
                payload,
                rawBody,
                undefined,
                `sha256=${sign('meta-secret', rawBody)}`,
            ),
        ).resolves.toEqual({ statusCode: 200 });
    });

    it('rejects an invalid Kapso signature', async () => {
        const controller = buildController({ WHATSAPP_WEBHOOK_SECRET: 'kapso-secret' });

        await expect(
            controller.handleWebhook(payload, rawBody, sign('wrong-secret', rawBody), undefined),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects requests without any signature', async () => {
        const controller = buildController({
            WHATSAPP_WEBHOOK_SECRET: 'kapso-secret',
            META_APP_SECRET: 'meta-secret',
        });

        await expect(
            controller.handleWebhook(payload, rawBody, undefined, undefined),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects requests when the raw body is unavailable', async () => {
        const controller = buildController({ WHATSAPP_WEBHOOK_SECRET: 'kapso-secret' });

        await expect(
            controller.handleWebhook(payload, undefined, sign('kapso-secret', rawBody), undefined),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('fails closed when no webhook secret is configured', async () => {
        const controller = buildController({});

        await expect(
            controller.handleWebhook(payload, rawBody, sign('anything', rawBody), undefined),
        ).rejects.toThrow(UnauthorizedException);
    });

    describe('verifyWebhook', () => {
        it('returns the challenge for a valid verify token', () => {
            const controller = buildController({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-me' });

            expect(controller.verifyWebhook('subscribe', 'verify-me', 'challenge-123')).toBe(
                'challenge-123',
            );
        });

        it('rejects a wrong verify token', () => {
            const controller = buildController({ WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-me' });

            expect(() => controller.verifyWebhook('subscribe', 'wrong', 'challenge-123')).toThrow(
                ForbiddenException,
            );
        });

        it('fails closed when the verify token is not configured', () => {
            const controller = buildController({});

            expect(() =>
                controller.verifyWebhook('subscribe', undefined as unknown as string, 'challenge-123'),
            ).toThrow(ForbiddenException);
        });
    });
});

import 'reflect-metadata';
import { WhatsAppController } from './whatsapp.controller';
import { RolesGuard } from '../../common/guards';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// NestJS stores class-level @UseGuards targets under this metadata key.
const GUARDS_KEY = '__guards__';

describe('WhatsAppController security wiring', () => {
    it('requires JWT authentication and role authorization on every route', () => {
        const guards = Reflect.getMetadata(GUARDS_KEY, WhatsAppController) as unknown[] | undefined;
        expect(guards).toBeDefined();
        expect(guards).toHaveLength(2);
        expect(guards).toContain(RolesGuard);
    });

    it('restricts every whatsapp endpoint to ADMIN', () => {
        const roles = Reflect.getMetadata(ROLES_KEY, WhatsAppController) as string[] | undefined;
        expect(roles).toEqual([UserRole.ADMIN]);
    });

    it('never returns error stack traces to the caller', async () => {
        const failingService = {
            sendTextMessage: jest.fn().mockRejectedValue(new Error('boom')),
        };
        const controller = new WhatsAppController(failingService as never);

        const result = await controller.testTextMessage('+59890000000', 'hello');

        expect(result.success).toBe(false);
        expect(result).not.toHaveProperty('stack');
    });
});

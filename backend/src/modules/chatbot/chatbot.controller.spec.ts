import 'reflect-metadata';
import { ChatbotController } from './chatbot.controller';
import { RolesGuard } from '../../common/guards';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// NestJS stores class-level @UseGuards targets under this metadata key.
const GUARDS_KEY = '__guards__';

describe('ChatbotController security wiring', () => {
    it('requires JWT authentication on every route', () => {
        const guards = Reflect.getMetadata(GUARDS_KEY, ChatbotController) as unknown[] | undefined;
        expect(guards).toBeDefined();
        expect(guards).toHaveLength(2);
        expect(guards).toContain(RolesGuard);
    });

    it('restricts the AI endpoint to ADMIN', () => {
        const roles = Reflect.getMetadata(ROLES_KEY, ChatbotController.prototype.testAI) as string[] | undefined;
        expect(roles).toEqual([UserRole.ADMIN]);
    });

    it('keeps the status endpoint available to any authenticated staff member', () => {
        const roles = Reflect.getMetadata(ROLES_KEY, ChatbotController.prototype.getStatus) as string[] | undefined;
        expect(roles).toBeUndefined();
    });
});

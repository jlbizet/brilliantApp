import { ExecutionContext, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronSecretGuard } from './cron-secret.guard';

describe('CronSecretGuard', () => {
    const contextWith = (headers: Record<string, unknown>): ExecutionContext =>
        ({
            switchToHttp: () => ({
                getRequest: () => ({ headers }),
            }),
        }) as unknown as ExecutionContext;

    const guardWith = (config: Record<string, string | undefined>): CronSecretGuard =>
        new CronSecretGuard({ get: (key: string) => config[key] } as unknown as ConfigService);

    it('allows requests with the correct cron secret', () => {
        const guard = guardWith({ CRON_SECRET: 'super-secret' });

        expect(guard.canActivate(contextWith({ 'x-cron-secret': 'super-secret' }))).toBe(true);
    });

    it('rejects requests with a wrong cron secret', () => {
        const guard = guardWith({ CRON_SECRET: 'super-secret' });

        expect(() => guard.canActivate(contextWith({ 'x-cron-secret': 'wrong-secret' }))).toThrow(
            UnauthorizedException,
        );
    });

    it('rejects requests without the cron secret header', () => {
        const guard = guardWith({ CRON_SECRET: 'super-secret' });

        expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedException);
    });

    it('rejects repeated header values', () => {
        const guard = guardWith({ CRON_SECRET: 'super-secret' });

        expect(() =>
            guard.canActivate(contextWith({ 'x-cron-secret': ['super-secret', 'super-secret'] })),
        ).toThrow(UnauthorizedException);
    });

    it('fails closed when CRON_SECRET is not configured', () => {
        const guard = guardWith({});

        expect(() => guard.canActivate(contextWith({ 'x-cron-secret': 'anything' }))).toThrow(
            ServiceUnavailableException,
        );
    });
});

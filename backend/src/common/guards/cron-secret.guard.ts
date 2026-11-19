import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

/**
 * Protects externally triggered cron endpoints with a shared secret.
 * The caller must send the `x-cron-secret` header matching `CRON_SECRET`.
 * Fails closed when `CRON_SECRET` is not configured.
 */
@Injectable()
export class CronSecretGuard implements CanActivate {
    private readonly logger = new Logger(CronSecretGuard.name);

    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const expectedSecret = this.configService.get<string>('CRON_SECRET');

        if (!expectedSecret) {
            this.logger.error('CRON_SECRET is not configured; refusing to trigger cron jobs');
            throw new ServiceUnavailableException('Cron trigger is not configured');
        }

        const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
        const providedSecret = request.headers['x-cron-secret'];

        if (typeof providedSecret !== 'string' || !this.matches(providedSecret, expectedSecret)) {
            throw new UnauthorizedException('Invalid cron secret');
        }

        return true;
    }

    private matches(provided: string, expected: string): boolean {
        const providedHash = createHash('sha256').update(provided).digest();
        const expectedHash = createHash('sha256').update(expected).digest();

        return timingSafeEqual(providedHash, expectedHash);
    }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) {}

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    async check() {
        const startTime = Date.now();
        
        try {
            // Check database connectivity
            await this.prisma.$queryRaw`SELECT 1`;
            
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                responseTime: `${Date.now() - startTime}ms`,
                services: {
                    database: 'connected',
                    api: 'running',
                },
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'production',
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'disconnected',
                    api: 'running',
                },
                error: error.message,
            };
        }
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness check for Kubernetes' })
    async ready() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return {
                status: 'ready',
                checks: {
                    database: true,
                },
            };
        } catch (error) {
            return {
                status: 'not ready',
                checks: {
                    database: false,
                },
            };
        }
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness check for Kubernetes' })
    live() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
        };
    }
}

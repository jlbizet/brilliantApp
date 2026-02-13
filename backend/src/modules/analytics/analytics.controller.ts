import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    getDashboardStats() { return this.analyticsService.getDashboardStats(); }

    @Get('revenue-chart')
    @ApiOperation({ summary: 'Get monthly revenue chart data' })
    getRevenueChart(@Query('months') months?: number) {
        return this.analyticsService.getRevenueChart(months || 12);
    }

    @Get('appointments')
    @ApiOperation({ summary: 'Get appointment statistics' })
    getAppointmentStats() { return this.analyticsService.getAppointmentStats(); }

    @Get('patient-growth')
    @ApiOperation({ summary: 'Get patient growth chart data' })
    getPatientGrowth(@Query('months') months?: number) {
        return this.analyticsService.getPatientGrowth(months || 12);
    }

    @Get('recent-activity')
    @ApiOperation({ summary: 'Get recent audit log activity' })
    getRecentActivity() { return this.analyticsService.getRecentActivity(); }
}

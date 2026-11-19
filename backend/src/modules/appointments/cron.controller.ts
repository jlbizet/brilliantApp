import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CronSecretGuard } from '../../common/guards';
import { AppointmentsService } from './appointments.service';

@ApiTags('Cron Jobs')
@ApiHeader({
    name: 'x-cron-secret',
    description: 'Shared secret matching the CRON_SECRET environment variable',
    required: true,
})
@UseGuards(CronSecretGuard)
@Controller('cron')
export class CronController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post('reminders')
    @ApiOperation({ summary: 'Trigger daily reminder emails for tomorrow - Call this from external cron service' })
    async triggerReminders() {
        await this.appointmentsService.handleReminders();
        return { success: true, message: 'Daily reminders triggered. Check server logs for details.' };
    }

    @Post('same-day-reminders')
    @ApiOperation({ summary: 'Trigger same-day reminder emails - Call this from external cron service' })
    async triggerSameDayReminders() {
        await this.appointmentsService.handleSameDayReminders();
        return { success: true, message: 'Same-day reminders triggered. Check server logs for details.' };
    }
}

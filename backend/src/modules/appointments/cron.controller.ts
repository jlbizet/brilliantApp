import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';

@ApiTags('Cron Jobs')
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

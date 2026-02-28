import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { CronController } from './cron.controller';
import { AppointmentsService } from './appointments.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    controllers: [AppointmentsController, CronController],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule { }

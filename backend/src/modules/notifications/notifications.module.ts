import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationGateway, EmailService, CalendarService],
  exports: [NotificationsService, NotificationGateway, EmailService, CalendarService],
})
export class NotificationsModule { }

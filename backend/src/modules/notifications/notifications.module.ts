import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { CalendarService } from './calendar.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Module({
    imports: [AuthModule, WhatsAppModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationGateway, EmailService, CalendarService, WhatsAppService],
    exports: [NotificationsService, NotificationGateway, EmailService, CalendarService],
})
export class NotificationsModule { }

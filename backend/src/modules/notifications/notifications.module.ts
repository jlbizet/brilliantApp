import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';

@Module({
    imports: [AuthModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationGateway],
    exports: [NotificationsService, NotificationGateway],
})
export class NotificationsModule { }

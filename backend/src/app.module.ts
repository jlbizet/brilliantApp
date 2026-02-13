import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { BillingModule } from './modules/billing/billing.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { OdontogramModule } from './modules/odontogram/odontogram.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';

@Module({
    imports: [
        // Config
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),

        // Rate limiting: 100 requests per 60 seconds per IP
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

        // Database
        PrismaModule,

        // Feature modules
        AuthModule,
        UsersModule,
        PatientsModule,
        AppointmentsModule,
        TreatmentsModule,
        BillingModule,
        InventoryModule,
        AnalyticsModule,
        DocumentsModule,
        NotificationsModule,
        WaitlistModule,
        ChatbotModule,
        OdontogramModule,
        PrescriptionsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }

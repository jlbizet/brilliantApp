import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ChatbotGateway, ChatbotService],
    exports: [ChatbotService],
})
export class ChatbotModule { }

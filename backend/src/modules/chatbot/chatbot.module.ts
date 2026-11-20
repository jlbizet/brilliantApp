import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatbotGateway } from './chatbot.gateway';
import { AIChatAgentService } from './ai-chat-agent.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatbotController } from './chatbot.controller';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ChatbotController],
    providers: [ChatbotGateway, AIChatAgentService],
    exports: [AIChatAgentService],
})
export class ChatbotModule { }

import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AIChatAgentService } from './ai-chat-agent.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('chatbot')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly aiChatAgentService: AIChatAgentService) { }

    @Post('test-ai')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Test AI agent with a message' })
    @ApiResponse({ status: 200, description: 'AI response' })
    async testAI(@Body() data: { message: string; patientId?: string }) {
        const session = await this.aiChatAgentService.createSession(data.patientId);
        const response = await this.aiChatAgentService.processMessage(
            session.id,
            data.message,
            data.patientId
        );
        return {
            sessionId: session.id,
            message: response.message,
            language: 'es',
            timestamp: new Date().toISOString()
        };
    }

    @Get('status')
    @ApiOperation({ summary: 'Check AI agent status' })
    @ApiResponse({ status: 200, description: 'AI agent status' })
    async getStatus() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        const hasApiKey = !!apiKey && apiKey !== 'your_gemini_api_key_here';
        const model = process.env.AI_MODEL || 'gemini-2.0-flash-exp';
        const language = process.env.APP_LANGUAGE || 'es';

        return {
            status: hasApiKey ? 'active' : 'inactive',
            model,
            language,
            hasApiKey,
            timestamp: new Date().toISOString()
        };
    }
}
import { Controller, Post, Body, Get } from '@nestjs/common';
import { AIChatAgentService } from './ai-chat-agent.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly aiChatAgentService: AIChatAgentService) { }

    @Post('test-ai')
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
        const hasApiKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== '';
        const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
        const language = process.env.APP_LANGUAGE || 'en';

        return {
            status: hasApiKey ? 'active' : 'inactive',
            model,
            language,
            hasApiKey,
            timestamp: new Date().toISOString()
        };
    }
}
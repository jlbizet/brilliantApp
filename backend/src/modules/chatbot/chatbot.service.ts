import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatbotService {
    constructor(private prisma: PrismaService) { }

    async createSession(patientId?: string) {
        return this.prisma.chatSession.create({
            data: {
                patientId,
                messages: {
                    create: {
                        sender: 'BOT',
                        message: 'Hello! How can I help you today? I can assist with appointments, pricing, or general questions.',
                        intent: 'GREETING',
                    },
                },
            },
            include: { messages: true },
        });
    }

    async processMessage(sessionId: string, message: string) {
        // 1. Save user message
        await this.prisma.chatMessage.create({
            data: {
                sessionId,
                sender: 'USER',
                message,
            },
        });

        // 2. Determine intent (Rule-based for now)
        const intent = this.determineIntent(message);
        const botResponse = this.generateResponse(intent);

        // 3. Save bot response
        const botMessage = await this.prisma.chatMessage.create({
            data: {
                sessionId,
                sender: 'BOT',
                message: botResponse,
                intent,
            },
        });

        return botMessage;
    }

    async getSessionHistory(sessionId: string) {
        return this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
        });
    }

    private determineIntent(message: string): string {
        const lower = message.toLowerCase();
        if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) return 'PRICING';
        if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) return 'BOOKING';
        if (lower.includes('service') || lower.includes('treatment') || lower.includes('clean') || lower.includes('fill')) return 'SERVICES';
        if (lower.includes('hello') || lower.includes('hi')) return 'GREETING';
        return 'GENERAL';
    }

    private generateResponse(intent: string): string {
        switch (intent) {
            case 'PRICING':
                return 'Our basic consultation starts at $50. Cleaning is $100. For complex procedures, we recommend a consultation first.';
            case 'BOOKING':
                return 'I can help with that! Please visit our Appointments page to see available slots, or tell me your preferred date and time.';
            case 'SERVICES':
                return 'We offer General Dentistry, Orthodontics, Cosmetic Dentistry, and Emergency Care. What are you interested in?';
            case 'GREETING':
                return 'Hello! How can I assist you with your dental needs today?';
            default:
                return 'I am not sure I understand. Could you please rephrase? You can ask about pricing, services, or appointments.';
        }
    }
}

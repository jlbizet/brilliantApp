import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AIChatAgentService } from './ai-chat-agent.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/chatbot',
})
export class ChatbotGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly aiChatAgentService: AIChatAgentService) { }

    @SubscribeMessage('startSession')
    async handleStartSession(@MessageBody() data: { patientId?: string }, @ConnectedSocket() client: Socket) {
        const session = await this.aiChatAgentService.createSession(data.patientId);
        client.emit('sessionStarted', session);
        return session;
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@MessageBody() data: { sessionId: string; message: string; patientId?: string }, @ConnectedSocket() client: Socket) {
        const response = await this.aiChatAgentService.processMessage(
            data.sessionId,
            data.message,
            data.patientId
        );
        client.emit('messageReceived', {
            id: Date.now().toString(),
            sessionId: data.sessionId,
            sender: 'BOT',
            message: response.message,
            createdAt: new Date().toISOString(),
        });
        return response;
    }

    @SubscribeMessage('getHistory')
    async handleGetHistory(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        const history = await this.aiChatAgentService.getSessionHistory(data.sessionId);
        client.emit('historyLoaded', history);
        return history;
    }
}

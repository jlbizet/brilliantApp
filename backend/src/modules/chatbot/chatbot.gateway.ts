import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AIChatAgentService } from './ai-chat-agent.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
    namespace: '/chatbot',
})
export class ChatbotGateway implements OnGatewayConnection {
    private readonly logger = new Logger(ChatbotGateway.name);
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly aiChatAgentService: AIChatAgentService,
        private readonly jwtService: JwtService,
    ) { }

    handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
            });
            client.data.userId = payload.sub;
            client.data.user = payload;
        } catch (error) {
            this.logger.warn(
                `Unauthenticated chatbot socket ${client.id} rejected: ${error.message}`,
            );
            client.disconnect();
        }
    }

    @SubscribeMessage('startSession')
    async handleStartSession(@MessageBody() data: { patientId?: string }, @ConnectedSocket() client: Socket) {
        const session = await this.aiChatAgentService.createSession(data.patientId);
        client.emit('sessionStarted', session);
        return session;
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@MessageBody() data: { sessionId: string; message: string; patientId?: string }, @ConnectedSocket() client: Socket) {
        try {
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
        } catch (error) {
            this.logger.error(`Error handling message for session ${data.sessionId}: ${error.message}`);
            client.emit('chatError', { message: 'No se pudo procesar tu mensaje. Por favor, intenta nuevamente.' });
        }
    }

    @SubscribeMessage('getHistory')
    async handleGetHistory(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        const history = await this.aiChatAgentService.getSessionHistory(data.sessionId);
        client.emit('historyLoaded', history);
        return history;
    }
}

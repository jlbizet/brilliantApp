import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatbotService } from './chatbot.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatbotGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatbotService: ChatbotService) { }

    @SubscribeMessage('startSession')
    async handleStartSession(@MessageBody() data: { patientId?: string }, @ConnectedSocket() client: Socket) {
        const session = await this.chatbotService.createSession(data.patientId);
        client.emit('sessionStarted', session);
        return session;
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@MessageBody() data: { sessionId: string; message: string }, @ConnectedSocket() client: Socket) {
        const response = await this.chatbotService.processMessage(data.sessionId, data.message);
        client.emit('messageReceived', response);
        return response;
    }

    @SubscribeMessage('getHistory')
    async handleGetHistory(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
        const history = await this.chatbotService.getSessionHistory(data.sessionId);
        client.emit('historyLoaded', history);
        return history;
    }
}

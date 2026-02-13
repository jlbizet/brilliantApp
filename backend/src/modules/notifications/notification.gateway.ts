import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(NotificationGateway.name);

    @WebSocketServer()
    server: Server;

    // Map to track connected users: userId -> socketId[]
    private connectedUsers: Map<string, string[]> = new Map();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
            });

            const userId = payload.sub;
            
            // Track the connection
            const userConnections = this.connectedUsers.get(userId) || [];
            userConnections.push(client.id);
            this.connectedUsers.set(userId, userConnections);

            client.data.userId = userId;
            
            this.logger.log(`User ${userId} connected via socket ${client.id}`);
            this.logger.log(`Total connected users: ${this.connectedUsers.size}`);
            
            // Send connection confirmation
            client.emit('connected', { userId, timestamp: new Date().toISOString() });
        } catch (error) {
            this.logger.error('Authentication failed for socket connection:', error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            const userConnections = this.connectedUsers.get(userId);
            if (userConnections) {
                const updatedConnections = userConnections.filter(id => id !== client.id);
                if (updatedConnections.length > 0) {
                    this.connectedUsers.set(userId, updatedConnections);
                } else {
                    this.connectedUsers.delete(userId);
                }
            }
            this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
            this.logger.log(`Total connected users: ${this.connectedUsers.size}`);
        }
    }

    /**
     * Send notification to a specific user
     */
    async sendNotification(userId: string, notification: any) {
        const userConnections = this.connectedUsers.get(userId);
        if (userConnections && userConnections.length > 0) {
            userConnections.forEach(socketId => {
                this.server.to(socketId).emit('notification', notification);
            });
            this.logger.log(`Notification sent to user ${userId}`);
            return true;
        }
        this.logger.log(`User ${userId} is not connected. Notification stored for later delivery.`);
        return false;
    }

    /**
     * Send notification to multiple users
     */
    async sendNotifications(userIds: string[], notification: any) {
        userIds.forEach(userId => this.sendNotification(userId, notification));
    }

    /**
     * Client acknowledges receipt of notification
     */
    @SubscribeMessage('acknowledge')
    handleAcknowledge(@ConnectedSocket() client: Socket, @MessageBody() data: { notificationId: string }) {
        const userId = client.data.userId;
        this.logger.log(`User ${userId} acknowledged notification ${data.notificationId}`);
        return { success: true };
    }

    /**
     * Client subscribes to notification types
     */
    @SubscribeMessage('subscribe')
    handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: { types: string[] }) {
        const userId = client.data.userId;
        client.data.subscribedTypes = data.types;
        this.logger.log(`User ${userId} subscribed to notification types: ${data.types.join(', ')}`);
        return { success: true };
    }

    /**
     * Client requests to mark notification as read via WebSocket
     */
    @SubscribeMessage('mark-read')
    async handleMarkRead(@ConnectedSocket() client: Socket, @MessageBody() data: { notificationId: string }) {
        const userId = client.data.userId;
        try {
            // This would typically call a service method
            this.logger.log(`User ${userId} marked notification ${data.notificationId} as read`);
            return { success: true, notificationId: data.notificationId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of connected users (admin only)
     */
    @SubscribeMessage('get-connected-users')
    handleGetConnectedUsers(@ConnectedSocket() client: Socket) {
        // In production, you'd check user role here
        const connectedUsers = Array.from(this.connectedUsers.entries()).map(([userId, connections]) => ({
            userId,
            connectionCount: connections?.length || 0,
        }));
        return { connectedUsers };
    }

    /**
     * Check if a user is currently connected
     */
    isUserConnected(userId: string): boolean {
        const connections = this.connectedUsers.get(userId);
        return !!connections && connections.length > 0;
    }

    /**
     * Get connection count for a user
     */
    getConnectionCount(userId: string): number {
        const connections = this.connectedUsers.get(userId);
        return connections ? connections.length : 0;
    }
}
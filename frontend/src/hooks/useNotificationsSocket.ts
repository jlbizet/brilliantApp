import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores';

export function useNotificationsSocket() {
    const socketRef = useRef<Socket | null>(null);
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuthStore();

    const connect = useCallback(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const socket = io('/notifications', {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[WebSocket] Connected to notifications');
        });

        socket.on('disconnect', () => {
            console.log('[WebSocket] Disconnected from notifications');
        });

        socket.on('notification', (notification: any) => {
            console.log('[WebSocket] New notification received:', notification);
            
            // Invalidate queries to refresh notification data
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
            
            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                });
            }
        });

        socket.on('error', (error: any) => {
            console.error('[WebSocket] Error:', error);
        });

        socketRef.current = socket;
    }, [queryClient]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    const acknowledgeNotification = useCallback((notificationId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('acknowledge', { notificationId });
        }
    }, []);

    const markAsRead = useCallback((notificationId: string) => {
        if (socketRef.current) {
            socketRef.current.emit('mark-read', { notificationId });
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated, connect, disconnect]);

    // Request browser notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return {
        socket: socketRef.current,
        acknowledgeNotification,
        markAsRead,
        isConnected: !!socketRef.current?.connected,
    };
}

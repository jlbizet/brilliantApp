import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores';

export function useNotificationsSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    initAudioContext();
    if (!audioContextRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('[Notification] Could not play sound:', error);
    }
  }, [initAudioContext]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Extract base URL from VITE_API_URL (remove /api/v1 if present)
    let socketUrl = '';
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      socketUrl = envUrl.replace(/\/api\/v1\/?$/, '');
    }

    const socket = io(`${socketUrl}/notifications`, {
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

      // Play notification sound
      playNotificationSound();

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
  }, [queryClient, playNotificationSound]);

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

  // Initialize audio context on first user interaction (required by browser autoplay policy)
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext();
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initAudioContext]);

  return {
    socket: socketRef.current,
    acknowledgeNotification,
    markAsRead,
    isConnected: !!socketRef.current?.connected,
  };
}

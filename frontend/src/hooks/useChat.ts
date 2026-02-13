import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
    id: string;
    sender: 'USER' | 'BOT';
    message: string;
    intent?: string; // BOOKING, PRICING, etc.
    createdAt: string;
}

interface ChatSession {
    id: string;
    status: string;
}

export const useChat = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Initialize Socket
    useEffect(() => {
        // Use the same URL as the API but port 3000 (since we are proxying /api/v1 in vite but socket.io needs direct port or proxy config)
        // Vite proxy usually proxies http, for ws we need to be careful.
        // Let's assume localhost:3000 for now as per backend config.
        const token = localStorage.getItem('accessToken');
        const newSocket = io('http://localhost:3000', {
            auth: { token },
            autoConnect: false,
        });

        newSocket.on('connect', () => {
            console.log('Connected to Chatbot');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from Chatbot');
        });

        newSocket.on('sessionStarted', (session: ChatSession) => {
            console.log('Session started:', session);
            setSessionId(session.id);
            // Optionally load history if we were reconnecting? 
            // For now, backend createSession returns empty or new. 
            // If we wanted persistence across reloads, we'd need to store sessionId in localStorage.
        });

        newSocket.on('messageReceived', (message: ChatMessage) => {
            setIsTyping(false);
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('historyLoaded', (history: ChatMessage[]) => {
            setMessages(history);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Handle Chat Toggle
    const toggleChat = () => {
        const newState = !isOpen;
        setIsOpen(newState);

        if (newState && socket && !socket.connected) {
            socket.connect();
            // Start session if not exists
            if (!sessionId) {
                // Try to recover from localStorage?
                const savedSessionId = localStorage.getItem('chatSessionId');
                if (savedSessionId) {
                    setSessionId(savedSessionId);
                    socket.emit('getHistory', { sessionId: savedSessionId });
                } else {
                    socket.emit('startSession', { patientId: undefined }); // Backend handles optional patientId
                }
            }
        }
    };

    // Save sessionId when set
    useEffect(() => {
        if (sessionId) {
            localStorage.setItem('chatSessionId', sessionId);
        }
    }, [sessionId]);

    const sendMessage = (text: string) => {
        if (!socket || !sessionId) return; // Should handle no session case

        // Optimistic UI update
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            sender: 'USER',
            message: text,
            createdAt: new Date().toISOString()
        }]);

        setIsTyping(true);
        socket.emit('sendMessage', { sessionId, message: text });
    };

    return {
        messages,
        isOpen,
        toggleChat,
        sendMessage,
        isTyping
    };
};

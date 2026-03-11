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

const getSocketUrl = () => {
    // We must parse VITE_API_URL to get the backend domain without /api/v1
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
        return envUrl.replace(/\/api\/v1\/?$/, '');
    }
    // Fallback to dev port if not found
    return 'http://localhost:3000';
};

export const useChat = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const pendingMessageRef = useRef<string | null>(null);
    const isStartingSessionRef = useRef(false);
    const hasWelcomeMessageRef = useRef(false);

    // Initialize Socket
    useEffect(() => {
        const socketUrl = getSocketUrl();
        console.log('Connecting to socket at:', socketUrl);

        const token = localStorage.getItem('accessToken');
        const newSocket = io(`${socketUrl}/chatbot`, {
            auth: { token },
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('Connected to Chatbot');
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from Chatbot');
            // Clear typing indicator so the spinner is never left spinning
            setIsTyping(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Chatbot connection error:', err.message);
            setIsTyping(false);
        });

        newSocket.on('chatError', (payload: { message: string }) => {
            // Gateway emitted an application-level error after a failed processMessage
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'BOT',
                message: payload.message,
                intent: 'ERROR',
                createdAt: new Date().toISOString(),
            }]);
        });

        newSocket.on('sessionStarted', (session: ChatSession & { messages?: ChatMessage[] }) => {
            console.log('Session started:', session);
            isStartingSessionRef.current = false;
            setSessionId(session.id);

            // Only add welcome message once (fresh session)
            // This prevents overwriting user's optimistic message
            if (!hasWelcomeMessageRef.current && session.messages && session.messages.length > 0) {
                hasWelcomeMessageRef.current = true;
                setMessages(prev => {
                    // If user already typed something, append welcome message
                    if (prev.length > 0) {
                        return [...prev, ...session.messages!];
                    }
                    return session.messages!;
                });
            }

            // Send any pending message
            if (pendingMessageRef.current) {
                const message = pendingMessageRef.current;
                pendingMessageRef.current = null;
                newSocket.emit('sendMessage', { sessionId: session.id, message });
            }
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
            // Start session if not exists and not already starting
            if (!sessionId && !isStartingSessionRef.current) {
                isStartingSessionRef.current = true;
                // Try to recover from localStorage?
                const savedSessionId = localStorage.getItem('chatSessionId');
                if (savedSessionId) {
                    setSessionId(savedSessionId);
                    socket.emit('getHistory', { sessionId: savedSessionId });
                    isStartingSessionRef.current = false;
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
        if (!socket) return;

        // Optimistic UI update - always show the message immediately
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            sender: 'USER',
            message: text,
            createdAt: new Date().toISOString()
        }]);

        setIsTyping(true);

        // If no session yet and not already starting, store message and start session
        if (!sessionId && !isStartingSessionRef.current) {
            isStartingSessionRef.current = true;
            pendingMessageRef.current = text;
            socket.emit('startSession', { patientId: undefined });
            return;
        }

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

import React from 'react';
import { User, Bot } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage as IChatMessage } from '../../hooks/useChat';

interface ChatMessageProps {
    message: IChatMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isBot = message.sender === 'BOT';

    return (
        <div className={clsx("flex gap-3 mb-4", isBot ? "flex-row" : "flex-row-reverse")}>
            <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isBot ? "bg-primary-100 text-primary-600" : "bg-gray-200 text-gray-600"
            )}>
                {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className={clsx(
                "p-3 rounded-2xl max-w-[80%] text-sm",
                isBot ? "bg-gray-100 text-gray-800 rounded-tl-none" : "bg-primary-600 text-white rounded-tr-none shadow-md shadow-primary-500/20"
            )}>
                <p>
                    {message.message.split('\n').map((line, i, arr) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < arr.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
                <span className="text-[10px] opacity-70 block mt-1 text-right">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}

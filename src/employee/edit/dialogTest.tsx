import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface Message {
    id: number;
    content: string;
    timestamp: string;
    isUser: boolean;
}

export const DialogTest: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, content: '你好啊!最近怎么样?', timestamp: '10:22', isUser: true },
        { id: 2, content: '下周我有一份新工作，你有空吗？\n非常轻松的!', timestamp: '10:22', isUser: true },
        { id: 3, content: '感谢，有空的! 😊', timestamp: '10:22', isUser: false },
        { id: 4, content: '完美的！我现在工作的你来消息，5G信号真好!', timestamp: '10:22', isUser: true },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            setMessages(prev => [...prev, {
                id: prev.length + 1,
                content: newMessage,
                timestamp: new Date().toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit'
                }),
                isUser: true
            }]);
            setNewMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">效果测试</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={clsx(
                            'flex items-start space-x-2 max-w-[80%]',
                            message.isUser ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                        )}
                    >
                        <div
                            className={clsx(
                                'rounded-lg px-4 py-2 relative',
                                message.isUser 
                                    ? 'bg-purple-500 text-white' 
                                    : 'bg-gray-100 text-gray-900'
                            )}
                        >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div 
                                className={clsx(
                                    'text-xs mt-1',
                                    message.isUser ? 'text-purple-200' : 'text-gray-500'
                                )}
                            >
                                {message.timestamp}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
                <div className="flex items-end space-x-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="说点什么..."
                        className="flex-1 resize-none rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px] max-h-[120px]"
                        rows={1}
                    />
                    <button
                        onClick={handleSendMessage}
                        className={clsx(
                            'rounded-lg p-2 transition-colors',
                            newMessage.trim() 
                                ? 'bg-purple-500 text-white hover:bg-purple-600' 
                                : 'bg-gray-100 text-gray-400'
                        )}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

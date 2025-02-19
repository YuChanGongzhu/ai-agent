import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import clsx from 'clsx';

interface Message {
    id: number;
    content: string;
    timestamp: string;
    isUser: boolean;
}

export const DialogPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, content: '你好啊最近怎么样?', timestamp: '10:22', isUser: false },
        { id: 2, content: '下周我有一份新工作，你有空吗？\n非常轻松的!', timestamp: '10:22', isUser: true },
        { id: 3, content: '感谢，有空的! 😊', timestamp: '10:22', isUser: false },
        { id: 4, content: '完美的！我现在工作的你来消息，5G信号真好!', timestamp: '10:22', isUser: true },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isAIEnabled, setIsAIEnabled] = useState(true);
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
        <div className="bg-white rounded-3xl shadow-lg h-[600px] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                        alt="User"
                        className="w-8 h-8 rounded-full"
                    />
                    <h3 className="text-lg font-medium text-gray-900">新户名称</h3>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">AI</span>
                    <button
                        onClick={() => setIsAIEnabled(!isAIEnabled)}
                        className={clsx(
                            'w-12 h-6 rounded-full transition-colors duration-200 ease-in-out relative',
                            isAIEnabled ? 'bg-purple-500' : 'bg-gray-200'
                        )}
                    >
                        <span
                            className={clsx(
                                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out',
                                isAIEnabled ? 'right-1' : 'left-1'
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Messages */}
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
                                'rounded-2xl px-4 py-2 relative',
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

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <div className="flex items-center space-x-2">
                    <button
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="说点什么..."
                            className="w-full resize-none rounded-full border border-gray-200 pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[40px] max-h-[120px]"
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            className={clsx(
                                'absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors',
                                newMessage.trim() 
                                    ? 'bg-purple-500 text-white hover:bg-purple-600' 
                                    : 'bg-gray-100 text-gray-400'
                            )}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

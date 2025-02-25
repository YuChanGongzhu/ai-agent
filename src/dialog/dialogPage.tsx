import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

import { Conversation, Message as DifyMessage, getMessagesApi } from '../api/dify';
import { WxAccount, sendChatMessageApi } from '../api/airflow';

interface DialogPageProps {
    conversation: Conversation | null;
    selectedAccount: WxAccount | null;
}

interface Message {
    id: string;
    content: string;
    timestamp: number;
    isUser: boolean;
    senderName: string;
}

export const DialogPage: React.FC<DialogPageProps> = ({ conversation, selectedAccount }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isAIEnabled, setIsAIEnabled] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (conversation) {
            loadMessages();
        } else {
            setMessages([]);
        }
        console.log('Conversation changed:', conversation);
    }, [conversation]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!conversation) return;
        
        setIsFetchingHistory(true);
        try {
            const response = await getMessagesApi({
                user: selectedAccount?.name || '',
                conversation_id: conversation.id
            });

            const formattedMessages = response.data.flatMap(msg => {
                const messages: Message[] = [];
                
                if (msg.query) {
                    messages.push({
                        id: msg.id + '-query',
                        content: msg.query,
                        timestamp: msg.created_at * 1000,
                        isUser: false,
                        senderName: msg.inputs?.sender_name || 'User'
                    });
                }

                if (msg.answer && msg.answer !== '#仅记录, 不自动回复#') {
                    messages.push({
                        id: msg.id + '-answer',
                        content: msg.answer,
                        timestamp: msg.created_at * 1000,
                        isUser: true,
                        senderName: 'Assistant'
                    });
                }

                return messages;
            });

            // console.log('Formatted messages:', formattedMessages);

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversation || !selectedAccount) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: newMessage,
            timestamp: Date.now(),
            isUser: true,
            senderName: selectedAccount.name
        };

        setMessages(prev => [...prev, userMessage]);
        setNewMessage('');
        setIsLoading(true);

        try {
            const currentTime = new Date().toISOString();
            const roomId = (conversation.inputs.room_id as string).replace(/@/g, '');
            const dagRunId = `manual_${selectedAccount.name}_${roomId}_${currentTime}`;
            
            await sendChatMessageApi({
                conf: {
                    msg: newMessage,
                    source_ip: selectedAccount.source_ip,
                    room_id: conversation.inputs.room_id as string
                },
                dag_run_id: dagRunId,
                data_interval_end: currentTime,
                data_interval_start: currentTime,
                logical_date: currentTime,
                note: 'string'
            });
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!conversation) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                请选择一个会话
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl shadow-lg h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                        {conversation.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{conversation.name}</h3>
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
                {isFetchingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p>加载中...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg
                            className="w-12 h-12 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                        <p>还没有消息。开始聊天吧！</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={clsx(
                                    'flex items-start space-x-2',
                                    message.isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                                )}
                            >
                                {/* Avatar */}
                                <div
                                    className={clsx(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white',
                                        message.isUser ? 'bg-purple-500' : 'bg-gray-400'
                                    )}
                                    title={message.senderName}
                                >
                                    {message.senderName.charAt(0).toUpperCase()}
                                </div>

                                {/* Message Content */}
                                <div
                                    className={clsx(
                                        'max-w-[70%] rounded-lg px-4 py-2',
                                        message.isUser
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-100 text-gray-900 shadow-sm'
                                    )}
                                >
                                    <div className="whitespace-pre-wrap break-words">
                                        {message.content}
                                    </div>
                                    <div
                                        className={clsx(
                                            'text-xs mt-1',
                                            message.isUser ? 'text-purple-100' : 'text-gray-400'
                                        )}
                                    >
                                        {new Date(message.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center space-x-2 text-gray-500">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t flex items-center space-x-4">
                <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="说点什么吧..."
                        className="w-full px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,1)] text-sm"
                        disabled={isLoading || isFetchingHistory}
                    />
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </button>
                <button
                    onClick={handleSendMessage}
                    className={clsx(
                        'w-10 h-10 flex items-center justify-center rounded-full focus:outline-none transition-colors',
                        (isLoading || isFetchingHistory) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[rgba(108,93,211,1)] hover:bg-[rgba(98,83,201,1)]'
                    )}
                    disabled={isLoading || isFetchingHistory}
                >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>

            </div>
        </div>
    );
};

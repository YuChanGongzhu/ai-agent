import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

import { RoomListMessage, getChatMessagesApi, ChatMessage } from '../api/mysql';
import { WxAccount, sendChatMessageApi, getAIReplyListApi, postAIReplyListApi, updateWxHumanListApi } from '../api/airflow';
import { MessageContent } from '../components/MessageContent';
import { getMessageContent } from '../utils/messageTypes';

interface AvatarData {
    wxid: string;
    smallHeadImgUrl: string;
    bigHeadImgUrl: string;
    update_time: string;
}

interface DialogPageProps {
    conversation: RoomListMessage | null;
    selectedAccount: WxAccount | null;
    avatarList?: AvatarData[];
    refreshHumanList?: () => void;
    humanList?: string[];
}

interface Message {
    id: string;
    content: string;
    timestamp: number;
    isUser: boolean;
    senderName: string;
    msgType?: number;
    senderId?: string;
}

export const DialogPage: React.FC<DialogPageProps> = ({ conversation, selectedAccount, avatarList = [], refreshHumanList, humanList = [] }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isAIEnabled, setIsAIEnabled] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const enabledRoomsRef = useRef<string[]>([]);
    const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

    const scrollToBottom = () => {
        const messageContainer = messageContainerRef.current;
        if (!messageContainer) return;
        messageContainer.scrollTop = messageContainer.scrollHeight;
    };
    
    // Function to show notification
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({
            show: true,
            message,
            type
        });
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setNotification({show: false, message: '', type: 'success'});
        }, 3000);
    };

    useEffect(() => {
        if (conversation) {
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [conversation]);

    useEffect(() => {
        if (messages.length === 0) return;
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        if (!conversation) return;
        setIsFetchingHistory(true);
        try {
            const [aiResponse, response] = await Promise.all([
                getAIReplyListApi(selectedAccount?.name || '', selectedAccount?.wxid || ''),
                getChatMessagesApi({
                    wx_user_id: selectedAccount?.wxid || '',
                    room_id: conversation?.room_id || ''
                })
            ]);

            try {
                const enabledRooms = JSON.parse(aiResponse.value);
                enabledRoomsRef.current = enabledRooms;
                setIsAIEnabled(enabledRooms.includes(conversation.room_id));
            } catch (error) {
                console.error('Error parsing AI enabled rooms:', error);
                enabledRoomsRef.current = [];
                setIsAIEnabled(false);
            }

            // 处理消息列表
            const transformedMessages = response.data.records.reverse().map(msg => ({
                id: msg.msg_id,
                content: msg.content || '',
                timestamp: new Date(msg.msg_datetime).getTime(),
                isUser: msg.sender_id === selectedAccount?.wxid,
                senderName: msg.sender_name || msg.sender_id,
                msgType: msg.msg_type,
                senderId: msg.sender_id
            }));

            setMessages(transformedMessages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversation || !selectedAccount) return;

        setNewMessage('');
        setIsLoading(true);

        try {
            const currentTime = new Date().toISOString();
            const roomId = conversation.room_id.replace(/@/g, '');
            const dagRunId = `manual_${selectedAccount?.wxid || 'unknown'}_${roomId}_${currentTime}`;
            
            await sendChatMessageApi({
                conf: {
                    content: newMessage,
                    source_ip: selectedAccount.source_ip,
                    room_id: conversation.room_id,
                    sender: selectedAccount?.wxid || 'unknown',
                    msg_type: 1,
                    is_self: true,
                    is_group: conversation.is_group
                },
                dag_run_id: dagRunId,
                data_interval_end: new Date().toISOString(),
                data_interval_start: new Date().toISOString(),
                logical_date: new Date().toISOString(),
                note: 'manual_send'
            });

            setIsSending(true);
            
            setTimeout(async () => {
                try {
                    const response = await getChatMessagesApi({
                        wx_user_id: selectedAccount?.wxid || '',
                        room_id: conversation?.room_id || ''
                    });

                    const transformedMessages = response.data.records.reverse().map(msg => ({
                        id: msg.msg_id,
                        content: msg.content || '',
                        timestamp: new Date(msg.msg_datetime).getTime(),
                        isUser: msg.sender_id === selectedAccount?.wxid,
                        senderName: msg.sender_name || msg.sender_id,
                        msgType: msg.msg_type
                    }));

                    setMessages(transformedMessages);
                } catch (error) {
                    console.error('Error refreshing messages:', error);
                } finally {
                    setIsSending(false);
                }
            }, 2000);
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
                请选择一个聊天
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-3xl shadow-lg h-full flex flex-col relative overflow-hidden">
            {/* Notification */}
            {notification.show && (
                <div className={`absolute top-4 right-4 border-l-4 p-3 rounded shadow-md z-10 max-w-xs transition-all duration-300 ease-in-out opacity-100 ${notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'}`}>
                    <div className="flex items-center">
                        {notification.type === 'success' ? (
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        <p className="text-base">{notification.message}</p>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                        {(conversation.room_name || conversation.sender_name || 'Chat').charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{conversation.room_name || conversation.sender_name || 'Chat'}</h3>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Only show the "解除人工" button when the conversation is in the humanList */}
                    {humanList.includes(conversation.room_id) && (
                        <button 
                            className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                            onClick={async () => {
                                if (!selectedAccount) return;
                                
                                try {
                                    const updatedHumanList = humanList.filter(id => id !== conversation.room_id);
                                    await updateWxHumanListApi(selectedAccount.wxid, selectedAccount.name, updatedHumanList);
                                    showNotification('已解除人工处理', 'success');
                                    refreshHumanList?.();
                                } catch (error) {
                                    console.error('解除人工处理失败:', error);
                                    showNotification('解除人工处理失败', 'error');
                                }
                            }}
                        >
                            解除人工
                        </button>
                    )}
                    <span className="text-sm text-gray-600">AI</span>
                    <button
                        onClick={async () => {
                            const newAIEnabled = !isAIEnabled;
                            setIsAIEnabled(newAIEnabled);
                            
                            try {
                                const currentRooms = [...enabledRoomsRef.current];
                                
                                if (newAIEnabled) {
                                    if (!currentRooms.includes(conversation.room_id)) {
                                        currentRooms.push(conversation.room_id);
                                    }
                                } else {
                                    const index = currentRooms.indexOf(conversation.room_id);
                                    if (index > -1) {
                                        currentRooms.splice(index, 1);
                                    }
                                }
                                
                                enabledRoomsRef.current = currentRooms;
                                await postAIReplyListApi(
                                    selectedAccount?.name || '', 
                                    selectedAccount?.wxid || '', 
                                    currentRooms
                                );
                            } catch (error) {
                                console.error('Error updating AI enabled rooms:', error);
                                setIsAIEnabled(!newAIEnabled);
                            }
                        }}
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
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                ref={messageContainerRef}
            >
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
                                {avatarList.find(avatar => avatar.wxid === message.senderId) ? (
                                    <div
                                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                                        title={message.senderName}
                                    >
                                        <img 
                                            src={avatarList.find(avatar => avatar.wxid === message.senderId)?.smallHeadImgUrl} 
                                            alt={message.senderName} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.onerror = null;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.classList.add(
                                                        'flex', 'items-center', 'justify-center', 
                                                        'text-sm', 'font-medium', 'text-white',
                                                        message.isUser ? 'bg-purple-500' : 'bg-gray-400'
                                                    );
                                                    parent.textContent = message.senderName.charAt(0).toUpperCase();
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className={clsx(
                                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white',
                                            message.isUser ? 'bg-purple-500' : 'bg-gray-400'
                                        )}
                                        title={message.senderName}
                                    >
                                        {message.senderName.charAt(0).toUpperCase()}
                                    </div>
                                )}

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
                                        {message.msgType === 3 || message.msgType === 34 ? 
                                            <MessageContent content={message.content} msgType={message.msgType} /> :
                                            getMessageContent(message.msgType || 0, message.content)
                                        }
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
                        {(isLoading || isSending) && (
                            <div className="flex justify-end">
                                <div className="flex items-center space-x-2 text-gray-500 bg-gray-100 rounded-lg px-4 py-2">
                                    <span className="text-sm">发送中</span>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t flex items-center space-x-4 sticky bottom-0">
                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
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
                <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </button>
                <button
                    onClick={handleSendMessage}
                    className={clsx(
                        'w-10 h-10 flex items-center justify-center rounded-full focus:outline-none transition-colors flex-shrink-0',
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

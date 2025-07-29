import React, { useState, useRef, useEffect } from 'react';
import { MpRoomListMessage, MpChatMessage, getMpChatMessageApi } from '../api/mysql';
import { MpMessageContent } from '../components/MpMessageContent';

interface WxMpDialogPageProps {
    conversation: MpRoomListMessage | null;
    mpAccountId: string;
    mpAccountName: string;
}

interface Message {
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
    senderName: string;
    msgType: string;
    senderId: string;
}

export const WxMpDialogPage: React.FC<WxMpDialogPageProps> = ({
    conversation,
    mpAccountId,
    mpAccountName
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const PAGE_SIZE = 20;

    // Fetch messages for the current conversation
    const fetchMessages = async (reset = false) => {
        if (!conversation || !mpAccountId) return;
        
        if (reset) {
            setPage(0);
            setHasMore(true);
        }
        
        if (!hasMore && !reset) return;
        
        setIsLoading(true);
        
        try {
            // Extract user ID from room_id or use separate IDs if available
            const roomParts = conversation.room_id.split('@');
            const params: any = {
                limit: PAGE_SIZE,
                offset: reset ? 0 : page * PAGE_SIZE
            };
            
            // If room_id follows format gh_xxx@userid
            if (roomParts.length === 2) {
                params.room_id = conversation.room_id;
            } else {
                // Otherwise use separate from/to IDs
                params.from_user_id = mpAccountId;
                params.to_user_id = conversation.user_id;
            }
            
            const response = await getMpChatMessageApi(params);
            
            if (response.code === 0) {
                const newMessages = response.data.records.map((msg: MpChatMessage): Message => ({
                    id: msg.msg_id,
                    content: msg.msg_content,
                    timestamp: msg.msg_datetime,
                    isUser: msg.sender_id !== mpAccountId,
                    senderName: msg.sender_name || (msg.sender_id === mpAccountId ? mpAccountName : '用户'),
                    msgType: msg.msg_type,
                    senderId: msg.sender_id
                }));
                
                if (reset) {
                    setMessages(newMessages);
                } else {
                    setMessages(prev => [...prev, ...newMessages]);
                }
                
                setHasMore(newMessages.length === PAGE_SIZE);
                setPage(prev => reset ? 1 : prev + 1);
            } else {
                console.error(`获取消息失败: ${response.message}`);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load messages when conversation changes
    useEffect(() => {
        if (conversation) {
            fetchMessages(true);
        } else {
            setMessages([]);
        }
    }, [conversation, mpAccountId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && page <= 1) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, page]);

    // Load more messages when scrolling to top
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        
        const { scrollTop } = messagesContainerRef.current;
        if (scrollTop === 0 && !isLoading && hasMore) {
            fetchMessages();
        }
    };

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-500">选择一个对话</h3>
                    <p className="text-sm text-gray-400">从左侧列表中选择一个对话</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white p-4 border-b shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="font-medium">{mpAccountName}</h2>
                    <p className="text-xs text-gray-500">{conversation.user_id}</p>
                </div>
            </div>

            {/* Messages */}
            <div 
                className="flex-1 p-4 overflow-y-auto" 
                ref={messagesContainerRef} 
                onScroll={handleScroll}
            >
                {isLoading && page === 0 ? (
                    <div className="flex justify-center py-4">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : (
                    <>
                        {hasMore && page > 0 && (
                            <div className="text-center py-2">
                                <button 
                                    className="text-sm text-blue-500 hover:text-blue-700"
                                    onClick={() => fetchMessages()}
                                    disabled={isLoading}
                                >
                                    {isLoading ? '加载中...' : '加载更多消息'}
                                </button>
                            </div>
                        )}
                        
                        {messages.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                暂无消息记录
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.reverse().map((message, index) => (
                                    <div 
                                        key={message.id || index} 
                                        className={`flex ${message.isUser ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-[80%] ${message.isUser ? 'bg-white' : 'bg-blue-100'} p-3 rounded-lg shadow-sm`}>
                                            <div className="text-xs text-gray-500 mb-1">
                                                {message.senderName} · {new Date(message.timestamp).toLocaleString()}
                                            </div>
                                            <MpMessageContent 
                                                content={message.content} 
                                                msgType={message.msgType}
                                                isUser={message.isUser}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

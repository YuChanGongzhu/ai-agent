import React, { useState, useEffect } from 'react';
import { generateWxChatHistorySummaryApi, getWxChatHistorySummaryApi } from '../api/airflow';
import ChatMemory from './memory/chatMemory';
import UserProfile from './memory/userProfile';
import LongtimeMemory from './memory/longtimeMemory';

interface ApiCustomerInfo {
    name: string | null;
    age: string | null;
    gender: string | null;
    region: string | null;
    contact: string | null;
}

interface UserProfileData {
    [key: string]: string;
}

interface ChatKeyEvent {
    time: string;
    event: string;
    detail: string;
}

interface MemoryProps {
    selectedAccount?: { wxid: string; name: string } | null;
    selectedConversation?: { room_id: string; room_name: string } | null;
}

const Memory: React.FC<MemoryProps> = ({ selectedAccount, selectedConversation }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [customerInfo, setCustomerInfo] = useState<ApiCustomerInfo>({  
        name: null,
        age: null,
        gender: null,
        region: null,
        contact: null
    });
    const [chatKeyEvents, setChatKeyEvents] = useState<ChatKeyEvent[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfileData>({});

    // 当 selectedAccount 和 selectedConversation 变化时，先清空聊天记忆，然后获取新的摘要
    useEffect(() => {
        // 先清空当前的数据
        setCustomerInfo({
            name: null,
            age: null,
            gender: null,
            region: null,
            contact: null
        });
        setChatKeyEvents([]);
        setUserProfile({});
        
        // 获取真实数据
        fetchInitialSummary();
    }, [selectedAccount, selectedConversation]);

    const fetchInitialSummary = async () => {
        // 确保 selectedAccount 和 selectedConversation 都不为 null 且具有必要的属性
        if (selectedAccount && selectedConversation && selectedAccount.wxid && selectedConversation.room_id) {
            try {
                const summaryResponse = await getWxChatHistorySummaryApi(
                    selectedAccount.wxid,
                    selectedConversation.room_id
                );
                console.log('初始聊天摘要内容:', summaryResponse);
                
                // 尝试解析 JSON 内容（如果是 JSON 格式）
                try {
                    const parsedSummary = JSON.parse(summaryResponse.value);
                    console.log('解析后的初始聊天摘要:', parsedSummary);
                    
                    // 提取客户信息并更新状态
                    if (parsedSummary && parsedSummary.summary_json) {
                        // 更新客户基本信息
                        if (parsedSummary.summary_json.customer_info) {
                            setCustomerInfo(parsedSummary.summary_json.customer_info);
                        }
                        
                        // 更新关键事件
                        if (parsedSummary.summary_json.chat_key_event) {
                            setChatKeyEvents(parsedSummary.summary_json.chat_key_event);
                        }
                        
                        // 更新用户画像
                        if (parsedSummary.summary_json.user_profile) {
                            setUserProfile(parsedSummary.summary_json.user_profile);
                        }
                    }
                } catch (parseError) {
                    // 如果不是 JSON 格式，直接显示原始内容
                    console.log('原始初始聊天摘要文本:', summaryResponse.value);
                }
            } catch (error) {
                console.error('获取初始聊天摘要时出错:', error);
                // 如果获取失败，不做特殊处理，用户仍然可以通过点击按钮手动获取
            }
        }
    };

    // 获取聊天历史摘要的函数
    const fetchChatHistorySummary = async () => {
        // 确保 selectedAccount 和 selectedConversation 都不为 null 且具有必要的属性
        if (selectedAccount && selectedConversation && selectedAccount.wxid && selectedConversation.room_id) {
            setIsLoading(true);
            const roomId = selectedConversation.room_id.replace(/@/g, '');

            // 清空当前的数据
            setCustomerInfo({
                name: null,
                age: null,
                gender: null,
                region: null,
                contact: null
            });
            setChatKeyEvents([]);
            setUserProfile({});
            
            try {
                // 第一步：生成聊天历史摘要
                const currentDate = new Date().toISOString();
                const request = {
                    conf: {
                        wx_user_id: selectedAccount.wxid,
                        room_id: selectedConversation.room_id
                    },
                    dag_run_id: `summary_${selectedAccount.wxid}_${roomId}_${Date.now()}`,
                    data_interval_end: currentDate,
                    data_interval_start: currentDate,
                    logical_date: currentDate,
                    note: `Chat history summary for ${selectedConversation.room_name || 'Unknown Room'}`
                };
                
                const response = await generateWxChatHistorySummaryApi(request);
                
                // 第二步：获取生成的聊天摘要
                setTimeout(async () => {
                    try {
                        const summaryResponse = await getWxChatHistorySummaryApi(
                            selectedAccount.wxid,
                            selectedConversation.room_id
                        );
                        console.log('聊天摘要内容:', summaryResponse);
                        
                        // 尝试解析 JSON 内容（如果是 JSON 格式）
                        try {
                            const parsedSummary = JSON.parse(summaryResponse.value);
                            console.log('解析后的聊天摘要:', parsedSummary);
                            
                            // 更新客户基本信息
                            if (parsedSummary && parsedSummary.summary_json) {
                                // 更新客户基本信息
                                if (parsedSummary.summary_json.customer_info) {
                                    setCustomerInfo(parsedSummary.summary_json.customer_info);
                                }
                                
                                // 更新关键事件
                                if (parsedSummary.summary_json.chat_key_event) {
                                    setChatKeyEvents(parsedSummary.summary_json.chat_key_event);
                                }
                                
                                // 更新用户画像
                                if (parsedSummary.summary_json.user_profile) {
                                    setUserProfile(parsedSummary.summary_json.user_profile);
                                }
                            }
                        } catch (parseError) {
                            // 如果不是 JSON 格式，直接显示原始内容
                            console.log('原始聊天摘要文本:', summaryResponse.value);
                        }
                    } catch (summaryError) {
                        console.error('获取聊天摘要时出错:', summaryError);
                    } finally {
                        setIsLoading(false);
                    }
                }, 8000);
                
            } catch (error) {
                console.error('生成聊天历史摘要时出错:', error);
                setIsLoading(false);
            }
        } else {
            console.warn('未选择账号或对话，无法生成聊天历史摘要');
            setIsLoading(false);
        }
    };

    // 将用户画像数据转换为标签数组 - 使用value作为标签文本
    const userProfileTags = Object.entries(userProfile).map(([key, value]) => ({
        text: value
    }));

    // 将关键事件转换为记忆数组
    const memoryEvents = chatKeyEvents.map(event => ({
        date: event.time,
        content: event.detail
    }));

    return (
        <>
            <ChatMemory
                customerInfo={customerInfo}
                selectedAccount={selectedAccount}
                selectedConversation={selectedConversation}
                onCustomerInfoUpdate={setCustomerInfo}
                isLoading={isLoading}
                onUpdateMemory={fetchChatHistorySummary}
            />
            <UserProfile
                className="mb-4 mt-4"
                tags={userProfileTags}
            />
            <LongtimeMemory 
                memories={memoryEvents} 
            />
        </>
    );
};

export default Memory;

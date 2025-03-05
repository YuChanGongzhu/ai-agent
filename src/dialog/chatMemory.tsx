import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { generateWxChatHistorySummaryApi, getWxChatHistorySummaryApi } from '../api/airflow';

interface ApiCustomerInfo {
    name: string | null;
    age: string | null;
    gender: string | null;
    region: string | null;
    contact: string | null;
}

interface ChatMemoryProps {
    customerInfo?: ApiCustomerInfo;
    selectedAccount?: { wxid: string; name: string } | null;
    selectedConversation?: { room_id: string; room_name: string } | null;
    onCustomerInfoUpdate?: (info: ApiCustomerInfo) => void;
}

export const ChatMemory: React.FC<ChatMemoryProps> = ({ 
    customerInfo, 
    selectedAccount, 
    selectedConversation,
    onCustomerInfoUpdate 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // 当 selectedAccount 和 selectedConversation 变化时，先清空聊天记忆，然后获取新的摘要
    useEffect(() => {
        // 先清空当前的客户信息
        if (onCustomerInfoUpdate) {
            // 创建一个空的客户信息对象
            const emptyCustomerInfo: ApiCustomerInfo = {
                name: null,
                age: null,
                gender: null,
                region: null,
                contact: null
            };
            onCustomerInfoUpdate(emptyCustomerInfo);
        }
        
        // 然后获取新的聊天历史摘要
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
                        if (parsedSummary && parsedSummary.summary_json && parsedSummary.summary_json.customer_info) {
                            if (onCustomerInfoUpdate) {
                                onCustomerInfoUpdate(parsedSummary.summary_json.customer_info);
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
        
        fetchInitialSummary();
    }, [selectedAccount, selectedConversation, onCustomerInfoUpdate]);

    // 默认客户信息，当 API 返回的信息不可用时使用
    const defaultCustomerInfo = {
        name: '未知',
        age: '未知',
        gender: '未知',
        region: '未知',
        contact: '未知'
    };

    // 合并 API 返回的客户信息和默认信息
    const displayInfo = {
        ...defaultCustomerInfo,
        ...customerInfo
    };

    // 将 null 值替换为 "未知"
    Object.keys(displayInfo).forEach(key => {
        const k = key as keyof typeof displayInfo;
        if (displayInfo[k] === null) {
            displayInfo[k] = '未知';
        }
    });

    // 获取聊天历史摘要的函数
    const fetchChatHistorySummary = async () => {
        // 确保 selectedAccount 和 selectedConversation 都不为 null 且具有必要的属性
        if (selectedAccount && selectedConversation && selectedAccount.wxid && selectedConversation.room_id) {
            setIsLoading(true);
            const roomId = selectedConversation.room_id.replace(/@/g, '');

            
            // 先清空当前的客户信息
            if (onCustomerInfoUpdate) {
                // 创建一个空的客户信息对象
                const emptyCustomerInfo: ApiCustomerInfo = {
                    name: null,
                    age: null,
                    gender: null,
                    region: null,
                    contact: null
                };
                onCustomerInfoUpdate(emptyCustomerInfo);
            }
            
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
                console.log('生成聊天历史摘要 API 响应:', response);
                
                // 第二步：获取生成的聊天摘要
                // 等待一段时间，确保摘要已经生成
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
                            
                            // 提取客户信息并更新状态
                            if (parsedSummary && parsedSummary.summary_json && parsedSummary.summary_json.customer_info) {
                                if (onCustomerInfoUpdate) {
                                    onCustomerInfoUpdate(parsedSummary.summary_json.customer_info);
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
                }, 5000); // 等待 5 秒后获取摘要
                
            } catch (error) {
                console.error('生成聊天历史摘要时出错:', error);
                setIsLoading(false);
            }
        } else {
            console.warn('未选择账号或对话，无法生成聊天历史摘要');
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">聊天记忆</h2>
                {isLoading ? (
                    <button className="btn btn-square">
                        <span className="loading loading-spinner"></span>
                    </button>
                ) : (
                    <button 
                        className="btn btn-xs btn-outline btn-primary"
                        onClick={fetchChatHistorySummary}
                        disabled={!selectedAccount || !selectedConversation || !selectedAccount?.wxid || !selectedConversation?.room_id}
                    >
                        更新记忆
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Timeline with customer info */}
            <div className="flex-1 overflow-y-auto pr-4">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-purple-200" />

                    {/* Customer Info Items */}
                    <div className="space-y-6">
                        {/* Name and basic info */}
                        <div className="relative flex items-start ml-2">
                            {/* Timeline Dot */}
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>

                            {/* Content */}
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    姓名：<span className="text-gray-700 ml-1">{displayInfo.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Age */}
                        <div className="relative flex items-start ml-2">
                            {/* Timeline Dot */}
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>

                            {/* Content */}
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    年龄：<span className="text-gray-700 ml-1">{displayInfo.age}</span>
                                </div>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="relative flex items-start ml-2">
                            {/* Timeline Dot */}
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>

                            {/* Content */}
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    性别：<span className="text-gray-700 ml-1">{displayInfo.gender}</span>
                                </div>
                            </div>
                        </div>

                        {/* Region */}
                        <div className="relative flex items-start ml-2">
                            {/* Timeline Dot */}
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>

                            {/* Content */}
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    地区：<span className="text-gray-700 ml-1">{displayInfo.region}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="relative flex items-start ml-2">
                            {/* Timeline Dot */}
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>

                            {/* Content */}
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    联系方式：<span className="text-gray-700 ml-1">{displayInfo.contact}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

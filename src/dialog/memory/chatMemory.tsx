import React from 'react';

interface ApiCustomerInfo {
    name: string | null;
    contact: string | null;
    gender: string | null;
    age_group: string | null;
    city_tier: string | null;
    specific_location: string | null;
    occupation_type: string | null;
    marital_status: string | null;
    family_structure: string | null;
    income_level_estimated: string | null;
}

interface ChatMemoryProps {
    customerInfo?: ApiCustomerInfo;
    selectedAccount?: { wxid: string; name: string } | null;
    selectedConversation?: { room_id: string; room_name: string } | null;
    isLoading?: boolean;
    onUpdateMemory?: () => void;
}

const ChatMemory: React.FC<ChatMemoryProps> = ({ 
    customerInfo, 
    selectedAccount, 
    selectedConversation,
    isLoading = false,
    onUpdateMemory
}) => {

    // 默认客户信息，当 API 返回的信息不可用时使用
    const defaultCustomerInfo = {
        name: '未知',
        contact: '未知',
        gender: '未知',
        age_group: '未知',
        city_tier: '未知',
        specific_location: '未知',
        occupation_type: '未知',
        marital_status: '未知',
        family_structure: '未知',
        income_level_estimated: '未知'
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

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 h-[30vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-medium">客户基础信息</h2>
                {isLoading ? (
                    <button className="btn btn-xs">
                        <span className="loading loading-spinner loading-xs"></span>
                    </button>
                ) : (
                    <button 
                        className="btn btn-xs btn-outline btn-primary"
                        onClick={onUpdateMemory}
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
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    姓名：<span className="text-gray-700 ml-1">{displayInfo.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    联系方式：<span className="text-gray-700 ml-1">{displayInfo.contact}</span>
                                </div>
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    性别：<span className="text-gray-700 ml-1">{displayInfo.gender}</span>
                                </div>
                            </div>
                        </div>

                        {/* Age Group */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    年龄段：<span className="text-gray-700 ml-1">{displayInfo.age_group}</span>
                                </div>
                            </div>
                        </div>

                        {/* City Tier */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    城市等级：<span className="text-gray-700 ml-1">{displayInfo.city_tier}</span>
                                </div>
                            </div>
                        </div>

                        {/* Specific Location */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    具体位置：<span className="text-gray-700 ml-1">{displayInfo.specific_location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Occupation Type */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    职业类型：<span className="text-gray-700 ml-1">{displayInfo.occupation_type}</span>
                                </div>
                            </div>
                        </div>

                        {/* Marital Status */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    婚姻状况：<span className="text-gray-700 ml-1">{displayInfo.marital_status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Family Structure */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    家庭结构：<span className="text-gray-700 ml-1">{displayInfo.family_structure}</span>
                                </div>
                            </div>
                        </div>

                        {/* Income Level */}
                        <div className="relative flex items-start ml-2">
                            <div className="absolute -left-2 mt-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                            </div>
                            <div className="ml-6">
                                <div className="text-purple-500 font-medium">
                                    估计收入水平：<span className="text-gray-700 ml-1">{displayInfo.income_level_estimated}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ChatMemory;
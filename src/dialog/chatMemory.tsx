import React from 'react';
import clsx from 'clsx';

interface ApiCustomerInfo {
    name: string | null;
    age: string | null;
    gender: string | null;
    region: string | null;
    contact: string | null;
}

interface ChatMemoryProps {
    customerInfo?: ApiCustomerInfo;
}

export const ChatMemory: React.FC<ChatMemoryProps> = ({ customerInfo }) => {
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

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">聊天记忆</h2>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
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

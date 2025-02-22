import React from 'react';
import clsx from 'clsx';

interface Memory {
    id: number;
    date: string;
    content: string;
}

export const ChatMemory: React.FC = () => {
    const memories: Memory[] = [
        {
            id: 1,
            date: '日期',
            content: '对黄金微针感兴趣'
        },
        {
            id: 2,
            date: '日期',
            content: '对黄金微针感兴趣'
        },
        {
            id: 3,
            date: '日期',
            content: '对黄金微针感兴趣'
        },
        {
            id: 4,
            date: '日期',
            content: '对黄金微针感兴趣'
        }
    ];

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-medium">聊天记忆</h2>
                <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto pr-4">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-purple-200" />

                    {/* Memory Items */}
                    <div className="space-y-8">
                        {memories.map((memory, index) => (
                            <div key={memory.id} className="relative flex items-start ml-2">
                                {/* Timeline Dot */}
                                <div className="absolute -left-2 mt-1.5">
                                    <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                                </div>

                                {/* Content */}
                                <div className="ml-6">
                                    <div className="text-sm text-purple-500 font-medium mb-1">
                                        {memory.date}:
                                    </div>
                                    <div className="text-gray-700">
                                        {memory.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

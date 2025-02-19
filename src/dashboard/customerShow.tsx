import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CustomerData {
    name: string;
    value: number;
}

const data: CustomerData[] = [
    { name: '当前客户', value: 82.3 },
    { name: '新客户', value: 17.7 },
];

const COLORS = ['#FF9999', '#6B8DE3'];

export const CustomerShow: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-semibold">客户</h2>
                    <p className="text-sm text-gray-500">引进私域客户</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#FF9999] mr-2"></div>
                        <span className="text-sm">当前客户</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#6B8DE3] mr-2"></div>
                        <span className="text-sm">新客户</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={0}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-2xl font-bold text-blue-600">82.3%</div>
                        <div className="text-sm text-gray-500">总计</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-red-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">每日客户</span>
                            <div className="flex items-center text-red-500">
                                <span className="text-lg font-semibold">+18%</span>
                                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">每周新客户</span>
                            <div className="flex items-center text-blue-500">
                                <span className="text-lg font-semibold">+14%</span>
                                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none">
                                    <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

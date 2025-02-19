import React, { useState } from 'react';
import { ManualDialog } from './manualDialog';

export const DashboardHeader: React.FC = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    return (
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-semibold">Hi XXX,</h1>
                <p className="text-gray-600">欢迎回来！</p>
            </div>
            
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="搜索"
                        className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    />
                    <svg
                        className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                
                <div className="relative">
                    <button 
                        className="relative p-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                            1
                        </span>
                    </button>
                </div>
                <ManualDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
            </div>
        </div>
    );
};

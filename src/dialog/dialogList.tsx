import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import { RoomListMessage } from '../api/mysql';
import { getMessageContent } from '../utils/messageTypes';

interface DialogListProps {
    dialogs?: RoomListMessage[];
    onSelectDialog?: (dialog: RoomListMessage) => void;
}

export const DialogList: React.FC<DialogListProps> = ({ dialogs = [], onSelectDialog }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const getAvatarText = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    const handleDialogClick = (dialog: RoomListMessage) => {
        setSelectedId(dialog.msg_id);
        onSelectDialog?.(dialog);
    };

    const filteredDialogs = dialogs.filter(dialog =>
        (dialog.room_name || dialog.sender_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">会话</h3>
                    <span className="bg-purple-500 text-white text-sm px-2 py-0.5 rounded-full">
                        {filteredDialogs.length}
                    </span>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="搜索"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-4 py-2 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-auto"
                    />
                    <svg
                        className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {/* Dialog List */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {filteredDialogs.length === 0 ? (
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
                        <p>没有会话</p>
                    </div>
                ) : (
                    <div className="space-y-1 p-2">
                        {filteredDialogs.map(dialog => (
                            <div 
                                key={dialog.msg_id}
                                className={clsx(
                                    'flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors',
                                    selectedId === dialog.msg_id ? 'bg-purple-100' : 'hover:bg-gray-100'
                                )}
                                onClick={() => handleDialogClick(dialog)}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {getAvatarText(dialog.room_name || dialog.sender_name || 'Chat')}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                            {dialog.room_name || dialog.sender_name || 'Chat'}
                                        </h3>
                                        <div className="text-sm text-gray-500 truncate">
                                            {dialog.msg_content ? getMessageContent(dialog.msg_type, dialog.msg_content) : '没有消息'}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <span className="text-xs text-gray-500">
                                            {formatTime(new Date(dialog.msg_datetime).getTime() / 1000)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
                       
};

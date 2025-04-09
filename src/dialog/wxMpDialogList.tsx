import React, { useState } from 'react';
import clsx from 'clsx';

import { MpRoomListMessage } from '../api/mysql';
import { getMpMessageContent } from '../utils/mpMessageTypes';

interface WxMpDialogListProps {
    dialogs?: MpRoomListMessage[];
    onSelectDialog?: (dialog: MpRoomListMessage) => void;
    isLoading?: boolean;
    selectedDialog?: MpRoomListMessage | null;
    mpAccountName?: string;
    mpAccountId?: string;
}

export const WxMpDialogList: React.FC<WxMpDialogListProps> = ({ 
    dialogs = [], 
    onSelectDialog, 
    isLoading = false, 
    selectedDialog = null, 
    mpAccountName = '',
    mpAccountId = ''
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter dialogs based on search query
    const filteredDialogs = dialogs.filter(dialog => {
        const query = searchQuery.toLowerCase();
        return (
            dialog.room_name.toLowerCase().includes(query) ||
            dialog.msg_content.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex flex-col h-full border-r overflow-hidden max-w-full overflow-x-hidden">
            {/* Header with account info */}
            <div className="flex items-center p-3 border-b bg-gray-50">
                <div className="flex-1">
                    <h3 className="text-sm font-medium">{mpAccountName || '公众号'}</h3>
                    <p className="text-xs text-gray-500">{mpAccountId || ''}</p>
                </div>
            </div>

            {/* Search box */}
            <div className="p-2 border-b">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="搜索对话..."
                        className="w-full p-2 pl-8 text-sm border rounded-md"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg
                        className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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

            {/* Dialog list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <span className="loading loading-spinner loading-md"></span>
                        <span className="ml-2 text-gray-500">加载中...</span>
                    </div>
                ) : filteredDialogs.length === 0 ? (
                    <div className="flex items-center justify-center h-full p-4 text-center text-gray-500">
                        {searchQuery ? '没有找到匹配的对话' : '暂无对话记录'}
                    </div>
                ) : (
                    <ul>
                        {filteredDialogs.map((dialog) => (
                            <li
                                key={dialog.room_id}
                                className={clsx(
                                    'p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors',
                                    {
                                        'bg-blue-50': selectedDialog?.room_id === dialog.room_id,
                                    }
                                )}
                                onClick={() => onSelectDialog?.(dialog)}
                            >
                                <div className="flex items-start">
                                    <div className="w-10 h-10 mr-3 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                        {dialog.user_id.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-sm font-medium truncate">{dialog.user_id}</h4>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                {new Date(dialog.msg_datetime).toLocaleTimeString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {getMpMessageContent(dialog.msg_type, dialog.msg_content)}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

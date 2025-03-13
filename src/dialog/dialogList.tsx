import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import { RoomListMessage } from '../api/mysql';
import { getMessageContent } from '../utils/messageTypes';

interface AvatarData {
    wxid: string;
    smallHeadImgUrl: string;
    bigHeadImgUrl: string;
    update_time: string;
}

interface DialogListProps {
    dialogs?: RoomListMessage[];
    onSelectDialog?: (dialog: RoomListMessage) => void;
    isLoading?: boolean;
    avatarList?: AvatarData[];
    humanList?: string[];
}

export const DialogList: React.FC<DialogListProps> = ({ dialogs = [], onSelectDialog, isLoading = false, avatarList = [], humanList = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showHumanDialog, setShowHumanDialog] = useState(false);
    
    // Format the human list with required fields
    const formattedHumanList = humanList.map(wxid => {
        // Find the corresponding conversation for this wxid
        const dialog = dialogs.find(conv => conv.room_id === wxid);
        // Find avatar from avatar list
        const avatar = avatarList.find(av => av.wxid === wxid)?.smallHeadImgUrl || '';
        return {
            wxid,
            avatar,
            content: dialog?.msg_content || '',
            name: dialog?.room_name || dialog?.sender_name || wxid
        };
    });

    const getAvatarText = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const handleDialogClick = (dialog: RoomListMessage) => {
        setSelectedId(dialog.msg_id);
        onSelectDialog?.(dialog);
    };

    const filteredDialogs = dialogs.filter(dialog =>
        (dialog.room_name || dialog.sender_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Human Dialog Popup
    return (
        <>
            <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
                <div className="p-2 border-b flex items-center justify-between">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="搜索"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-4 py-2 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        />
                        <button 
                            className="ml-2 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                            onClick={() => setShowHumanDialog(true)}
                        >
                            人工
                        </button>
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
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <span className="loading loading-spinner loading-md mb-2"></span>
                            <p>加载中...</p>
                        </div>
                    ) : filteredDialogs.length === 0 ? (
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
                            <p>没有记录</p>
                        </div>
                    ) : (
                        <div className="space-y-1 p-1">
                            {filteredDialogs.map(dialog => (
                                <div 
                                    key={dialog.msg_id}
                                    className={clsx(
                                        'flex items-center space-x-1 p-3 rounded-lg cursor-pointer transition-colors',
                                        selectedId === dialog.msg_id ? 'bg-purple-100' : 'hover:bg-gray-100'
                                    )}
                                    onClick={() => handleDialogClick(dialog)}
                                >
                                    {/* Avatar */}
                                    {avatarList.find(avatar => avatar.wxid === dialog.room_id) ? (
                                        <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                                            <img 
                                                src={avatarList.find(avatar => avatar.wxid === dialog.room_id)?.smallHeadImgUrl} 
                                                alt={dialog.room_name || dialog.sender_name || 'Chat'} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.classList.add('bg-purple-500', 'flex', 'items-center', 'justify-center', 'text-white', 'font-bold');
                                                        parent.textContent = getAvatarText(dialog.room_name || dialog.sender_name || 'Chat');
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {getAvatarText(dialog.room_name || dialog.sender_name || 'Chat')}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {dialog.room_name || dialog.sender_name || 'Chat'}
                                            </h3>
                                            <div className="text-xs text-gray-500 truncate">
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

            {/* Human Dialog Modal */}
            {showHumanDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium">需要人工处理的对话</h3>
                            <button 
                                onClick={() => setShowHumanDialog(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {formattedHumanList.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>暂无需要人工处理的对话</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {formattedHumanList.map(human => (
                                        <div key={human.wxid} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                            {human.avatar ? (
                                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                                    <img src={human.avatar} alt={human.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                                                    {getAvatarText(human.name)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium">{human.name}</h4>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {human.content 
                                                        ? human.content.length > 12 
                                                            ? `${human.content.substring(0, 12)}...` 
                                                            : human.content 
                                                        : '没有消息'}
                                                </p>
                                            </div>
                                            <button 
                                                className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                                                onClick={() => {
                                                    // Find the dialog with this wxid and select it
                                                    const dialog = dialogs.find(d => d.room_id === human.wxid);
                                                    if (dialog) {
                                                        handleDialogClick(dialog);
                                                        setShowHumanDialog(false);
                                                    }
                                                }}
                                            >
                                                处理
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button 
                                onClick={() => setShowHumanDialog(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

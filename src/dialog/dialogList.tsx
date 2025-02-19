import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DialogUser {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
}

export const DialogList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const users: DialogUser[] = [
        {
            id: 1,
            name: 'Alexan',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
            lastMessage: '好的稍等',
            time: '1min ago',
            unread: 3,
            online: true
        },
        {
            id: 2,
            name: 'Carin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carin',
            lastMessage: '👋',
            time: '2min ago',
            unread: 0,
            online: true
        },
        {
            id: 3,
            name: 'Dona',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dona',
            lastMessage: '好的',
            time: '5h ago',
            unread: 0,
            online: false
        }
    ];

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">会话</h3>
                    <span className="bg-purple-500 text-white text-sm px-2 py-0.5 rounded-full">
                        5
                    </span>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="搜索"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-4 py-1 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <svg
                        className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2"
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
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {filteredUsers.map((user) => (
                    <div
                        key={user.id}
                        onClick={() => navigate(`/dialog/${user.id}`)}
                        className="flex items-center p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                        <div className="relative">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full"
                            />
                            {user.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {user.name}
                                </h4>
                                <span className="text-xs text-gray-500">
                                    {user.time}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-gray-500 truncate">
                                    {user.lastMessage}
                                </p>
                                {user.unread > 0 && (
                                    <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {user.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

interface Notification {
    id: number;
    user: string;
    avatar: string;
    status: string;
    time: string;
    message: string;
}

const notifications: Notification[] = [
    {
        id: 1,
        user: '李丽颖',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        status: '需人工',
        time: '2h',
        message: '快递单号看不懂...'
    },
    {
        id: 2,
        user: '钱琳',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        status: '需人工',
        time: '4h',
        message: '什么时候发货...'
    },
    {
        id: 3,
        user: '周晓冰',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        status: '已转化',
        time: '10h',
        message: '收到货了'
    }
];

interface ManualDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ManualDialog: React.FC<ManualDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6">
                    <DialogTitle as="h3" className="text-lg font-medium text-gray-900 mb-4">
                        最近的通知
                    </DialogTitle>
                    
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div key={notification.id} className="flex items-start space-x-3">
                                <div className="relative">
                                    <img
                                        src={notification.avatar}
                                        alt={notification.user}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="absolute -top-1 -right-1">
                                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{notification.user}</h4>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-red-500 text-sm">{notification.status}</span>
                                                <span className="text-sm text-gray-500">{notification.message}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400">{notification.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6">
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            清除全部通知
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

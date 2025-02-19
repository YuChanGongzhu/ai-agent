import React from 'react';

interface Contact {
    id: number;
    name: string;
    email: string;
    avatar: string;
}

const contacts: Contact[] = [
    {
        id: 1,
        name: '客户名称',
        email: '归属账号',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
    },
    {
        id: 2,
        name: 'George Litz',
        email: 'georgelitz@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
    },
    {
        id: 3,
        name: 'John Miller',
        email: 'jmiller@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
    },
    {
        id: 4,
        name: 'Jane Johnson',
        email: 'jj@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
    }
];

export const WechatList: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold mb-4">客户列表</h2>
            <div className="space-y-4">
                {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-12 h-12 rounded-full"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium">{contact.name}</span>
                            <span className="text-sm text-gray-500">{contact.email}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

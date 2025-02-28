import { DialogList } from './dialogList';
import { DialogPage } from './dialogPage';
import { ChatMemory } from './chatMemory';
import { MaterialBase } from './materialBase';
import { EmployeeStudy } from './employeeStudy';
import {  getConversationsApi } from '../api/dify';
import { useEffect, useState } from 'react';
import { Conversation } from '../api/dify';
import { getWxAccountListApi, WxAccount } from '../api/airflow';

export const Dialog = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [wxAccountList, setWxAccountList] = useState<WxAccount[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<WxAccount | null>(null);
    const [showAIDropdown, setShowAIDropdown] = useState<{[key: string]: boolean}>({});

    const getConversations = async () => {
        if (!selectedAccount) return;
        
        try {
            const res = await getConversationsApi({ 
                user: selectedAccount.name,
                limit: 100
            });
            setConversations(res.data);
            console.log('Conversations loaded for', selectedAccount.name, ':', res.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    useEffect(() => {
        const fetchWxAccounts = async () => {
            try {
                const accounts = await getWxAccountListApi();
                setWxAccountList(accounts);
            } catch (error) {
                console.error('Failed to fetch wx accounts:', error);
            }
        };
        fetchWxAccounts();
    }, [])
    useEffect(() => {
        console.log('wxAccountList:', wxAccountList);
    },[wxAccountList])

    useEffect(() => {
        if (selectedAccount) {
            getConversations();
        }
    }, [selectedAccount]);

    return (
        <div className="h-screen p-6 flex flex-col space-y-4">
            {/* Account Selection */}
            <div className="flex space-x-2 mb-4">
                {wxAccountList.map((account) => (
                    <div key={account.wxid} className="relative">
                        <button
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${selectedAccount?.name === account.name ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            onClick={() => setSelectedAccount(account)}
                        >
                            <span>{account.name}</span>
                            <button 
                                className="ml-2 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAIDropdown(prev => ({
                                        ...prev,
                                        [account.wxid]: !prev[account.wxid]
                                    }));
                                }}
                            >
                                AI
                            </button>
                        </button>
                        {showAIDropdown[account.wxid] && (
                            <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg py-2 z-10">
                                <button 
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                    onClick={() => {
                                        // Handle AI enable
                                        setShowAIDropdown(prev => ({ ...prev, [account.wxid]: false }));
                                    }}
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                    </div>
                                    <span>全部开启</span>
                                </button>
                                <button 
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                    onClick={() => {
                                        // Handle AI disable
                                        setShowAIDropdown(prev => ({ ...prev, [account.wxid]: false }));
                                    }}
                                >
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                    <span>全部关闭</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex space-x-6 flex-1">
                {/* Left Column - Chat List */}
                <div className="w-[240px] flex-shrink-0 h-[calc(100vh-100px)]">
                <div className="h-full w-full">
                    <DialogList 
                        dialogs={conversations}
                        onSelectDialog={setSelectedConversation}
                    />
                </div>
            </div>

            {/* Middle Column - Chat Window */}
            <div className="flex-1">
                <div className="h-[calc(100vh-120px)] overflow-y-auto">
                    <DialogPage 
                        conversation={selectedConversation}
                        selectedAccount={selectedAccount}
                    />
                </div>
            </div>

            {/* Right Column - Material and Study */}
            <div className="w-[300px] flex-shrink-0">
                <div className="h-full flex flex-col space-y-6">
                    {/* Material List */}
                    <div className="flex-shrink-0">
                        <MaterialBase />
                    </div>

                    {/* Today's Memory */}
                    <div className="flex-shrink-0">
                        <ChatMemory />
                    </div>

                    {/* Employee Study */}
                    <div className="flex-1">
                        <EmployeeStudy />
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};
import { DialogList } from './dialogList';
import { DialogPage } from './dialogPage';
import { MaterialBase } from './materialBase';
import Memory from './memory';
import { useEffect, useState, useRef } from 'react';
import { getUserMsgCountApi, WxAccount, getWxCountactHeadListApi, getWxHumanListApi } from '../api/airflow';
import { getRoomListMessagesApi, RoomListMessage } from '../api/mysql';
import { useWxAccount } from '../context/WxAccountContext';



interface AvatarData {
    wxid: string;
    smallHeadImgUrl: string;
    bigHeadImgUrl: string;
    update_time: string;
}

export const Dialog = () => {
    const [conversations, setConversations] = useState<RoomListMessage[]>([]);
    const [avatarList, setAvatarList] = useState<AvatarData[]>([]);
    const [humanList, setHumanList] = useState<string[]>([]);
    const { filteredWxAccountList, isLoading: isLoadingAccounts } = useWxAccount();
    const [selectedConversation, setSelectedConversation] = useState<RoomListMessage | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<WxAccount | null>(null);
    const [showAIDropdown, setShowAIDropdown] = useState<{ [key: string]: boolean }>({});
    const [messageCount, setMessageCount] = useState<string>('');
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);

    const getHumanList = async () => {//获取微信转人工列表
        try {
            const res = await getWxHumanListApi(selectedAccount?.name || '', selectedAccount?.wxid || '');
            const humanData = JSON.parse(res.value);
            const humanArray: string[] = Object.values(humanData);
            setHumanList(humanArray);
        } catch (error) {
            console.error('Failed to fetch wx human list:', error);
        }
    }

    const getConversations = async () => {//获取微信会话列表
        if (!selectedAccount) return;
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const res = await getRoomListMessagesApi({
                wx_user_id: selectedAccount.wxid
            });
            setConversations(res.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoadingConversations(false);
        }
    };

    useEffect(() => {
        const pollMessageCount = async () => {
            if (!selectedAccount) return;
            try {
                const response = await getUserMsgCountApi(selectedAccount.name);
                const newCount = response.value;
                if (newCount !== messageCount) {
                    setMessageCount(newCount);
                }
            } catch (error) {
                console.error('Error polling message count:', error);
            }
        };
        if (selectedAccount) {
            pollMessageCount();
            pollingInterval.current = setInterval(pollMessageCount, 3000);
        }
        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, [selectedAccount, messageCount]);

    useEffect(() => {
        if (messageCount && selectedAccount) {
            const currentConversation = selectedConversation;
            const updateConversationsAndCheckSelected = async () => {
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const res = await getRoomListMessagesApi({
                        wx_user_id: selectedAccount.wxid
                    });
                    
                    setConversations(res.data);
                    if (currentConversation) {
                        const matchingConversation = res.data.find(conv => 
                            conv.room_id === currentConversation.room_id
                        );
                        if (matchingConversation && JSON.stringify(matchingConversation) !== JSON.stringify(currentConversation)) {
                            setSelectedConversation(matchingConversation);
                        }
                    }
                    getHumanList();
                } catch (error) {
                    console.error('Error refreshing conversations:', error);
                } finally{
                    setIsLoadingConversations(false)
                }
            };
            updateConversationsAndCheckSelected();
        }
    }, [messageCount])

    const getHeadList = async () => {
        try {
            const res = await getWxCountactHeadListApi(selectedAccount?.name || '', selectedAccount?.wxid || '');
            const avatarData = JSON.parse(res.value);
            const avatarArray: AvatarData[] = Object.values(avatarData);
            setAvatarList(avatarArray);
        } catch (error) {
            console.error('Failed to fetch wx accounts:', error);
        }
    }

    const refreshHumanList = () => {
        if (selectedAccount) {
            getHumanList();
        }
    }

    useEffect(() => {
        if (selectedAccount) {
            setConversations([]);
            getHeadList();
            setIsLoadingConversations(true);
            getConversations();
            getHumanList();
        }
    }, [selectedAccount]);

    return (
        <div className="h-screen p-2 flex flex-col space-y-4">
            <div className="flex space-x-2 mb-2 h-[5vh]">
                {isLoadingAccounts ? (
                    <div className="flex items-center justify-center py-2">
                        <span className="loading loading-spinner loading-md"></span>
                        <span className="ml-2 text-gray-500">加载中...</span>
                    </div>
                ) : !filteredWxAccountList.length ? (
                    <div className="flex items-center justify-center w-full py-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <span className="text-gray-500 block mb-1">暂无可用的微信账号</span>
                            <span className="text-xs text-gray-400">请联系管理员获取微信账号访问权限</span>
                        </div>
                    </div>
                ) : (
                    filteredWxAccountList.map((account) => (
                        <div key={account.wxid} className="relative">
                            <button
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${selectedAccount?.name === account.name ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                onClick={() => {
                                    setSelectedAccount(account);
                                }}>
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
                                >AI</button>
                            </button>
                            {showAIDropdown[account.wxid] && (
                                <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg py-2 z-10">
                                    <button
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                        onClick={() => { setShowAIDropdown(prev => ({ ...prev, [account.wxid]: false })) }}>
                                        <div className="w-4 h-4 rounded-full border-2 border-purple-600 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                        </div>
                                        <span>全部开启</span>
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                        onClick={() => {
                                            setShowAIDropdown(prev => ({ ...prev, [account.wxid]: false }));
                                        }}
                                    >
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                        <span>全部关闭</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )))}
            </div>

            <div className="flex space-x-6 flex-1">
                <div className="w-[13vw] flex-shrink-0 h-[90vh]">
                    <div className="h-full w-full">
                        <DialogList
                            dialogs={conversations}
                            onSelectDialog={setSelectedConversation}
                            isLoading={isLoadingConversations}
                            avatarList={avatarList}
                            humanList={humanList}
                        />
                    </div>
                </div>

                <div className="h-[90vh] w-[50vw] overflow-y-auto">
                    <DialogPage
                        conversation={selectedConversation}
                        selectedAccount={selectedAccount}
                        avatarList={avatarList}
                        refreshHumanList={refreshHumanList}
                        humanList={humanList}
                    />
                </div>

                <div className="flex-1">
                    <div className="h-[80vh] flex flex-col space-y-2">
                        <div className="flex-shrink-0">
                            <Memory
                                selectedAccount={selectedAccount}
                                selectedConversation={selectedConversation}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
import { DialogList } from './dialogList';
import { DialogPage } from './dialogPage';
import { WxMpDialogList } from './wxMpDialogList';
import { WxMpDialogPage } from './wxMpDialogPage';
import Memory from './memory';
import { useEffect, useState, useRef } from 'react';
import { getUserMsgCountApi, WxAccount, WxMpAccount, getWxCountactHeadListApi, getWxHumanListApi, getWxAccountSingleChatApi, getWxAccountGroupChatApi, updateWxAccountSingleChatApi, updateWxAccountGroupChatApi, getAIReplyListApi, getDisableAIReplyListApi, getWxMpAccountListApi } from '../api/airflow';
import { getRoomListMessagesApi, RoomListMessage, getMpRoomListApi, MpRoomListMessage } from '../api/mysql';
import { useWxAccount } from '../context/WxAccountContext';
import { useUser } from '../context/UserContext';



interface AvatarData {
    wxid: string;
    smallHeadImgUrl: string;
    bigHeadImgUrl: string;
    update_time: string;
}

export const Dialog = () => {
    const { isAdmin } = useUser();
    
    // Regular WeChat account states
    const [conversations, setConversations] = useState<RoomListMessage[]>([]);
    const [avatarList, setAvatarList] = useState<AvatarData[]>([]);
    const [humanList, setHumanList] = useState<string[]>([]);
    const { filteredWxAccountList, isLoading: isLoadingAccounts } = useWxAccount();
    const [selectedConversation, setSelectedConversation] = useState<RoomListMessage | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<WxAccount | null>(null);
    const [messageCount, setMessageCount] = useState<string>('');
    const [currentTokenUsage, setCurrentTokenUsage] = useState<number>(0);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [singleChatEnabled, setSingleChatEnabled] = useState(false);
    const [groupChatEnabled, setGroupChatEnabled] = useState(false);
    const [enabledRooms, setEnabledRooms] = useState<string[]>([]);
    const [disabledRooms, setDisabledRooms] = useState<string[]>([]);
    const [loadingAISettings, setLoadingAISettings] = useState(false);
    const pollingInterval = useRef<NodeJS.Timeout | null>(null);
    
    // MP account states
    const [wxMpAccountList, setWxMpAccountList] = useState<WxMpAccount[]>([]);
    const [isLoadingMpAccounts, setIsLoadingMpAccounts] = useState(false);
    const [selectedMpAccount, setSelectedMpAccount] = useState<WxMpAccount | null>(null);
    const [mpConversations, setMpConversations] = useState<MpRoomListMessage[]>([]);
    const [selectedMpConversation, setSelectedMpConversation] = useState<MpRoomListMessage | null>(null);
    const [isLoadingMpConversations, setIsLoadingMpConversations] = useState(false);
    const [viewMode, setViewMode] = useState<'regular' | 'mp'>('regular'); // Toggle between regular and MP view

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
    
    const fetchAISettings = async () => {
        if (!selectedAccount) return;
        
        setLoadingAISettings(true);
        try {
            const [singleChatResponse, groupChatResponse, enabledRoomsResponse, disabledRoomsResponse] = await Promise.all([
                getWxAccountSingleChatApi(selectedAccount.name, selectedAccount.wxid),
                getWxAccountGroupChatApi(selectedAccount.name, selectedAccount.wxid),
                getAIReplyListApi(selectedAccount.name, selectedAccount.wxid),
                getDisableAIReplyListApi(selectedAccount.name, selectedAccount.wxid)
            ]);
            
            setSingleChatEnabled(singleChatResponse.value === 'on');
            setGroupChatEnabled(groupChatResponse.value === 'on');
            
            try {
                const enabledRoomsData = JSON.parse(enabledRoomsResponse.value);
                setEnabledRooms(Array.isArray(enabledRoomsData) ? enabledRoomsData : []);
                
                const disabledRoomsData = JSON.parse(disabledRoomsResponse.value);
                setDisabledRooms(Array.isArray(disabledRoomsData) ? disabledRoomsData : []);
            } catch (error) {
                console.error('Error parsing AI rooms data:', error);
                setEnabledRooms([]);
                setDisabledRooms([]);
            }
        } catch (error) {
            console.error('Error fetching AI settings:', error);
        } finally {
            setLoadingAISettings(false);
        }
    };
    
    // Function to update single chat global setting
    const updateSingleChatSetting = async (newValue: boolean) => {
        if (!selectedAccount) return;
        
        try {
            await updateWxAccountSingleChatApi(
                selectedAccount.name,
                selectedAccount.wxid,
                newValue ? 'on' : 'off'
            );
            setSingleChatEnabled(newValue);
        } catch (error) {
            console.error('Error updating single chat setting:', error);
        }
    };
    
    const updateGroupChatSetting = async (newValue: boolean) => {
        if (!selectedAccount) return;
        
        try {
            await updateWxAccountGroupChatApi(
                selectedAccount.name,
                selectedAccount.wxid,
                newValue ? 'on' : 'off'
            );
            setGroupChatEnabled(newValue);
        } catch (error) {
            console.error('Error updating group chat setting:', error);
        }
    };

    useEffect(() => {
        if (selectedAccount) {
            setConversations([]);
            setSelectedConversation(null);
            setIsLoadingConversations(true);
            getHeadList();
            getConversations();
            getHumanList();
            fetchAISettings(); 
        }
    }, [selectedAccount]);

    const fetchMpAccounts = async () => {
        if (!isAdmin) return;
        
        setIsLoadingMpAccounts(true);
        try {
            const accounts = await getWxMpAccountListApi();
            setWxMpAccountList(accounts);
        } catch (error) {
            console.error('Failed to fetch WeChat MP accounts:', error);
        } finally {
            setIsLoadingMpAccounts(false);
        }
    };
    
    const getMpConversations = async () => {
        if (!selectedMpAccount) return;
        
        setIsLoadingMpConversations(true);
        try {
            const res = await getMpRoomListApi({
                gh_user_id: selectedMpAccount.gh_user_id
            });
            
            if (res.code === 0) {
                setMpConversations(res.data);
            } else {
                console.error('Failed to fetch MP conversations:', res.message);
            }
        } catch (error) {
            console.error('Error fetching MP conversations:', error);
        } finally {
            setIsLoadingMpConversations(false);
        }
    };
    
    useEffect(() => {
        if (isAdmin) {
            fetchMpAccounts();
        }
    }, [isAdmin]);
    
    useEffect(() => {
        if (selectedMpAccount) {
            getMpConversations();
            setViewMode('mp');
        }
    }, [selectedMpAccount]);

    // Handle clicking regular WeChat account button
    const handleWxAccountClick = (account: WxAccount) => {
        setSelectedAccount(account);
        setSelectedMpAccount(null);
        setViewMode('regular');
    };
    
    // Handle clicking MP account button
    const handleMpAccountClick = (account: WxMpAccount) => {
        setSelectedMpAccount(account);
        setSelectedAccount(null);
        setViewMode('mp');
    };
    
    return (
        <div className="h-screen p-2 flex flex-col space-y-4">
            <div className="flex flex-wrap space-x-2 mb-2 min-h-[5vh]">
                {/* Loading indicator */}
                {isLoadingAccounts || isLoadingMpAccounts ? (
                    <div className="flex items-center justify-center py-2">
                        <span className="loading loading-spinner loading-md"></span>
                        <span className="ml-2 text-gray-500">加载中...</span>
                    </div>
                ) : (!filteredWxAccountList.length && !wxMpAccountList.length) ? (
                    <div className="flex items-center justify-center w-full py-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <span className="text-gray-500 block mb-1">暂无可用的微信账号</span>
                            <span className="text-xs text-gray-400">请联系管理员获取微信账号访问权限</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Regular WeChat accounts */}
                        {filteredWxAccountList.length > 0 && filteredWxAccountList.map((account) => (
                        <div key={account.wxid} className="relative mb-2">
                            <button
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${selectedAccount?.name === account.name ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                onClick={() => handleWxAccountClick(account)}>
                                <span>{account.name}</span>
                                <span
                                    className={`ml-2 w-6 h-6 rounded-full ${selectedAccount?.name === account.name ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} flex items-center justify-center text-xs`}
                                >AI</span>
                            </button>
                        </div>
                    ))}
                    
                    {/* MP Account buttons - visible to admins */}
                    {isAdmin && wxMpAccountList.length > 0 && (
                        <div className="flex flex-wrap ml-2">
                            {wxMpAccountList.map((mpAccount) => (
                                <div key={mpAccount.gh_user_id} className="mb-2 mr-2">
                                    <button
                                        className={`flex items-center px-4 py-2 rounded-lg ${selectedMpAccount?.gh_user_id === mpAccount.gh_user_id ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        onClick={() => handleMpAccountClick(mpAccount)}
                                    >
                                        <span>{mpAccount.name}</span>
                                        <span 
                                            className={`ml-2 w-5 h-5 rounded-full ${selectedMpAccount?.gh_user_id === mpAccount.gh_user_id ? 'bg-white text-green-600' : 'bg-green-600 text-white'} flex items-center justify-center text-xs`}
                                        >MP</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    </>
                )}
            </div>

            <div className="flex space-x-6 flex-1">
                {viewMode === 'regular' ? (
                    <>
                        <div className="w-[13vw] flex-shrink-0 h-[90vh]">
                            <div className="h-full w-full">
                                <DialogList
                                    dialogs={conversations}
                                    onSelectDialog={(dialog, tokenUsage) => {
                                        setSelectedConversation(dialog);
                                        setCurrentTokenUsage(tokenUsage || 0);
                                    }}
                                    isLoading={isLoadingConversations}
                                    avatarList={avatarList}
                                    humanList={humanList}
                                    selectedDialog={selectedConversation}
                                    userName={selectedAccount?.name || ''}
                                    wxid={selectedAccount?.wxid || ''}
                                    singleChatEnabled={singleChatEnabled}
                                    groupChatEnabled={groupChatEnabled}
                                    enabledRooms={enabledRooms}
                                    disabledRooms={disabledRooms}
                                    updateSingleChatSetting={updateSingleChatSetting}
                                    updateGroupChatSetting={updateGroupChatSetting}
                                    isLoadingSettings={loadingAISettings}
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
                                singleChatEnabled={singleChatEnabled}
                                groupChatEnabled={groupChatEnabled}
                                enabledRooms={enabledRooms}
                                disabledRooms={disabledRooms}
                                onEnabledRoomsChange={setEnabledRooms}
                                onDisabledRoomsChange={setDisabledRooms}
                                initialTokenUsage={currentTokenUsage}
                            />
                        </div>
                    </>
                ) : (
                    // MP account view
                    <>
                        <div className="w-[13vw] flex-shrink-0 h-[90vh]">
                            <div className="h-full w-full">
                                <WxMpDialogList
                                    dialogs={mpConversations}
                                    onSelectDialog={setSelectedMpConversation}
                                    isLoading={isLoadingMpConversations}
                                    selectedDialog={selectedMpConversation}
                                    mpAccountName={selectedMpAccount?.name || ''}
                                    mpAccountId={selectedMpAccount?.gh_user_id || ''}
                                />
                            </div>
                        </div>

                        <div className="h-[90vh] w-[50vw] overflow-y-auto">
                            <WxMpDialogPage
                                conversation={selectedMpConversation}
                                mpAccountId={selectedMpAccount?.gh_user_id || ''}
                                mpAccountName={selectedMpAccount?.name || ''}
                            />
                        </div>
                    </>
                )}

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
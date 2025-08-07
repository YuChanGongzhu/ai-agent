import { DialogList } from "./dialogList";
import { UpdateDialogPage } from "./updateDialogPage";
import { WxMpDialogList } from "./wxMpDialogList";
import { WxMpDialogPage } from "./wxMpDialogPage";
import UpdateMemory from "./updateMemory";
import { useEffect, useState, useRef, Fragment } from "react";
import {
  getUserMsgCountApi,
  WxAccount,
  WxMpAccount,
  getWxCountactHeadListApi,
  getWxHumanListApi,
  getWxAccountSingleChatApi,
  getWxAccountGroupChatApi,
  updateWxAccountSingleChatApi,
  updateWxAccountGroupChatApi,
  getAIReplyListApi,
  getDisableAIReplyListApi,
  getWxMpAccountListApi,
} from "../api/airflow";
import { Menu, Transition } from "@headlessui/react";
import {
  getRoomListMessagesApi,
  RoomListMessage,
  getMpRoomListApi,
  MpRoomListMessage,
} from "../api/mysql";
import { useWxAccount } from "../context/WxAccountContext";
import { useUser } from "../context/UserContext";
import BreadcrumbComponent from "../components/Breadcrumb";
interface AvatarData {
  wxid: string;
  smallHeadImgUrl: string;
  bigHeadImgUrl: string;
  update_time: string;
}

export const UpdateDialog = () => {
  const { isAdmin } = useUser();

  // WxPerson WeChat account states
  const [conversations, setConversations] = useState<RoomListMessage[]>([]);
  const [avatarList, setAvatarList] = useState<AvatarData[]>([]);
  const [humanList, setHumanList] = useState<string[]>([]);
  const { filteredWxAccountList, isLoading: isLoadingAccounts } = useWxAccount();
  const [selectedConversation, setSelectedConversation] = useState<RoomListMessage | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<WxAccount | null>(null);
  const [messageCount, setMessageCount] = useState<string>("");
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

  // Mobile UI state
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail" | "memory">("list");
  const [previousView, setPreviousView] = useState<"list" | "detail">("detail");

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Reset mobile view to list when device changes from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileView("list");
    }
  }, [isMobile]);
  const [selectedMpConversation, setSelectedMpConversation] = useState<MpRoomListMessage | null>(
    null
  );
  const [isLoadingMpConversations, setIsLoadingMpConversations] = useState(false);
  const [viewMode, setViewMode] = useState<"wxPerson" | "mp">("wxPerson"); // Toggle between wxPerson and MP view

  const getHumanList = async () => {
    //获取微信转人工列表
    try {
      const res = await getWxHumanListApi(selectedAccount?.name || "", selectedAccount?.wxid || "");
      const humanData = JSON.parse(res.value);
      const humanArray: string[] = Object.values(humanData);
      setHumanList(humanArray);
    } catch (error) {
      console.error("Failed to fetch wx human list:", error);
    }
  };

  const getConversations = async () => {
    //获取微信会话列表
    if (!selectedAccount) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await getRoomListMessagesApi({
        wx_user_id: selectedAccount.wxid,
      });
      setConversations(res.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
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
        console.error("Error polling message count:", error);
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
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const res = await getRoomListMessagesApi({
            wx_user_id: selectedAccount.wxid,
          });

          setConversations(res.data);
          if (currentConversation) {
            const matchingConversation = res.data.find(
              (conv) => conv.room_id === currentConversation.room_id
            );
            if (
              matchingConversation &&
              JSON.stringify(matchingConversation) !== JSON.stringify(currentConversation)
            ) {
              setSelectedConversation(matchingConversation);
            }
          }
          getHumanList();
        } catch (error) {
          console.error("Error refreshing conversations:", error);
        } finally {
          setIsLoadingConversations(false);
        }
      };
      updateConversationsAndCheckSelected();
    }
  }, [messageCount]);

  const getHeadList = async () => {
    try {
      const res = await getWxCountactHeadListApi(
        selectedAccount?.name || "",
        selectedAccount?.wxid || ""
      );
      const avatarData = JSON.parse(res.value);
      const avatarArray: AvatarData[] = Object.values(avatarData);
      setAvatarList(avatarArray);
    } catch (error) {
      console.error("Failed to fetch wx accounts:", error);
    }
  };

  const refreshHumanList = () => {
    if (selectedAccount) {
      getHumanList();
    }
  };

  const fetchAISettings = async () => {
    if (!selectedAccount) return;

    setLoadingAISettings(true);
    try {
      const [singleChatResponse, groupChatResponse, enabledRoomsResponse, disabledRoomsResponse] =
        await Promise.all([
          getWxAccountSingleChatApi(selectedAccount.name, selectedAccount.wxid),
          getWxAccountGroupChatApi(selectedAccount.name, selectedAccount.wxid),
          getAIReplyListApi(selectedAccount.name, selectedAccount.wxid),
          getDisableAIReplyListApi(selectedAccount.name, selectedAccount.wxid),
        ]);

      setSingleChatEnabled(singleChatResponse.value === "on");
      setGroupChatEnabled(groupChatResponse.value === "on");

      try {
        const enabledRoomsData = JSON.parse(enabledRoomsResponse.value);
        setEnabledRooms(Array.isArray(enabledRoomsData) ? enabledRoomsData : []);

        const disabledRoomsData = JSON.parse(disabledRoomsResponse.value);
        setDisabledRooms(Array.isArray(disabledRoomsData) ? disabledRoomsData : []);
      } catch (error) {
        console.error("Error parsing AI rooms data:", error);
        setEnabledRooms([]);
        setDisabledRooms([]);
      }
    } catch (error) {
      console.error("Error fetching AI settings:", error);
    } finally {
      setLoadingAISettings(false);
    }
  };

  const updateSingleChatSetting = async (newValue: boolean) => {
    if (!selectedAccount) return;

    try {
      await updateWxAccountSingleChatApi(
        selectedAccount.name,
        selectedAccount.wxid,
        newValue ? "on" : "off"
      );
      setSingleChatEnabled(newValue);
    } catch (error) {
      console.error("Error updating single chat setting:", error);
    }
  };

  const updateGroupChatSetting = async (newValue: boolean) => {
    if (!selectedAccount) return;

    try {
      await updateWxAccountGroupChatApi(
        selectedAccount.name,
        selectedAccount.wxid,
        newValue ? "on" : "off"
      );
      setGroupChatEnabled(newValue);
    } catch (error) {
      console.error("Error updating group chat setting:", error);
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
      console.error("Failed to fetch WeChat MP accounts:", error);
    } finally {
      setIsLoadingMpAccounts(false);
    }
  };

  const getMpConversations = async () => {
    if (!selectedMpAccount) return;

    setIsLoadingMpConversations(true);
    try {
      const res = await getMpRoomListApi({
        gh_user_id: selectedMpAccount.gh_user_id,
      });

      if (res.code === 0) {
        setMpConversations(res.data);
      } else {
        console.error("Failed to fetch MP conversations:", res.message);
      }
    } catch (error) {
      console.error("Error fetching MP conversations:", error);
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
      setViewMode("mp");
    }
  }, [selectedMpAccount]);

  // Handle clicking wxPerson WeChat account button
  const handleWxAccountClick = (account: WxAccount) => {
    setSelectedAccount(account);
    setSelectedMpAccount(null);
    setViewMode("wxPerson");
  };

  // Handle clicking MP account button
  const handleMpAccountClick = (account: WxMpAccount) => {
    setSelectedMpAccount(account);
    setSelectedAccount(null);
    setViewMode("mp");
  };

  return (
    <div
      className="h-screen pt-14 md:pt-0 flex flex-col"
      style={{
        background: "linear-gradient(to right, #FDF3FC, #E7E9FE)",
      }}
    >
      <div className="bg-white pt-1">
        <BreadcrumbComponent
          items={[
            { title: "首页", href: "/updatedialog" },
            {
              title: `更新对话管理${selectedAccount?.name ? `（${selectedAccount?.name}）` : ""}${
                selectedMpAccount?.name ? `（${selectedMpAccount?.name}）` : ""
              }`,
            },
          ]}
          style={{ paddingLeft: "1.5rem" }}
        />
        {/* Tabbed UI Layout */}
        <div className="shadow-sm border border-gray-200">
          {/* Loading indicator */}
          {isLoadingAccounts || isLoadingMpAccounts ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : !filteredWxAccountList.length && !wxMpAccountList.length ? (
            <div className="flex items-center justify-center w-full py-8 bg-gray-50 rounded-lg">
              <div className="text-center">
                <span className="text-gray-500 block mb-1">暂无可用的微信账号</span>
                <span className="text-xs text-gray-400">请联系管理员获取微信账号访问权限</span>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile dropdown selector */}
              {isMobile ? (
                <div className="p-4">
                  {/* Combined accounts dropdown - only shown on list view */}
                  {mobileView === "list" &&
                    (filteredWxAccountList.length > 0 ||
                      (isAdmin && wxMpAccountList.length > 0)) && (
                      <Menu as="div" className="relative w-full">
                        <div>
                          <Menu.Button className="w-full flex justify-between items-center px-4 py-3 bg-white rounded-lg shadow-md border border-gray-100">
                            <span className="block font-medium">
                              {selectedAccount ? (
                                <span className="text-[#D477E1]">{selectedAccount.name}</span>
                              ) : selectedMpAccount ? (
                                <span className="text-green-600">{selectedMpAccount.name}</span>
                              ) : (
                                <span className="text-gray-600">选择账号</span>
                              )}
                            </span>
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute z-10 w-full mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {/* WxPerson WeChat accounts section */}
                            {filteredWxAccountList.length > 0 && (
                              <div className="px-1 py-1">
                                {filteredWxAccountList.length > 0 && (
                                  <div className="px-4 py-2 text-xs text-gray-500 font-medium bg-gray-50">
                                    微信账号
                                  </div>
                                )}
                                {filteredWxAccountList.map((account) => (
                                  <Menu.Item key={account.wxid}>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active || selectedAccount?.name === account.name
                                            ? "bg-[#f7c7fd] text-[#D477E1]"
                                            : "text-gray-900 hover:bg-gray-50"
                                        } group flex items-center justify-between w-full px-4 py-3 text-sm transition-colors`}
                                        onClick={() => handleWxAccountClick(account)}
                                      >
                                        <span className="font-medium">{account.name}</span>
                                        <span
                                          className={`w-6 h-6 rounded-full ${
                                            selectedAccount?.name === account.name
                                              ? "bg-[#D477E1] text-white"
                                              : "bg-gray-200 text-gray-700"
                                          } flex items-center justify-center text-xs font-bold`}
                                        >
                                          AI
                                        </span>
                                      </button>
                                    )}
                                  </Menu.Item>
                                ))}
                              </div>
                            )}

                            {/* MP accounts section - visible to admins */}
                            {isAdmin && wxMpAccountList.length > 0 && (
                              <div className="px-1 py-1">
                                <div className="px-4 py-2 text-xs text-gray-500 font-medium bg-gray-50">
                                  公众号账号
                                </div>
                                {wxMpAccountList.map((mpAccount) => (
                                  <Menu.Item key={mpAccount.gh_user_id}>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ||
                                          selectedMpAccount?.gh_user_id === mpAccount.gh_user_id
                                            ? "bg-green-100 text-green-600"
                                            : "text-gray-900 hover:bg-gray-50"
                                        } group flex items-center justify-between w-full px-4 py-3 text-sm transition-colors`}
                                        onClick={() => handleMpAccountClick(mpAccount)}
                                      >
                                        <span className="font-medium">{mpAccount.name}</span>
                                        <span
                                          className={`w-5 h-5 rounded-full ${
                                            selectedMpAccount?.gh_user_id === mpAccount.gh_user_id
                                              ? "bg-green-600 text-white"
                                              : "bg-gray-200 text-gray-700"
                                          } flex items-center justify-center text-xs font-bold`}
                                        >
                                          MP
                                        </span>
                                      </button>
                                    )}
                                  </Menu.Item>
                                ))}
                              </div>
                            )}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    )}
                </div>
              ) : (
                <>
                  {/* Desktop Tabbed Interface */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                      {/* WeChat Accounts Tab */}
                      {filteredWxAccountList.length > 0 && (
                        <button
                          onClick={() => {
                            if (filteredWxAccountList.length > 0) {
                              handleWxAccountClick(filteredWxAccountList[0]);
                            }
                          }}
                          className={`py-4 px-1 border-b-2 font-medium text-base whitespace-nowrap ${
                            viewMode === "wxPerson"
                              ? "text-[#D477E1] border-[#D477E1]"
                              : "border-transparent text-[#000] hover:text-[#f7c7fd] hover:border-[#f7c7fd]"
                          } transition-colors duration-200`}
                        >
                          微信账号
                          <span className="ml-2 bg-[#D477E1] text-white text-xs px-2 py-1 rounded-full">
                            {filteredWxAccountList.length}
                          </span>
                        </button>
                      )}

                      {/* MP Accounts Tab - visible to admins */}
                      {isAdmin && wxMpAccountList.length > 0 && (
                        <button
                          onClick={() => {
                            if (wxMpAccountList.length > 0) {
                              handleMpAccountClick(wxMpAccountList[0]);
                            }
                          }}
                          className={`py-4 px-1 border-b-2 font-medium text-base whitespace-nowrap ${
                            viewMode === "mp"
                              ? "text-green-600 border-green-600"
                              : "border-transparent text-[#000] hover:text-green-400 hover:border-green-400"
                          } transition-colors duration-200`}
                        >
                          公众号账号
                          <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            {wxMpAccountList.length}
                          </span>
                        </button>
                      )}
                    </nav>
                  </div>

                  {/* Tab Content - Compact Layout */}
                  <div className="px-6 py-3">
                    {viewMode === "wxPerson" && filteredWxAccountList.length > 0 && (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                          {filteredWxAccountList.map((account) => (
                            <button
                              key={account.wxid}
                              className={`group relative px-3 py-2 rounded-md border transition-all duration-200 ${
                                selectedAccount?.name === account.name
                                  ? "border-[#D477E1] bg-[#f7c7fd] shadow-sm"
                                  : "border-gray-200 bg-white hover:border-[#f7c7fd] hover:shadow-sm"
                              }`}
                              onClick={() => handleWxAccountClick(account)}
                            >
                              <div className="flex items-center justify-between min-w-0">
                                <span
                                  className={`text-sm font-medium truncate ${
                                    selectedAccount?.name === account.name
                                      ? "text-[#D477E1]"
                                      : "text-gray-900 group-hover:text-[#D477E1]"
                                  }`}
                                >
                                  {account.name}
                                </span>
                                <span
                                  className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                                    selectedAccount?.name === account.name
                                      ? "bg-[#D477E1] text-white"
                                      : "bg-gray-100 text-gray-600 group-hover:bg-[#D477E1] group-hover:text-white"
                                  }`}
                                >
                                  AI
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewMode === "mp" && isAdmin && wxMpAccountList.length > 0 && (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                          {wxMpAccountList.map((mpAccount) => (
                            <button
                              key={mpAccount.gh_user_id}
                              className={`group relative px-3 py-2 rounded-md border transition-all duration-200 ${
                                selectedMpAccount?.gh_user_id === mpAccount.gh_user_id
                                  ? "border-green-600 bg-green-50 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-green-400 hover:shadow-sm"
                              }`}
                              onClick={() => handleMpAccountClick(mpAccount)}
                            >
                              <div className="flex items-center justify-between min-w-0">
                                <span
                                  className={`text-sm font-medium truncate ${
                                    selectedMpAccount?.gh_user_id === mpAccount.gh_user_id
                                      ? "text-green-600"
                                      : "text-gray-900 group-hover:text-green-600"
                                  }`}
                                >
                                  {mpAccount.name}
                                </span>
                                <span
                                  className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                                    selectedMpAccount?.gh_user_id === mpAccount.gh_user_id
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 text-gray-600 group-hover:bg-green-600 group-hover:text-white"
                                  }`}
                                >
                                  MP
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className={`${isMobile ? "" : "flex space-x-3 m-3"} flex-1 min-h-0`}>
        {isMobile && mobileView === "memory" ? (
          // Mobile UpdateMemory View
          <div className="w-full h-[calc(100vh-180px)] flex flex-col mt-[-5vh]">
            <div className="p-2 bg-white mb-2 shadow-sm">
              <button
                onClick={() => setMobileView(previousView)}
                className="flex items-center text-blue-600 font-medium"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                返回对话
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <UpdateMemory
                selectedAccount={selectedAccount}
                selectedConversation={selectedConversation}
                avatarList={avatarList}
              />
            </div>
          </div>
        ) : viewMode === "wxPerson" ? (
          isMobile ? (
            mobileView === "list" ? (
              // Mobile view - conversation list
              <div className="w-full h-[calc(100vh-180px)] max-w-[100vw] overflow-x-hidden">
                <DialogList
                  dialogs={conversations}
                  onSelectDialog={(dialog, tokenUsage) => {
                    setSelectedConversation(dialog);
                    setCurrentTokenUsage(tokenUsage || 0);
                    if (isMobile) {
                      setMobileView("detail");
                    }
                  }}
                  isLoading={isLoadingConversations}
                  avatarList={avatarList}
                  humanList={humanList}
                  selectedDialog={selectedConversation}
                  userName={selectedAccount?.name || ""}
                  wxid={selectedAccount?.wxid || ""}
                  singleChatEnabled={singleChatEnabled}
                  groupChatEnabled={groupChatEnabled}
                  enabledRooms={enabledRooms}
                  disabledRooms={disabledRooms}
                  updateSingleChatSetting={updateSingleChatSetting}
                  updateGroupChatSetting={updateGroupChatSetting}
                  isLoadingSettings={loadingAISettings}
                />
              </div>
            ) : (
              // Mobile view - conversation detail
              <div className="w-full h-[calc(100vh-180px)] flex flex-col">
                <div className="p-2 bg-white mb-2 shadow-sm flex justify-between items-center mt-[-5vh]">
                  <button
                    onClick={() => setMobileView("list")}
                    className="flex items-center text-purple-600 font-medium"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    返回
                  </button>
                  <button
                    onClick={() => {
                      setPreviousView("detail");
                      setMobileView("memory");
                    }}
                    className="flex items-center text-purple-600 font-medium"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    查看记忆
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <UpdateDialogPage
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
              </div>
            )
          ) : (
            // Desktop view - show all components
            <>
              <div className="w-[13vw] flex-shrink-0 h-full min-h-0 overflow-hidden">
                <div className="h-full w-full overflow-x-hidden">
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
                    userName={selectedAccount?.name || ""}
                    wxid={selectedAccount?.wxid || ""}
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

              <div className="bg-white h-full min-h-0 w-[55vw] overflow-y-auto rounded-md">
                <UpdateDialogPage
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
          )
        ) : // MP account view
        isMobile ? (
          mobileView === "list" ? (
            // Mobile MP view - conversation list
            <div className="w-full h-[calc(100vh-180px)] max-w-[100vw] overflow-x-hidden">
              <WxMpDialogList
                dialogs={mpConversations}
                onSelectDialog={(conversation) => {
                  setSelectedMpConversation(conversation);
                  if (isMobile) {
                    setMobileView("detail");
                  }
                }}
                isLoading={isLoadingMpConversations}
                selectedDialog={selectedMpConversation}
                mpAccountName={selectedMpAccount?.name || ""}
                mpAccountId={selectedMpAccount?.gh_user_id || ""}
              />
            </div>
          ) : (
            // Mobile MP view - conversation detail
            <div className="w-full h-[calc(100vh-180px)] flex flex-col ">
              <div className="p-2 bg-white mb-2 shadow-sm flex justify-between items-center mt-[-5vh]">
                <button
                  onClick={() => setMobileView("list")}
                  className="flex items-center text-green-600 font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  返回
                </button>
                <button
                  onClick={() => {
                    setPreviousView("detail");
                    setMobileView("memory");
                  }}
                  className="flex items-center text-green-600 font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  查看记忆
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <WxMpDialogPage
                  conversation={selectedMpConversation}
                  mpAccountId={selectedMpAccount?.gh_user_id || ""}
                  mpAccountName={selectedMpAccount?.name || ""}
                />
              </div>
            </div>
          )
        ) : (
          // Desktop MP view - show all components
          <>
            <div className="w-[13vw] flex-shrink-0 h-full min-h-0 overflow-hidden">
              <div className="h-full w-full overflow-x-hidden">
                <WxMpDialogList
                  dialogs={mpConversations}
                  onSelectDialog={(conversation) => {
                    setSelectedMpConversation(conversation);
                    if (isMobile) {
                      setMobileView("detail");
                    }
                  }}
                  isLoading={isLoadingMpConversations}
                  selectedDialog={selectedMpConversation}
                  mpAccountName={selectedMpAccount?.name || ""}
                  mpAccountId={selectedMpAccount?.gh_user_id || ""}
                />
              </div>
            </div>

            <div className="bg-white h-full min-h-0 w-[55vw] overflow-y-auto">
              <WxMpDialogPage
                conversation={selectedMpConversation}
                mpAccountId={selectedMpAccount?.gh_user_id || ""}
                mpAccountName={selectedMpAccount?.name || ""}
              />
            </div>
          </>
        )}

        {!isMobile && (
          <div className="flex-1 h-full min-h-0">
            <UpdateMemory
              selectedAccount={selectedAccount}
              selectedConversation={selectedConversation}
              avatarList={avatarList}
            />
          </div>
        )}
      </div>
    </div>
  );
};

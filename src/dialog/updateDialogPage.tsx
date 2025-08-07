import React, { useState, useRef, useEffect, use } from "react";
import clsx from "clsx";

import { RoomListMessage, getChatMessagesApi, ChatMessage, getTokenUsageApi } from "../api/mysql";
import {
  WxAccount,
  sendChatMessageApi,
  getAIReplyListApi,
  postAIReplyListApi,
  updateWxHumanListApi,
  getDisableAIReplyListApi,
  postDisableAIReplyListApi,
  AIGetWxMessageApi,
  AISetWxMessageApi,
  getWxAutoHistoryListApi,
  updateWxAutoHistoryListApi,
} from "../api/airflow";
import { MessageContent } from "../components/MessageContent";
import { getMessageContent } from "../utils/messageTypes";
import { error } from "console";
import { get } from "http";
import { id, is } from "date-fns/locale";
import { set } from "date-fns";
import { message } from "antd";

interface AvatarData {
  wxid: string;
  smallHeadImgUrl: string;
  bigHeadImgUrl: string;
  update_time: string;
}

interface DialogPageProps {
  conversation: RoomListMessage | null;
  selectedAccount: WxAccount | null;
  avatarList?: AvatarData[];
  refreshHumanList?: () => void;
  humanList?: string[];
  // AI settings props
  singleChatEnabled?: boolean;
  groupChatEnabled?: boolean;
  enabledRooms?: string[];
  disabledRooms?: string[];
  onEnabledRoomsChange?: (rooms: string[]) => void;
  onDisabledRoomsChange?: (rooms: string[]) => void;
  // Token usage props
  initialTokenUsage?: number;
}

interface Message {
  id: string;
  content: string;
  timestamp: number;
  isUser: boolean;
  senderName: string;
  msgType?: number;
  senderId?: string;
  is_self?: number;
}

interface DirectImageMessageContentProps {
  content: string;
  msgType: number;
  conversation: RoomListMessage | null;
  isUser: boolean;
}

const DirectImageMessageContent: React.FC<DirectImageMessageContentProps> = ({
  content,
  msgType,
  conversation,
  isUser,
}) => {
  // 添加预览状态
  const [showPreview, setShowPreview] = React.useState(false);

  // 检查是否是图片类型的消息（msgType为3或是路径形式）
  const isTmpImagePath = content.includes("/tmp/image_downloads/");
  const isDirectCosPath = content.includes("/") && !content.includes("/tmp/image_downloads/");
  const isImagePath = isTmpImagePath || isDirectCosPath || msgType === 3;

  // 打开预览
  const openPreview = () => {
    setShowPreview(true);
  };

  // 关闭预览
  const closePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(false);
  };

  // 获取COS图片的URL
  const getImageUrl = (isUser: boolean): string => {
    if (!conversation) return "";

    try {
      const userBucket = "wx-records-1347723456";
      const aiBucket = "wx-resources-1347723456";
      const region = "ap-guangzhou";

      if (isTmpImagePath) {
        const fileName = content.split("/tmp/image_downloads/")[1];
        if (!fileName) return "";
        const wxId = conversation.wx_user_id || "";
        const wxUserName = conversation.wx_user_name || "";
        const roomId = conversation.room_id || "";
        const completeFileName = fileName.includes(".") ? fileName : `${fileName}.jpg`;
        const cosKey = `${wxUserName}_${wxId}/${roomId}/${completeFileName}`;
        const url = `https://${
          isUser ? userBucket : aiBucket
        }.cos.${region}.myqcloud.com/${encodeURIComponent(cosKey)}`;
        return url;
      } else if (isDirectCosPath) {
        const url = `https://${
          isUser ? userBucket : aiBucket
        }.cos.${region}.myqcloud.com/${encodeURIComponent(content)}`;
        return url;
      }

      return "";
    } catch (error) {
      console.error("构建图片URL时出错:", error);
      return "";
    }
  };

  // 如果是图片路径，直接展示图片
  if (isImagePath) {
    const imageUrl = getImageUrl(isUser);
    if (imageUrl) {
      return (
        <div className="image-container relative">
          <img
            src={imageUrl}
            alt="图片消息"
            className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: "200px" }}
            onClick={openPreview}
          />

          {/* 全屏预览模式 */}
          {showPreview && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
              onClick={closePreview}
            >
              <div className="relative max-w-4xl max-h-full">
                <img
                  src={imageUrl}
                  alt="原始图片"
                  className="max-w-full max-h-[90vh] object-contain"
                />
                <button
                  className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-900 hover:bg-gray-200"
                  onClick={closePreview}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return <MessageContent content={content} msgType={msgType} />;
    }
  }

  // 如果是其他类型消息，使用原始的MessageContent组件
  return <MessageContent content={content} msgType={msgType} />;
};

export const UpdateDialogPage: React.FC<DialogPageProps> = ({
  conversation,
  selectedAccount,
  avatarList = [],
  refreshHumanList,
  humanList = [],
  // AI settings from parent
  singleChatEnabled = false,
  groupChatEnabled = false,
  enabledRooms = [],
  disabledRooms = [],
  onEnabledRoomsChange,
  onDisabledRoomsChange,
  initialTokenUsage = 0,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<number>(initialTokenUsage);
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [isAISummaryEnabled, setIsAISummaryEnabled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [summaryTokenUsage, setSummaryTokenUsage] = useState<number>(0);
  const [isLoadingSummaryToken, setIsLoadingSummaryToken] = useState<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  // Remove the internal refs and state for AI settings
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const scrollToBottom = () => {
    const messageContainer = messageContainerRef.current;
    if (!messageContainer) return;
    messageContainer.scrollTop = messageContainer.scrollHeight;
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  // Function to refresh token usage
  const refreshTokenUsage = async () => {
    if (!conversation) return;

    setIsLoadingToken(true);
    try {
      const result = await getTokenUsageApi({
        token_source_platform: "wx_chat",
        wx_user_id: conversation.wx_user_id,
        room_id: conversation.room_id,
      });

      if (result.code === 0 && result.sum) {
        setTokenUsage(result.sum.sum_token);
        showNotification("Token用量已更新", "success");
      } else {
        showNotification(`获取Token用量失败: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("获取Token用量失败:", error);
      showNotification("获取Token用量失败", "error");
    } finally {
      setIsLoadingToken(false);
    }
  };

  // Function to refresh AI summary token usage
  const refreshSummaryTokenUsage = async () => {
    if (!selectedAccount) return;

    setIsLoadingSummaryToken(true);
    try {
      const result = await getTokenUsageApi({
        token_source_platform: "wx_history_summary",
        wx_user_id: selectedAccount.wxid.toLowerCase(),
      });

      if (result.code === 0 && result.sum) {
        setSummaryTokenUsage(result.sum.sum_token);
        showNotification("AI总结Token用量已更新", "success");
      } else {
        showNotification(`获取AI总结Token用量失败: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("获取AI总结Token用量失败:", error);
      showNotification("获取AI总结Token用量失败", "error");
    } finally {
      setIsLoadingSummaryToken(false);
    }
  };

  useEffect(() => {
    if (conversation) {
      // Determine if AI should be enabled for this conversation using parent props
      updateAIEnabledState(conversation);
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom();
  }, [messages]);

  // 监听 initialTokenUsage 的变化并更新 tokenUsage 状态
  useEffect(() => {
    console.log(`检测到 initialTokenUsage 变化: ${initialTokenUsage}`);
    // 直接设置 tokenUsage 为 initialTokenUsage
    setTokenUsage(initialTokenUsage);
  }, [initialTokenUsage]);

  // Function to determine if AI should be enabled for this conversation
  const updateAIEnabledState = (conv: RoomListMessage) => {
    const isGroup = conv.is_group;
    const roomId = conv.room_id;

    if (isGroup) {
      // For group chats
      if (groupChatEnabled) {
        // If group chat globally ON, check if this room is in disabled list
        setIsAIEnabled(!disabledRooms.includes(roomId));
      } else {
        // If group chat globally OFF, check if this room is in enabled list
        setIsAIEnabled(enabledRooms.includes(roomId));
      }
    } else {
      // For private chats
      if (singleChatEnabled) {
        // If single chat globally ON, check if this room is in disabled list
        setIsAIEnabled(!disabledRooms.includes(roomId));
      } else {
        // If single chat globally OFF, check if this room is in enabled list
        setIsAIEnabled(enabledRooms.includes(roomId));
      }
    }
  };

  const loadMessages = async () => {
    if (!conversation) return;
    setIsFetchingHistory(true);
    try {
      // If we have metadata from DialogList, update the AI state
      if ("_meta" in conversation) {
        updateAIEnabledState(conversation);
      }

      // Fetch chat messages
      const response = await getChatMessagesApi({
        wx_user_id: selectedAccount?.wxid || "",
        room_id: conversation?.room_id || "",
      });

      // 处理消息列表
      const transformedMessages = response.data.records.reverse().map((msg) => ({
        id: msg.msg_id,
        content: msg.content || "",
        timestamp: new Date(msg.msg_datetime).getTime(),
        isUser: msg.sender_id === selectedAccount?.wxid,
        senderName: msg.sender_name || msg.sender_id,
        msgType: msg.msg_type,
        senderId: msg.sender_id,
        is_self: msg.is_self,
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  };
  const getMessage = (): Promise<boolean> => {
    if (!newMessage.trim() || !conversation || !selectedAccount) {
      return Promise.resolve(false); // 返回一个已解决的 Promise
    }

    const wxAIName = selectedAccount.name;

    // 返回 Promise 链
    return AIGetWxMessageApi(`REPLY_INFO`)
      .then((response) => {
        const { value } = response;
        const replyList = JSON.parse(value)[wxAIName]?.reply_list || [];
        return replyList.length > 0;
      })
      .catch((error) => {
        return false; // 错误时返回默认值
      });
  };
  const warning = () => {
    messageApi.open({
      type: "warning",
      content: "网络超时",
    });
  };
  const isEmptyMessage = async (): Promise<boolean> => {
    const maxAttempts = 20; // 最大尝试次数
    const pollInterval = 3000; // 轮询间隔3秒
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`第 ${attempts}/${maxAttempts} 次检查`);

      const hasMessage = await getMessage();
      if (!hasMessage) {
        console.log("检测到无新消息");
        console.log("刷新页面");
        loadMessages();
        return true; // 消息为空
      }

      // 等待指定时间后继续轮询
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
    warning();

    return false; // 达到最大尝试次数仍检测到消息
  };
  const handleSendMessage2 = () => {
    if (!newMessage.trim() || !conversation || !selectedAccount) return;
    setNewMessage("");
    setIsLoading(true);
    const wxAIName = selectedAccount.name;
    const conTactName = conversation.room_id;
    AIGetWxMessageApi(`REPLY_INFO`)
      .then((response) => {
        const { value } = response;
        //get成功了，把信息发送过去
        const parseValue = JSON.parse(value);
        const newValue = {
          [wxAIName]: { reply_list: [{ contact_name: conTactName, msg: newMessage }] }, // 覆盖其他数据
        };

        const newData = {
          description: "更新最新信息",
          key: "REPLY_INFO",
          value: JSON.stringify(newValue),
        };
        AISetWxMessageApi(`REPLY_INFO`, newData)
          .then((response) => {
            isEmptyMessage();
          })
          .catch((error) => {})
          .finally(() => {
            setIsLoading(false);
          });
      })
      .catch((error) => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage2();
    }
  };

  // Function to load AI summary state from wx_auto_history_list
  const loadAISummaryState = async () => {
    if (!selectedAccount || !selectedAccount.wxid) return;

    try {
      const response = await getWxAutoHistoryListApi();
      let historyList = [];

      try {
        historyList = JSON.parse(response.value || "[]");
      } catch (e) {
        console.error("解析wx_auto_history_list失败:", e);
        historyList = [];
      }

      // Check if current wx_user_id exists in the list
      // Convert wxid to lowercase for consistent handling
      const wxUserId = selectedAccount.wxid.toLowerCase();
      const existingIndex = historyList.findIndex(
        (item: any) => item.wx_user_id && item.wx_user_id.toLowerCase() === wxUserId
      );

      // Set state based on found item
      if (existingIndex >= 0) {
        setIsAISummaryEnabled(historyList[existingIndex].auto === "true");
      } else {
        setIsAISummaryEnabled(false);
      }
    } catch (error) {
      console.error("加载AI总结状态失败:", error);
      setIsAISummaryEnabled(false);
    }
  };

  useEffect(() => {
    if (conversation) {
      // Determine if AI should be enabled for this conversation using parent props
      updateAIEnabledState(conversation);
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  // Load AI summary state when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      loadAISummaryState();
    }
  }, [selectedAccount]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">请选择一个聊天</div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="bg-white shadow-lg h-full flex flex-col relative overflow-hidden">
        {/* Notification */}
        {notification.show && (
          <div
            className={`absolute top-3 right-20 border-l-4 p-3 rounded shadow-md z-10 max-w-xs transition-all duration-300 ease-in-out opacity-100 ${
              notification.type === "success"
                ? "bg-green-100 border-green-500 text-green-700"
                : "bg-red-100 border-red-500 text-red-700"
            }`}
          >
            <div className="flex items-center">
              {notification.type === "success" ? (
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <p className="text-base">{notification.message}</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
              {(conversation.room_name || conversation.sender_name || "Chat")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {conversation.room_name || conversation.sender_name || "Chat"}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Token用量: {tokenUsage}</span>
                <button
                  onClick={refreshTokenUsage}
                  disabled={isLoadingToken}
                  style={{
                    border: "1px solid #D477E1",
                    borderRadius: "2px",
                    color: "#D477E1",
                    padding: "0px 8px",
                    transition: "transform 0.1s ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    document.body.style.cursor = "pointer";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    document.body.style.cursor = "default";
                  }}
                >
                  {isLoadingToken ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    "刷新"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {humanList.includes(conversation.room_id) && (
              <button
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                onClick={async () => {
                  if (!selectedAccount) return;

                  try {
                    const updatedHumanList = humanList.filter((id) => id !== conversation.room_id);
                    await updateWxHumanListApi(
                      selectedAccount.wxid,
                      selectedAccount.name,
                      updatedHumanList
                    );
                    showNotification("已解除人工处理", "success");
                    refreshHumanList?.();
                  } catch (error) {
                    console.error("解除人工处理失败:", error);
                    showNotification("解除人工处理失败", "error");
                  }
                }}
              >
                解除人工
              </button>
            )}
            <span className="text-sm text-gray-600">AI</span>
            <button
              onClick={async () => {
                const newAIEnabled = !isAIEnabled;
                setIsAIEnabled(newAIEnabled);

                try {
                  const isGroup = conversation.is_group;
                  const roomId = conversation.room_id;
                  const globalEnabled = isGroup ? groupChatEnabled : singleChatEnabled;

                  // Get current lists from props
                  const updatedEnabledRooms = [...enabledRooms];
                  const updatedDisabledRooms = [...disabledRooms];

                  // 确保 room_id 不会同时存在于两个列表中
                  // 检查是否已存在于另一个列表
                  const enabledIndex = updatedEnabledRooms.indexOf(roomId);
                  const disabledIndex = updatedDisabledRooms.indexOf(roomId);

                  if (globalEnabled) {
                    // Global setting is ON
                    if (newAIEnabled) {
                      // Turning AI ON for this room - remove from disable list
                      if (disabledIndex > -1) {
                        updatedDisabledRooms.splice(disabledIndex, 1);
                      }

                      // 确保不在enable列表中 (虽然这种情况不应该发生)
                      if (enabledIndex > -1) {
                        showNotification("此房间已在AI启用列表中", "error");
                      }
                    } else {
                      // Turning AI OFF for this room - add to disable list if not present
                      if (disabledIndex === -1) {
                        updatedDisabledRooms.push(roomId);
                      }

                      // 检查是否在enable列表中 (不应该在这里出现)
                      if (enabledIndex > -1) {
                        showNotification("警告：房间ID同时存在于启用和禁用列表", "error");
                      }
                    }

                    // Update parent's disabled rooms
                    if (onDisabledRoomsChange) {
                      onDisabledRoomsChange(updatedDisabledRooms);
                    }

                    // Post to API
                    await postDisableAIReplyListApi(
                      selectedAccount?.name || "",
                      selectedAccount?.wxid || "",
                      updatedDisabledRooms
                    );
                  } else {
                    // Global setting is OFF
                    if (newAIEnabled) {
                      // Turning AI ON for this room - add to enable list if not present
                      if (enabledIndex === -1) {
                        updatedEnabledRooms.push(roomId);
                      } else {
                        showNotification("此房间已在AI启用列表中", "error");
                      }

                      // Also remove from disable list if present (to maintain consistency)
                      if (disabledIndex > -1) {
                        updatedDisabledRooms.splice(disabledIndex, 1);

                        // Update parent's disabled rooms
                        if (onDisabledRoomsChange) {
                          onDisabledRoomsChange(updatedDisabledRooms);
                        }

                        await postDisableAIReplyListApi(
                          selectedAccount?.name || "",
                          selectedAccount?.wxid || "",
                          updatedDisabledRooms
                        );
                      }
                    } else {
                      // Turning AI OFF for this room - remove from enable list if present
                      if (enabledIndex > -1) {
                        updatedEnabledRooms.splice(enabledIndex, 1);
                      }

                      // 检查是否在disable列表中 (不应该在这里出现)
                      if (disabledIndex > -1) {
                        showNotification("警告：房间ID同时存在于启用和禁用列表", "error");
                      }
                    }

                    // Update parent's enabled rooms
                    if (onEnabledRoomsChange) {
                      onEnabledRoomsChange(updatedEnabledRooms);
                    }

                    // Post to API
                    await postAIReplyListApi(
                      selectedAccount?.name || "",
                      selectedAccount?.wxid || "",
                      updatedEnabledRooms
                    );
                  }
                } catch (error) {
                  console.error("Error updating AI rooms lists:", error);
                  setIsAIEnabled(!newAIEnabled);
                }
              }}
              className={clsx(
                "w-12 h-6 rounded-full transition-colors duration-200 ease-in-out relative",
                isAIEnabled ? "bg-purple-500" : "bg-gray-200"
              )}
            >
              <span
                className={clsx(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out",
                  isAIEnabled ? "right-1" : "left-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messageContainerRef}>
          {isFetchingHistory ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-gray-500">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
              <p>加载中...</p>
            </div>
          ) : messages.length === 0 ? (
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
              <p>还没有消息。开始聊天吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages
                .filter((message) => message.content.trim() !== "")
                .map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      "flex items-start space-x-2",
                      message.isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    {avatarList.find((avatar) => avatar.wxid === message.senderId) ? (
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                        title={message.senderName}
                      >
                        <img
                          src={
                            avatarList.find((avatar) => avatar.wxid === message.senderId)
                              ?.smallHeadImgUrl
                          }
                          alt={message.senderName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add(
                                "flex",
                                "items-center",
                                "justify-center",
                                "text-sm",
                                "font-medium",
                                "text-white",
                                message.isUser ? "bg-purple-500" : "bg-gray-400"
                              );
                              parent.textContent = message.senderName.charAt(0).toUpperCase();
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white",
                          message.isUser ? "bg-purple-500" : "bg-gray-400"
                        )}
                        title={message.senderName}
                      >
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Message Content */}
                    <div
                      className={clsx(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        message.isUser
                          ? "bg-[#FDF3FC] text-black"
                          : "text-gray-900 shadow-sm border border-[#D477E1]"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.msgType === 3 || message.msgType === 34 ? (
                          <DirectImageMessageContent
                            content={message.content}
                            msgType={message.msgType}
                            conversation={conversation}
                            isUser={message.is_self === 0 ? true : false}
                          />
                        ) : (
                          getMessageContent(message.msgType || 0, message.content)
                        )}
                      </div>
                      <div
                        className={clsx(
                          "text-xs mt-1",
                          message.isUser ? "text-[#333] text-right" : "text-[#333]"
                        )}
                      >
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              {(isLoading || isSending) && (
                <div className="flex justify-end">
                  <div className="flex items-center space-x-2 text-gray-500 bg-gray-100 rounded-lg px-4 py-2">
                    <span className="text-sm">发送中</span>
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t flex items-center space-x-4 sticky bottom-0">
          <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="说点什么吧..."
              className="w-full px-4 py-2 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,1)] text-sm"
              disabled={isLoading || isFetchingHistory}
            />
          </div>
          <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </button>
          <button
            onClick={handleSendMessage2}
            className={clsx(
              "w-10 h-10 flex items-center justify-center rounded-full focus:outline-none transition-colors flex-shrink-0",
              isLoading || isFetchingHistory
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[rgba(108,93,211,1)] hover:bg-[rgba(98,83,201,1)]"
            )}
            disabled={isLoading || isFetchingHistory}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

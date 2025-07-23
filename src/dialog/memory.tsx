import React, { useState, useEffect } from "react";
import { generateWxChatHistorySummaryApi,getDagRunDetail } from "../api/airflow";
import { getWxChatHistorySummaryApi, ChatHistorySummaryResponse } from "../api/mysql";
import ChatMemory from "./memory/chatMemory";
import FriendCircleAnalysis from "./memory/friendCircleAnalysis";
import UserProfile from "./memory/userProfile";
import LongtimeMemory from "./memory/longtimeMemory";

interface ApiCustomerInfo {
  name: string | null;
  contact: string | null;
  gender: string | null;
  age_group: string | null;
  city_tier: string | null;
  specific_location: string | null;
  occupation_type: string | null;
  marital_status: string | null;
  family_structure: string | null;
  income_level_estimated: string | null;
}

interface UserProfileTag {
  text: string;
  category?: string;
}

interface ChatKeyEvent {
  time: string;
  event: string;
  detail: string;
}

interface MemoryProps {
  selectedAccount?: { wxid: string; name: string } | null;
  selectedConversation?: { room_id: string; room_name: string } | null;
}

const Memory: React.FC<MemoryProps> = ({ selectedAccount, selectedConversation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [ChatHistorySummary, SetChatHistorySummary] = useState<ChatHistorySummaryResponse| null>(null);
  const [currentDagRunId, setCurrentDagRunId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<ApiCustomerInfo>({
    name: null,
    contact: null,
    gender: null,
    age_group: null,
    city_tier: null,
    specific_location: null,
    occupation_type: null,
    marital_status: null,
    family_structure: null,
    income_level_estimated: null,
  });
  const [chatKeyEvents, setChatKeyEvents] = useState<ChatKeyEvent[]>([]);
  const [userProfileTags, setUserProfileTags] = useState<UserProfileTag[]>([]);

  // 当 selectedAccount 和 selectedConversation 变化时，先清空聊天记忆，然后获取新的摘要
  useEffect(() => {
    // 先清空当前的数据
    setCustomerInfo({
      name: null,
      contact: null,
      gender: null,
      age_group: null,
      city_tier: null,
      specific_location: null,
      occupation_type: null,
      marital_status: null,
      family_structure: null,
      income_level_estimated: null,
    });
    setChatKeyEvents([]);
    setUserProfileTags([]);

    // 获取真实数据
    fetchInitialSummary();
  }, [selectedAccount, selectedConversation]);

  const fetchInitialSummary = async () => {
    if (
      selectedAccount &&
      selectedConversation &&
      selectedAccount.wxid &&
      selectedConversation.room_id
    ) {
      try {
        const summaryResponse = await getWxChatHistorySummaryApi(
          selectedAccount.wxid,
          selectedConversation.room_id
        );
        console.log("初始聊天摘要内容:", summaryResponse);

        if (summaryResponse.code === 0 && summaryResponse.data) {
          // 处理基础信息
          if (summaryResponse.data.tags?.基础信息) {
            setCustomerInfo({
              name: summaryResponse.data.tags.基础信息.name || null,
              contact: summaryResponse.data.tags.基础信息.contact || null,
              gender: summaryResponse.data.tags.基础信息.gender || null,
              age_group: summaryResponse.data.tags.基础信息.age_group || null,
              city_tier: summaryResponse.data.tags.基础信息.city_tier || null,
              specific_location: summaryResponse.data.tags.基础信息.specific_location || null,
              occupation_type: summaryResponse.data.tags.基础信息.occupation_type || null,
              marital_status: summaryResponse.data.tags.基础信息.marital_status || null,
              family_structure: summaryResponse.data.tags.基础信息.family_structure || null,
              income_level_estimated:
                summaryResponse.data.tags.基础信息.income_level_estimated || null,
            });
          }

          // 处理对话关键事件
          if (summaryResponse.data.chat_key_event) {
            setChatKeyEvents(summaryResponse.data.chat_key_event);
          }

          // 处理用户标签
          const tags: UserProfileTag[] = [];

          // 处理价值观与兴趣
          if (summaryResponse.data.tags?.价值观与兴趣) {
            const valueInterests = summaryResponse.data.tags.价值观与兴趣;
            Object.entries(valueInterests).forEach(([key, value]) => {
              if (value && value !== null) {
                if (Array.isArray(value)) {
                  value.forEach((item) => {
                    if (item) tags.push({ text: `${item}`, category: "价值观与兴趣" });
                  });
                } else if (typeof value === "string" && value.trim() !== "") {
                  tags.push({ text: `${key}: ${value}`, category: "价值观与兴趣" });
                }
              }
            });
          }

          // 处理互动与认知
          if (summaryResponse.data.tags?.互动与认知) {
            const interactions = summaryResponse.data.tags.互动与认知;
            Object.entries(interactions).forEach(([key, value]) => {
              if (value && typeof value === "string" && value.trim() !== "") {
                if (key === "current_trust_level") {
                  tags.push({ text: `${key}: 信任水平${value}`, category: "互动与认知" });
                } else {
                  tags.push({ text: `${key}: ${value}`, category: "互动与认知" });
                }
              }
            });
          }

          // 处理购买决策
          if (summaryResponse.data.tags?.购买决策) {
            const decisions = summaryResponse.data.tags.购买决策;
            Object.entries(decisions).forEach(([key, value]) => {
              if (value) {
                if (Array.isArray(value)) {
                  value.forEach((item) => {
                    if (item) tags.push({ text: `${item}`, category: "购买决策" });
                  });
                } else if (typeof value === "string" && value.trim() !== "") {
                  tags.push({ text: `${key}: ${value}`, category: "购买决策" });
                }
              }
            });
          }

          // 处理客户关系
          if (summaryResponse.data.tags?.客户关系) {
            const relations = summaryResponse.data.tags.客户关系;
            Object.entries(relations).forEach(([key, value]) => {
              if (value) {
                if (Array.isArray(value)) {
                  value.forEach((item) => {
                    if (item) tags.push({ text: `${item}`, category: "客户关系" });
                  });
                } else if (typeof value === "string" && value.trim() !== "") {
                  if (key === "engagement_level") {
                    tags.push({ text: `${key}: 活跃度${value}`, category: "客户关系" });
                  } else {
                    tags.push({ text: `${key}: ${value}`, category: "客户关系" });
                  }
                }
              }
            });
          }

          // 处理特殊来源
          if (summaryResponse.data.tags?.特殊来源) {
            const sources = summaryResponse.data.tags.特殊来源;
            Object.entries(sources).forEach(([key, value]) => {
              if (value) {
                if (Array.isArray(value)) {
                  value.forEach((item) => {
                    if (item) tags.push({ text: `${item}`, category: "特殊来源" });
                  });
                } else if (typeof value === "string" && value.trim() !== "") {
                  tags.push({ text: `${key}: ${value}`, category: "特殊来源" });
                }
              }
            });
          }

          setUserProfileTags(tags);
        }
      } catch (error) {
        console.error("获取初始聊天摘要时出错:", error);
      }
    }
  };


  const checkDagRunStatus = async (wxid: string, room_id: string,dagRunId: string) => {
  try {
    const response = await getDagRunDetail('wx_history_summary', dagRunId);
    console.log('DAG运行状态:', response);

    // 根据DAG状态更新refreshing
    if (response && response.state) {
      // 如果DAG状态为'running'或'queued'，则继续刷新状态
      if (['running', 'queued'].includes(response.state)) {
        setRefreshing(true);

        // 继续轮询检查状态
        setTimeout(() => {
          checkDagRunStatus(wxid,room_id,dagRunId);
        }, 2000);
      } else {
        // DAG已完成或失败
        setRefreshing(false);
        const ChatHistorySummary= await getWxChatHistorySummaryApi(
            wxid,
            room_id
          ); // 获取最新设备列表
        SetChatHistorySummary(ChatHistorySummary)
        console.log("SetChatHistorySummary数据",ChatHistorySummary)
        if (ChatHistorySummary?.code === 0 && ChatHistorySummary.data) {
              // 处理基础信息
              if (ChatHistorySummary.data.tags?.基础信息) {
                setCustomerInfo({
                  name: ChatHistorySummary.data.tags.基础信息.name || null,
                  contact: ChatHistorySummary.data.tags.基础信息.contact || null,
                  gender: ChatHistorySummary.data.tags.基础信息.gender || null,
                  age_group: ChatHistorySummary.data.tags.基础信息.age_group || null,
                  city_tier: ChatHistorySummary.data.tags.基础信息.city_tier || null,
                  specific_location: ChatHistorySummary.data.tags.基础信息.specific_location || null,
                  occupation_type: ChatHistorySummary.data.tags.基础信息.occupation_type || null,
                  marital_status: ChatHistorySummary.data.tags.基础信息.marital_status || null,
                  family_structure: ChatHistorySummary.data.tags.基础信息.family_structure || null,
                  income_level_estimated:
                    ChatHistorySummary.data.tags.基础信息.income_level_estimated || null,
                });
              }

              // 处理对话关键事件
              if (ChatHistorySummary.data.chat_key_event) {
                setChatKeyEvents(ChatHistorySummary.data.chat_key_event);
              }

              // 处理用户标签
              const tags: UserProfileTag[] = [];

              // 处理价值观与兴趣
              if (ChatHistorySummary.data.tags?.价值观与兴趣) {
                const valueInterests = ChatHistorySummary.data.tags.价值观与兴趣;
                Object.entries(valueInterests).forEach(([key, value]) => {
                  if (value && value !== null) {
                    if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (item) tags.push({ text: `${item}`, category: "价值观与兴趣" });
                      });
                    } else if (typeof value === "string" && value.trim() !== "") {
                      tags.push({ text: `${key}: ${value}`, category: "价值观与兴趣" });
                    }
                  }
                });
              }

              // 处理互动与认知
              if (ChatHistorySummary.data.tags?.互动与认知) {
                const interactions = ChatHistorySummary.data.tags.互动与认知;
                Object.entries(interactions).forEach(([key, value]) => {
                  if (value && typeof value === "string" && value.trim() !== "") {
                    tags.push({ text: `${key}: ${value}`, category: "互动与认知" });
                  }
                });
              }

              // 处理购买决策
              if (ChatHistorySummary.data.tags?.购买决策) {
                const decisions = ChatHistorySummary.data.tags.购买决策;
                Object.entries(decisions).forEach(([key, value]) => {
                  if (value) {
                    if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (item) tags.push({ text: `${item}`, category: "购买决策" });
                      });
                    } else if (typeof value === "string" && value.trim() !== "") {
                      tags.push({ text: `${key}: ${value}`, category: "购买决策" });
                    }
                  }
                });
              }

              // 处理客户关系
              if (ChatHistorySummary.data.tags?.客户关系) {
                const relations = ChatHistorySummary.data.tags.客户关系;
                Object.entries(relations).forEach(([key, value]) => {
                  if (value) {
                    if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (item) tags.push({ text: `${item}`, category: "客户关系" });
                      });
                    } else if (typeof value === "string" && value.trim() !== "") {
                      tags.push({ text: `${key}: ${value}`, category: "客户关系" });
                    }
                  }
                });
              }

              // 处理特殊来源
              if (ChatHistorySummary.data.tags?.特殊来源) {
                const sources = ChatHistorySummary.data.tags.特殊来源;
                Object.entries(sources).forEach(([key, value]) => {
                  if (value) {
                    if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (item) tags.push({ text: `${item}`, category: "特殊来源" });
                      });
                    } else if (typeof value === "string" && value.trim() !== "") {
                      tags.push({ text: `${key}: ${value}`, category: "特殊来源" });
                    }
                  }
                });
              }

              setUserProfileTags(tags);
            }
        setCurrentDagRunId(null);

        // 根据状态显示相应消息
        if (response.state === 'success') {
          console.log('设备列表已成功刷新', 'success');
        } else if (response.state === 'failed') {
          console.log('设备列表刷新失败', 'error');
        }
      }
    }
  } catch (error) {
    console.error('检查DAG状态失败:', error);
    setRefreshing(false);
    setCurrentDagRunId(null);
  }
};


  const fetchChatHistorySummary = async () => {
    if (
      selectedAccount &&
      selectedConversation &&
      selectedAccount.wxid &&
      selectedConversation.room_id
    ) {
      setIsLoading(true);
      const roomId = selectedConversation.room_id.replace(/@/g, "");
      setCustomerInfo({
        name: null,
        contact: null,
        gender: null,
        age_group: null,
        city_tier: null,
        specific_location: null,
        occupation_type: null,
        marital_status: null,
        family_structure: null,
        income_level_estimated: null,
      });
      setChatKeyEvents([]);
      setUserProfileTags([]);

      try {
        const currentDate = new Date().toISOString();
        const request = {
          conf: {
            wx_user_id: selectedAccount.wxid,
            contact_name: selectedConversation.room_id,
          },
          dag_run_id: `summary_${selectedAccount.wxid}_${Date.now()}`,
          data_interval_end: currentDate,
          data_interval_start: currentDate,
          logical_date: currentDate,
          note: `Chat history summary for ${selectedConversation.room_name || "Unknown Room"}`,
        };

        const response = await generateWxChatHistorySummaryApi(request);

        setTimeout(async () => {
          try {
            await checkDagRunStatus(
              selectedAccount.wxid,
              selectedConversation.room_id,
              request.dag_run_id
            );
            console.log("聊天摘要内容:", ChatHistorySummary);

            // if (ChatHistorySummary?.code === 0 && ChatHistorySummary.data) {
            //   // 处理基础信息
            //   if (ChatHistorySummary.data.tags?.基础信息) {
            //     setCustomerInfo({
            //       name: ChatHistorySummary.data.tags.基础信息.name || null,
            //       contact: ChatHistorySummary.data.tags.基础信息.contact || null,
            //       gender: ChatHistorySummary.data.tags.基础信息.gender || null,
            //       age_group: ChatHistorySummary.data.tags.基础信息.age_group || null,
            //       city_tier: ChatHistorySummary.data.tags.基础信息.city_tier || null,
            //       specific_location: ChatHistorySummary.data.tags.基础信息.specific_location || null,
            //       occupation_type: ChatHistorySummary.data.tags.基础信息.occupation_type || null,
            //       marital_status: ChatHistorySummary.data.tags.基础信息.marital_status || null,
            //       family_structure: ChatHistorySummary.data.tags.基础信息.family_structure || null,
            //       income_level_estimated:
            //         ChatHistorySummary.data.tags.基础信息.income_level_estimated || null,
            //     });
            //   }

            //   // 处理对话关键事件
            //   if (ChatHistorySummary.data.chat_key_event) {
            //     setChatKeyEvents(ChatHistorySummary.data.chat_key_event);
            //   }

            //   // 处理用户标签
            //   const tags: UserProfileTag[] = [];

            //   // 处理价值观与兴趣
            //   if (ChatHistorySummary.data.tags?.价值观与兴趣) {
            //     const valueInterests = ChatHistorySummary.data.tags.价值观与兴趣;
            //     Object.entries(valueInterests).forEach(([key, value]) => {
            //       if (value && value !== null) {
            //         if (Array.isArray(value)) {
            //           value.forEach((item) => {
            //             if (item) tags.push({ text: `${item}`, category: "价值观与兴趣" });
            //           });
            //         } else if (typeof value === "string" && value.trim() !== "") {
            //           tags.push({ text: `${key}: ${value}`, category: "价值观与兴趣" });
            //         }
            //       }
            //     });
            //   }

            //   // 处理互动与认知
            //   if (ChatHistorySummary.data.tags?.互动与认知) {
            //     const interactions = ChatHistorySummary.data.tags.互动与认知;
            //     Object.entries(interactions).forEach(([key, value]) => {
            //       if (value && typeof value === "string" && value.trim() !== "") {
            //         tags.push({ text: `${key}: ${value}`, category: "互动与认知" });
            //       }
            //     });
            //   }

            //   // 处理购买决策
            //   if (ChatHistorySummary.data.tags?.购买决策) {
            //     const decisions = ChatHistorySummary.data.tags.购买决策;
            //     Object.entries(decisions).forEach(([key, value]) => {
            //       if (value) {
            //         if (Array.isArray(value)) {
            //           value.forEach((item) => {
            //             if (item) tags.push({ text: `${item}`, category: "购买决策" });
            //           });
            //         } else if (typeof value === "string" && value.trim() !== "") {
            //           tags.push({ text: `${key}: ${value}`, category: "购买决策" });
            //         }
            //       }
            //     });
            //   }

            //   // 处理客户关系
            //   if (ChatHistorySummary.data.tags?.客户关系) {
            //     const relations = ChatHistorySummary.data.tags.客户关系;
            //     Object.entries(relations).forEach(([key, value]) => {
            //       if (value) {
            //         if (Array.isArray(value)) {
            //           value.forEach((item) => {
            //             if (item) tags.push({ text: `${item}`, category: "客户关系" });
            //           });
            //         } else if (typeof value === "string" && value.trim() !== "") {
            //           tags.push({ text: `${key}: ${value}`, category: "客户关系" });
            //         }
            //       }
            //     });
            //   }

            //   // 处理特殊来源
            //   if (ChatHistorySummary.data.tags?.特殊来源) {
            //     const sources = ChatHistorySummary.data.tags.特殊来源;
            //     Object.entries(sources).forEach(([key, value]) => {
            //       if (value) {
            //         if (Array.isArray(value)) {
            //           value.forEach((item) => {
            //             if (item) tags.push({ text: `${item}`, category: "特殊来源" });
            //           });
            //         } else if (typeof value === "string" && value.trim() !== "") {
            //           tags.push({ text: `${key}: ${value}`, category: "特殊来源" });
            //         }
            //       }
            //     });
            //   }

            //   setUserProfileTags(tags);
            // }
          } catch (summaryError) {
            console.error("获取聊天摘要时出错:", summaryError);
          } finally {
            setIsLoading(false);
          }
        }, 8000);
      } catch (error) {
        console.error("生成聊天历史摘要时出错:", error);
        setIsLoading(false);
      }
    } else {
      console.warn("未选择账号或对话，无法生成聊天历史摘要");
      setIsLoading(false);
    }
  };
 
  const memoryEvents = chatKeyEvents.map((event) => ({
    date: event.time,
    content: event.detail,
  }));

  return (
    <>
      <ChatMemory
        customerInfo={customerInfo}
        selectedAccount={selectedAccount}
        selectedConversation={selectedConversation}
        isLoading={isLoading}
        onUpdateMemory={fetchChatHistorySummary}
      />

      <FriendCircleAnalysis selectedAccount={selectedAccount} selectedConversation={selectedConversation} />
      {/* <UserProfile
                className="mb-4 mt-4"
                tags={userProfileTags}
            />
            <LongtimeMemory 
                memories={memoryEvents} 
            /> */}
    </>
  );
};

export default Memory;

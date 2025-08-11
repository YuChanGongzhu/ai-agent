import React, { useEffect, useState } from "react";
import { FriendCircleAnalysisResponse, getFriendCircleAnalysisApi } from "../../api/mysql";
import { generateFriendCircleAnalysisApi } from "../../api/airflow";

interface FriendCircleAnalysisProps {
  selectedAccount?: { wxid: string; name: string } | null;
  selectedConversation?: { room_id: string; room_name: string } | null;
  isLoading?: boolean;
  onUpdateAnalysis?: () => void;
}

const FriendCircleAnalysis: React.FC<FriendCircleAnalysisProps> = ({
  selectedAccount,
  selectedConversation,
  isLoading = false,
  onUpdateAnalysis,
}) => {
  const [analysisData, setAnalysisData] = useState<FriendCircleAnalysisResponse["data"] | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (selectedAccount?.wxid && selectedConversation?.room_id) {
        setLoading(true);
        try {
          const response = await getFriendCircleAnalysisApi(
            selectedAccount.wxid,
            selectedConversation.room_id
          );
          setAnalysisData(response.data);
        } catch (error) {
          console.error("Failed to fetch friend circle analysis:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    if (selectedAccount && selectedConversation) {
      fetchAnalysisData();
    }
  }, [selectedAccount, selectedConversation]);

  const handleUpdateAnalysis = async () => {
    if (selectedAccount?.wxid && selectedConversation?.room_id && selectedAccount?.name) {
      setUpdating(true);
      try {
        // 触发朋友圈分析DAG
        await generateFriendCircleAnalysisApi(selectedAccount.name, selectedConversation.room_id);

        // 显示成功消息或者其他反馈
        alert("朋友圈分析任务已提交，请稍后查看结果");

        // 如果有外部更新回调，也调用它
        if (onUpdateAnalysis) {
          onUpdateAnalysis();
        }
      } catch (error) {
        console.error("Failed to trigger friend circle analysis:", error);
        alert("提交朋友圈分析任务失败，请稍后重试");
      } finally {
        setUpdating(false);
      }
    }
  };

  // 默认分析信息，当 API 返回的信息不可用时使用
  const defaultAnalysis = {
    metadata: {
      id: 0,
      wxid: selectedAccount?.wxid || "",
      nickname: selectedAccount?.name || "",
      wx_user_id: "",
      created_at: "",
      updated_at: "",
    },
    analysis: {
      basic: {
        gender: "未知",
        age_group: "未知",
      },
      consumption: "未知",
      core_interests: [],
      life_pattern: {
        work_balance: "未知",
      },
      social: [],
      values: [],
    },
  };

  // 合并 API 返回的分析信息和默认信息
  const displayData = analysisData || defaultAnalysis;

  return (
    <div className="flex flex-col h-full">
      {/* Timeline with analysis info */}
      <div className="flex-1 pr-4 max-h-[30vh] lg:max-h-[40vh] xl:max-h-[50vh] overflow-y-auto">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[6px] top-0 bottom-0 w-0.5 bg-purple-200" />

          {/* Analysis Info Items */}
          <div className="space-y-4">
            {/* Basic Info - Gender */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  性别：
                  <span className="text-gray-700 ml-1">{displayData.analysis.basic.gender}</span>
                </div>
              </div>
            </div>

            {/* Basic Info - Age Group */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  年龄段：
                  <span className="text-gray-700 ml-1">{displayData.analysis.basic.age_group}</span>
                </div>
              </div>
            </div>

            {/* Consumption */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  消费能力：
                  <span className="text-gray-700 ml-1">{displayData.analysis.consumption}</span>
                </div>
              </div>
            </div>

            {/* Core Interests */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  核心兴趣：
                  <div className="text-gray-700 mt-1">
                    {displayData.analysis.core_interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {displayData.analysis.core_interests.map((interest, index) => (
                          <span key={index} className="badge badge-outline badge-sm">
                            {interest.tag} ({Math.round(interest.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">暂无数据</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Life Pattern */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  生活方式：
                  <span className="text-gray-700 ml-1">
                    {displayData.analysis.life_pattern.work_balance}
                  </span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  社交特征：
                  <div className="text-gray-700 mt-1">
                    {displayData.analysis.social.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {displayData.analysis.social.map((item, index) => (
                          <span key={index} className="badge badge-outline badge-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">暂无数据</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="relative flex items-start ml-2">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-purple-500 font-medium">
                  价值观：
                  <div className="text-gray-700 mt-1">
                    {displayData.analysis.values.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {displayData.analysis.values.map((value, index) => (
                          <span key={index} className="badge badge-outline badge-sm">
                            {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">暂无数据</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        {isLoading || loading || updating ? (
          <button className="btn btn-xs">
            <span className="loading loading-spinner loading-xs"></span>
          </button>
        ) : (
          <button
            style={{
              border: "1px solid #D477E1",
              borderRadius: "2px",
              color: "#D477E1",
              padding: "0px 8px",
              transition: "transform 0.1s ease-in-out",
              backgroundColor: "transparent",
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
            onClick={handleUpdateAnalysis}
            disabled={!selectedAccount?.wxid || !selectedConversation?.room_id}
          >
            手动刷新
          </button>
        )}
      </div>
    </div>
  );
};

export default FriendCircleAnalysis;

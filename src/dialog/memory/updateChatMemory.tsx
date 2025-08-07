import React from "react";
import UpdateLongtimeMemory from "./updateLongTimeMemory";
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
interface interactiveMessage {
  acquisitionChannelType: string | null;
  acquisitionChannelDetail: string | null;
  initialIntent: string | null;
  intentDetails: string | null;
  productKnowledgeLevel: string | null;
  communicationStyle: string | null;
  currentTrustLevel: string | null;
  needUrgency: string | null;
}
interface purchaseDecision {
  coreNeedType: string | null;
  budgetSensitivity: string | null;
  decisionDrivers: string[] | null;
  upsellReadiness: string | null;
  mainPurchaseObstacles: string[] | null;
}
interface customerRelationship {
  pastSatisfactionLevel: string | null;
  customerLoyaltyStatus: string | null;
  repurchaseDrivers: string[] | null;
  needEvolutionTrend: string | null;
  engagementLevel: string | null;
}
interface memoryEvents {
  date: string;
  content: string;
}
interface ChatMemoryProps {
  customerInfo?: ApiCustomerInfo;
  selectedAccount?: { wxid: string; name: string } | null;
  selectedConversation?: { room_id: string; room_name: string } | null;
  isLoading?: boolean;
  onUpdateMemory?: () => void;
  interactiveMessage?: interactiveMessage;
  purchaseDecision?: purchaseDecision;
  customerRelationship?: customerRelationship;
  memoryEvents?: memoryEvents[];
}

const UpdateChatMemory: React.FC<ChatMemoryProps> = ({
  customerInfo,
  selectedAccount,
  selectedConversation,
  isLoading = false,
  onUpdateMemory,
  interactiveMessage,
  purchaseDecision,
  customerRelationship,
  memoryEvents,
}) => {
  // 默认客户信息，当 API 返回的信息不可用时使用
  const defaultCustomerInfo = {
    name: "未知",
    contact: "未知",
    gender: "未知",
    age_group: "未知",
    city_tier: "未知",
    specific_location: "未知",
    occupation_type: "未知",
    marital_status: "未知",
    family_structure: "未知",
    income_level_estimated: "未知",
  };

  // 合并 API 返回的客户信息和默认信息
  const displayInfo = {
    ...defaultCustomerInfo,
    ...customerInfo,
  };

  // 将 null 值替换为 "未知"
  Object.keys(displayInfo).forEach((key) => {
    const k = key as keyof typeof displayInfo;
    if (displayInfo[k] === null) {
      displayInfo[k] = "未知";
    }
  });
  //显示组件
  const CustomerTagsItem = ({ title, value }: { title: string; value: any }) => {
    console.log("value", value);
    // 统一的标签样式
    const tagStyle = {
      border: "1px solid #D477E1",
      borderRadius: "20px",
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#D477E1",
      padding: "4px 8px",
      minHeight: "100%",

      wordBreak: "break-word" as const,
      whiteSpace: "normal" as const,
      textAlign: "left" as const,
      lineHeight: "1.2",
    };

    // 渲染单个标签
    const renderTag = (content: string, key: string) =>
      content !== "未知" &&
      content !== null &&
      content !== undefined &&
      content !== "" && (
        <div key={key} style={tagStyle}>
          {content}
        </div>
      );

    // 获取所有有效的标签内容
    const getAllTags = () => {
      console.log("value789", value === null);
      if (!value) return [];

      return Object.entries(value)
        .flatMap(([key, val], index) => {
          if (Array.isArray(val) && val !== null) {
            return val.map((item, itemIndex) => renderTag(item, `${index}-${itemIndex}`));
          }
          return renderTag(val as string, index.toString());
        })
        .filter(Boolean);
    };

    return (
      <div>
        <div style={{ fontSize: "14px" }}>{title}</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
            gap: "5px",
            width: "100%",
            padding: "5px",
            alignItems: "start",
          }}
        >
          {getAllTags()}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full justify-start">
      {/* 基础信息*/}
      <div className="flex flex-col">
        {/* Customer Info Items */}
        <div style={{ position: "relative" }}>
          <div
            className="absolute left-[6px] bottom-0 w-0.5 bg-purple-200 mb-2"
            style={{ height: "79%" }}
          />
          <div style={{ fontSize: "14px", color: "#D477E1", padding: "8px 0px" }}> 基础信息</div>
          <div className="overflow-y-auto max-h-[20vh]">
            {/* Name */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  姓名：<span className="text-gray-700 ml-1">{displayInfo.name}</span>
                </div>
              </div>
            </div>
            {/* Contact */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  联系方式：<span className="text-gray-700 ml-1">{displayInfo.contact}</span>
                </div>
              </div>
            </div>
            {/* Gender */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  性别：<span className="text-gray-700 ml-1">{displayInfo.gender}</span>
                </div>
              </div>
            </div>
            {/* Age Group */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  年龄段：<span className="text-gray-700 ml-1">{displayInfo.age_group}</span>
                </div>
              </div>
            </div>

            {/* City Tier */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  城市等级：<span className="text-gray-700 ml-1">{displayInfo.city_tier}</span>
                </div>
              </div>
            </div>

            {/* Specific Location */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  具体位置：
                  <span className="text-gray-700 ml-1">{displayInfo.specific_location}</span>
                </div>
              </div>
            </div>

            {/* Occupation Type */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  职业类型：
                  <span className="text-gray-700 ml-1">{displayInfo.occupation_type}</span>
                </div>
              </div>
            </div>

            {/* Marital Status */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  婚姻状况：<span className="text-gray-700 ml-1">{displayInfo.marital_status}</span>
                </div>
              </div>
            </div>

            {/* Family Structure */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  家庭结构：
                  <span className="text-gray-700 ml-1">{displayInfo.family_structure}</span>
                </div>
              </div>
            </div>

            {/* Income Level */}
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6">
                <div className="text-[#D477E1] text-sm">
                  估计收入水平：
                  <span className="text-gray-700 ml-1">{displayInfo.income_level_estimated}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 互动与认知 */}
      <div className="flex flex-col">
        {/* Customer Info Items */}
        <div style={{ position: "relative" }}>
          <div className="absolute left-[6px] top-[40px] bottom-0 w-0.5 bg-purple-200 mb-3" />
          <div style={{ fontSize: "14px", color: "#D477E1", padding: "8px 0px" }}> 用户标签</div>
          <div className="overflow-y-auto max-h-[20vh]">
            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6 flex-1">
                <CustomerTagsItem title="互动与认知" value={interactiveMessage} />
              </div>
            </div>

            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6 flex-1">
                <CustomerTagsItem title="购买决策" value={purchaseDecision} />
              </div>
            </div>

            <div className="relative flex items-start ml-2 mb-1">
              <div className="absolute -left-2 mt-1.5">
                <div className="w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white" />
              </div>
              <div className="ml-6 flex-1">
                <CustomerTagsItem title="客户关系" value={customerRelationship} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 对话总结 */}
      <div className="flex flex-col">
        {/* Customer Info Items */}
        <div style={{ fontSize: "14px", color: "#D477E1", padding: "8px 0px" }}> 对话总结</div>
        <div className="overflow-y-auto max-h-[20vh]">
          <UpdateLongtimeMemory memories={memoryEvents || []} />
        </div>
      </div>

      {/* 底部 */}
      <div className="flex items-center justify-end mt-2">
        {isLoading ? (
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
            onClick={onUpdateMemory}
            disabled={
              !selectedAccount ||
              !selectedConversation ||
              !selectedAccount?.wxid ||
              !selectedConversation?.room_id
            }
          >
            手动更新
          </button>
        )}
      </div>
    </div>
  );
};
export default UpdateChatMemory;

import React, { useState } from "react";
import clsx from "clsx";
import { getWxAutoHistoryListApi, updateWxAutoHistoryListApi } from "../../api/airflow";
import { getTokenUsageApi } from "../../api/mysql";
import { ReloadOutlined, LoadingOutlined } from "@ant-design/icons";
interface SummaryControlsProps {
  selectedAccount?: { wxid: string; name: string } | null;
  summaryTokenUsage: number;
  setSummaryTokenUsage: (usage: number) => void;
  isAISummaryEnabled: boolean;
  setIsAISummaryEnabled: (enabled: boolean) => void;
  showNotification: (message: string, type: "success" | "error") => void;
}

const SummaryControls: React.FC<SummaryControlsProps> = ({
  selectedAccount,
  summaryTokenUsage,
  setSummaryTokenUsage,
  isAISummaryEnabled,
  setIsAISummaryEnabled,
  showNotification,
}) => {
  const [isLoadingSummaryToken, setIsLoadingSummaryToken] = useState<boolean>(false);

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

  const handleAISummaryToggle = async () => {
    const newSummaryEnabled = !isAISummaryEnabled;
    setIsAISummaryEnabled(newSummaryEnabled);

    try {
      if (!selectedAccount || !selectedAccount.wxid) {
        showNotification("未选择微信账号", "error");
        return;
      }

      // Get current auto history list
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

      if (existingIndex >= 0) {
        // Update existing entry
        historyList[existingIndex].auto = newSummaryEnabled ? "true" : "false";
      } else {
        // Add new entry
        historyList.push({
          wx_user_id: wxUserId,
          auto: newSummaryEnabled ? "true" : "false",
        });
      }

      // Update the list in Airflow
      await updateWxAutoHistoryListApi(historyList);
      showNotification(`AI总结已${newSummaryEnabled ? "启用" : "禁用"}`, "success");
    } catch (error) {
      console.error("更新AI总结状态失败:", error);
      setIsAISummaryEnabled(!newSummaryEnabled); // Revert state on error
      showNotification("更新AI总结状态失败", "error");
    }
  };

  return (
    <div className="flex justify-between items-center">
      {/* Token用量显示 */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>AI总结Token用量: {summaryTokenUsage}</span>
        <button
          onClick={refreshSummaryTokenUsage}
          disabled={isLoadingSummaryToken}
          style={{ color: "#D477E1" }}
        >
          {isLoadingSummaryToken ? <LoadingOutlined /> : <ReloadOutlined />}
        </button>
      </div>

      {/* AI总结开关 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">自动总结</span>
        <button
          onClick={handleAISummaryToggle}
          className={clsx(
            "w-12 h-6 rounded-full transition-colors duration-200 ease-in-out relative",
            isAISummaryEnabled ? "bg-[#D477E1]" : "bg-gray-200"
          )}
        >
          <span
            className={clsx(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out",
              isAISummaryEnabled ? "right-1" : "left-1"
            )}
          />
        </button>
      </div>
    </div>
  );
};

export default SummaryControls;

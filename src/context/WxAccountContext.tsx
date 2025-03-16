import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WxAccount, getWxAccountListApi } from '../api/airflow';
import { useUser } from './UserContext';
import { UserProfile } from '../userManagement/userProfileService';

// 微信账号上下文类型定义
interface WxAccountContextType {
  wxAccountList: WxAccount[];
  filteredWxAccountList: WxAccount[];
  isLoading: boolean;
  error: string | null;
  refreshWxAccounts: () => Promise<void>;
}

// 创建上下文
const WxAccountContext = createContext<WxAccountContextType | undefined>(undefined);

/**
 * 微信账号上下文提供者组件
 * 管理微信账号列表状态并提供给子组件
 */
export const WxAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 状态定义
  const [wxAccountList, setWxAccountList] = useState<WxAccount[]>([]);
  const [filteredWxAccountList, setFilteredWxAccountList] = useState<WxAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用用户上下文获取用户信息和管理员状态
  const { userProfile, isAdmin, isLoading: userLoading } = useUser();

  // 过滤微信账号列表，根据用户权限
  const filterWxAccounts = (accounts: WxAccount[], profile: UserProfile | null, isUserAdmin: boolean) => {
    if (isUserAdmin) {
      // 管理员可以看到所有账号
      return accounts;
    }
    
    if (!profile || !profile.mobile_devices || profile.mobile_devices.length === 0) {
      // 如果用户没有关联设备，则不显示任何账号
      return [];
    }
    
    // 只显示用户关联设备中包含的手机号对应的微信账号
    const mobileDevices = profile.mobile_devices || [];
    // mobile_devices 是对象数组，需要比较 device.name 与 account.mobile
    return accounts.filter(account => 
      account.mobile && mobileDevices.some(device => 
        // 处理不同的设备格式
        (typeof device === 'string' ? device === account.mobile : device.name === account.mobile)
      )
    );
  };

  /**
   * 获取微信账号列表
   */
  const fetchWxAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const accounts = await getWxAccountListApi();
      setWxAccountList(accounts);
      
      // 根据用户权限和设备过滤账号
      if (!userLoading) {
        const filtered = filterWxAccounts(accounts, userProfile, isAdmin);
        setFilteredWxAccountList(filtered);
      }
    } catch (err) {
      console.error('获取微信账号失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 刷新微信账号列表
   * 可在微信账号列表变更后调用此方法
   */
  const refreshWxAccounts = async () => {
    await fetchWxAccounts();
  };

  // 当用户信息加载完成后获取微信账号列表
  useEffect(() => {
    if (!userLoading) {
      fetchWxAccounts();
    }
  }, [userProfile, isAdmin, userLoading]);

  // 提供上下文值
  const contextValue: WxAccountContextType = {
    wxAccountList,
    filteredWxAccountList,
    isLoading,
    error,
    refreshWxAccounts
  };

  return (
    <WxAccountContext.Provider value={contextValue}>
      {children}
    </WxAccountContext.Provider>
  );
};

/**
 * 微信账号上下文钩子
 * 用于在组件中访问微信账号列表和相关功能
 * 
 * 示例用法:
 * ```
 * const { wxAccountList, filteredWxAccountList, isLoading } = useWxAccount();
 * if (isLoading) return <加载中组件>;
 * return <展示微信账号列表内容>;
 * ```
 */
export const useWxAccount = (): WxAccountContextType => {
  const context = useContext(WxAccountContext);
  if (context === undefined) {
    throw new Error('useWxAccount必须在WxAccountProvider内部使用');
  }
  return context;
}; 
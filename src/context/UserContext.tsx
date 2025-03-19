import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { supabase } from '../auth/supabaseConfig';
import { UserContextType,UserProfile } from './type';
import { UserProfileService } from '../management/userManagement/userProfileService';

// 创建上下文
// =======================================================
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * 用户上下文提供者组件
 * 管理用户状态并提供给子组件
 */
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 状态定义
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  // Refs
  const isLoadingRef = useRef<boolean>(false);

  /**
   * 检查用户会话状态
   * @returns 会话中的用户信息
   */
  const checkUserSession = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('未登录');
    }
    return sessionData.session.user;
  };

  /**
   * 更新用户角色状态
   * @param profile 用户配置
   * @param userMetadata 用户元数据
   */
  const updateUserRole = (profile: UserProfile | null, userMetadata: any) => {
    const userRole = profile?.role || userMetadata?.role || 'user';
    const isUserAdmin = typeof userRole === 'string' && userRole.toLowerCase() === 'admin';
    
    console.log('用户角色:', userRole, '是否管理员:', isUserAdmin);
    setIsAdmin(isUserAdmin);
  };

  /**
   * 获取用户配置信息
   */
  const fetchUserProfile = useCallback(async () => {
    // 防止重复调用
    if (isLoadingRef.current) {
      console.log('已有一个获取用户信息的请求正在处理，跳过调用');
      return;
    }
    
    try {
      // 设置加载状态
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      // 获取用户会话信息
      const user = await checkUserSession();
      
      // 保存用户邮箱
      if (user.email) {
        setEmail(user.email);
      }

      console.log('用户上下文: 使用session中的用户信息, userId:', user.id);
      
      // 获取用户配置信息
      const profile = await UserProfileService.getUserProfile(user.id);
      console.log('用户配置已加载:', profile);
      
      // 更新状态
      setUserProfile(profile);
      updateUserRole(profile, user.user_metadata);
      
    } catch (err) {
      console.error('加载用户配置失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      // 清除加载状态
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  /**
   * 刷新用户配置
   * 可在用户信息变更后调用此方法
   */
  const refreshUserProfile = useCallback(async () => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  // 组件挂载时获取用户配置
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // 提供上下文值
  const contextValue: UserContextType = {
    userProfile,
    isAdmin,
    isLoading,
    error,
    email,
    refreshUserProfile
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * 用户上下文钩子
 * 用于在组件中访问用户信息和相关功能
 * 
 * 示例用法:
 * ```
 * const { userProfile, isAdmin, isLoading } = useUser();
 * if (isLoading) return <加载中组件>;
 * if (isAdmin) return <管理员内容>;
 * return <普通用户内容>;
 * ```
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser必须在UserProvider内部使用');
  }
  return context;
};

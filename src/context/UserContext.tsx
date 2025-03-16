import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../utils/supabaseConfig';
import { UserProfile, UserProfileService } from '../userManagement/userProfileService';

// 创建一个扩展的用户配置接口，加入加载状态和错误信息
interface UserContextType {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  email: string | null;
  refreshUserProfile: () => Promise<void>;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 上下文提供者组件
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  
  // 添加一个ref来防止重复调用
  const isLoadingRef = useRef<boolean>(false);

  const fetchUserProfile = async () => {
    // 防止重复调用
    if (isLoadingRef.current) {
      console.log('已有一个获取用户信息的请求正在处理，跳过调用');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      // 检查用户session以减少API调用
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('未登录');
      }
      
      // 使用本地session信息，避免再次调用getUser API
      const user = sessionData.session.user;
      
      // 保存用户邮箱
      if (user.email) {
        setEmail(user.email);
      }

      // 调试输出
      console.log('User context: 使用session中的用户信息, userId:', user.id);
      
      // 获取用户配置信息
      const profile = await UserProfileService.getUserProfile(user.id);
      
      // 调试输出
      console.log('User profile loaded in context:', profile);
      
      // 设置用户配置
      setUserProfile(profile);
      
      // 确定用户是否为管理员
      const userRole = profile?.role || user.user_metadata?.role || 'user';
      const isUserAdmin = typeof userRole === 'string' && userRole.toLowerCase() === 'admin';
      
      console.log('User role in context:', userRole, 'Is admin:', isUserAdmin);
      setIsAdmin(isUserAdmin);
      
    } catch (err) {
      console.error('加载用户配置失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 提供一个刷新用户配置的方法
  const refreshUserProfile = async () => {
    await fetchUserProfile();
  };

  // 组件挂载时获取用户配置
  useEffect(() => {
    fetchUserProfile();
  }, []);

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

// 自定义钩子，用于访问用户上下文
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser必须在UserProvider内部使用');
  }
  return context;
};

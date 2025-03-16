import { useUser } from './UserContext';

/**
 * 获取当前登录用户的管理员状态
 * @returns 是否为管理员和加载状态
 */
export const useIsAdmin = (): { isAdmin: boolean; isLoading: boolean } => {
  const { isAdmin, isLoading } = useUser();
  return { isAdmin, isLoading };
};

/**
 * 获取当前登录用户的个人资料
 * @returns 用户资料和加载状态
 */
export const useUserProfile = () => {
  const { userProfile, isLoading, error } = useUser();
  return { userProfile, isLoading, error };
};

/**
 * 获取用户资料刷新方法
 * @returns 刷新用户资料的方法
 */
export const useProfileRefresh = (): { refreshProfile: () => Promise<void> } => {
  const { refreshUserProfile } = useUser();
  return { refreshProfile: refreshUserProfile };
};

/**
 * 获取用户邮箱
 * @returns 用户邮箱和加载状态
 */
export const useUserEmail = (): { email: string | null; isLoading: boolean } => {
  const { email, isLoading } = useUser();
  return { email, isLoading };
}; 
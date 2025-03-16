import { UserProfile } from '../userManagement/userProfileService';

/**
 * 用户上下文类型
 * 定义了用户相关状态和操作的接口
 */
export interface UserContextType {
  /** 用户配置信息 */
  userProfile: UserProfile | null;
  /** 用户是否为管理员 */
  isAdmin: boolean;
  /** 是否正在加载用户信息 */
  isLoading: boolean;
  /** 加载用户信息时的错误信息 */
  error: string | null;
  /** 用户邮箱 */
  email: string | null;
  /** 刷新用户配置信息的方法 */
  refreshUserProfile: () => Promise<void>;
} 
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

/**
 * 用户配置信息--usermanagement
 * 定义了用户配置的接口
 */
export interface UserProfile {
  id?: string;
  user_id: string;
  display_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  bio?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  mobile_devices?: any[]; // 用户关联的手机设备列表
  servers?: any[]; // 用户关联的服务器列表
  role?: string; // 用户角色
  material_list?: string[]; // 用户能访问的素材库ID列表
  industry?: string; // 用户所属行业
}

export interface UserData {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  is_active: boolean;
  role: string;
  display_name?: string;
  profile?: UserProfile | null;
} 
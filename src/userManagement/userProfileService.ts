import { supabase } from '../utils/supabaseConfig';

export interface UserProfile {
  id?: string;
  user_id: string;
  display_name?: string;
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
}

export class UserProfileService {
  // 添加静态变量用于缓存当前用户和配置信息
  private static currentUser: any = null;
  private static currentUserProfile: UserProfile | null = null;
  private static lastFetchTime: number = 0;
  private static CACHE_TTL = 60000; // 缓存有效期1分钟

  /**
   * 获取用户配置信息
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    // 如果已有缓存并且用户ID匹配，直接返回缓存
    if (this.currentUserProfile && this.currentUserProfile.user_id === userId) {
      const now = Date.now();
      if (now - this.lastFetchTime < this.CACHE_TTL) {
        return this.currentUserProfile;
      }
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // PGRST116是"找不到记录"错误
      if (error.code === 'PGRST116') {
        this.currentUserProfile = null;
        return null;
      }
      console.error('获取用户配置失败:', error);
      throw error;
    }
    
    // 更新缓存
    this.currentUserProfile = data;
    this.lastFetchTime = Date.now();
    return data;
  }

  /**
   * 创建用户配置
   */
  static async createUserProfile(profile: UserProfile): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) {
      console.error('创建用户配置失败:', error);
      throw error;
    }
    
    // 更新缓存
    this.currentUserProfile = data;
    this.lastFetchTime = Date.now();
    
    return data;
  }

  /**
   * 更新用户配置
   */
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('更新用户配置失败:', error);
      throw error;
    }
    
    // 更新缓存
    this.currentUserProfile = data;
    this.lastFetchTime = Date.now();
    
    return data;
  }
  
  /**
   * 更新用户的素材库访问列表
   */
  static async updateUserMaterialList(userId: string, materialList: string[]): Promise<UserProfile> {
    return this.updateUserProfile(userId, { material_list: materialList });
  }
  
  /**
   * 向用户的素材库访问列表添加素材ID
   */
  static async addMaterialToUserList(userId: string, materialId: string): Promise<UserProfile> {
    // 先获取用户当前的素材列表
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('用户配置不存在');
    }
    
    // 确保material_list是一个数组
    const currentList = profile.material_list || [];
    
    // 确保不添加重复的素材ID
    if (!currentList.includes(materialId)) {
      const updatedList = [...currentList, materialId];
      return this.updateUserProfile(userId, { material_list: updatedList });
    }
    
    return profile;
  }
  
  /**
   * 从用户的素材库访问列表移除素材ID
   */
  static async removeMaterialFromUserList(userId: string, materialId: string): Promise<UserProfile> {
    // 先获取用户当前的素材列表
    const profile = await this.getUserProfile(userId);
    if (!profile) {
      throw new Error('用户配置不存在');
    }
    
    // 确保material_list是一个数组
    const currentList = profile.material_list || [];
    
    // 过滤掉要移除的素材ID
    const updatedList = currentList.filter(id => id !== materialId);
    return this.updateUserProfile(userId, { material_list: updatedList });
  }

  /**
   * 获取或创建用户配置
   * 如果用户配置不存在，则创建一个新的
   */
  static async getOrCreateUserProfile(userId: string, defaultProfile: Partial<UserProfile> = {}): Promise<UserProfile> {
    try {
      const profile = await this.getUserProfile(userId);
      if (profile) {
        return profile;
      }
      
      // 如果没有找到配置，创建一个新的
      return await this.createUserProfile({
        user_id: userId,
        ...defaultProfile
      });
    } catch (error) {
      console.error('获取或创建用户配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取所有用户配置
   */
  static async getAllUserProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取所有用户配置失败:', error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * 获取用户认证信息与配置信息（一次性获取两种数据）
   * 使用缓存减少API调用次数
   */
  static async getUserInfoWithProfile() {
    try {
      // 检查是否有缓存的用户数据，且缓存未过期
      const now = Date.now();
      if (this.currentUser && this.currentUserProfile && (now - this.lastFetchTime < this.CACHE_TTL)) {
        return {
          success: true,
          userId: this.currentUser.id,
          email: this.currentUser.email,
          profile: this.currentUserProfile,
          isAdmin: this.currentUserProfile?.role === 'admin',
          fromCache: true
        };
      }

      // 获取当前用户认证信息
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('获取用户认证信息失败:', authError);
        throw authError;
      }
      
      if (!user) {
        return { 
          success: false,
          message: '未登录用户'
        };
      }

      // 更新用户缓存
      this.currentUser = user;
      
      // 获取用户配置信息 - 使用缓存机制的getUserProfile
      try {
        const profile = await this.getUserProfile(user.id);
        
        // 检查用户角色
        const isAdmin = profile?.role === 'admin';
        
        return {
          success: true,
          userId: user.id,
          email: user.email,
          profile,
          isAdmin
        };
      } catch (profileError) {
        console.error('获取用户配置失败:', profileError);
        return {
          success: false,
          user,
          message: '获取用户配置失败',
          error: profileError
        };
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        message: '获取用户信息失败',
        error
      };
    }
  }

  /**
   * 清除用户缓存
   * 在用户登出或配置更新时调用
   */
  static clearUserCache() {
    this.currentUser = null;
    this.currentUserProfile = null;
    this.lastFetchTime = 0;
  }
} 
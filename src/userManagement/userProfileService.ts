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
}

export class UserProfileService {
  /**
   * 获取用户配置信息
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // PGRST116是"找不到记录"错误
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('获取用户配置失败:', error);
      throw error;
    }
    
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
    
    return data;
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
} 
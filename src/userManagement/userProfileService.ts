import { supabase } from '../auth/supabaseConfig';
import { UserProfile } from '../context/type';

export class UserProfileService {
  // 添加静态变量用于缓存当前用户和配置信息
  private static currentUser: any = null;
  private static currentUserProfile: UserProfile | null = null;
  private static lastFetchTime: number = 0;
  private static CACHE_TTL = 60000; // 缓存有效期1分钟
  
  // 添加一个工具方法，用于统一管理缓存有效性检查
  private static isCacheValid(userId?: string): boolean {
    const now = Date.now();
    if (!this.currentUserProfile || (now - this.lastFetchTime >= this.CACHE_TTL)) {
      return false;
    }
    
    // 如果提供了用户ID，则检查缓存的用户ID是否匹配
    if (userId && this.currentUserProfile.user_id !== userId) {
      return false;
    }
    
    return true;
  }
  
  // 添加统一的缓存更新方法
  private static updateCache(profile: UserProfile | null): void {
    this.currentUserProfile = profile;
    this.lastFetchTime = Date.now();
  }

  /**
   * 获取用户配置信息
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    // 检查缓存有效性
    if (this.isCacheValid(userId)) {
      return this.currentUserProfile;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // PGRST116是"找不到记录"错误
      if (error.code === 'PGRST116') {
        this.updateCache(null);
        return null;
      }
      console.error('获取用户配置失败:', error);
      throw error;
    }
    
    // 更新缓存
    this.updateCache(data as UserProfile);
    return data as UserProfile;
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
    this.updateCache(data as UserProfile);
    
    return data as UserProfile;
  }

  /**
   * 更新用户配置
   */
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // 检查缓存，看是否有必要进行更新
    let needsUpdate = true;
    
    if (this.isCacheValid(userId)) {
      // 检查是否有实际的变更
      needsUpdate = false;
      for (const key in updates) {
        // 如果值不同，则需要更新
        if (JSON.stringify((this.currentUserProfile as any)[key]) !== JSON.stringify((updates as any)[key])) {
          needsUpdate = true;
          break;
        }
      }
      
      // 如果没有变更，直接返回缓存的配置
      if (!needsUpdate) {
        return this.currentUserProfile!;
      }
    }
    
    // 如果需要更新或没有有效缓存，则更新数据库
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('更新用户配置失败:', error);
      throw error;
    }
    
    // 更新缓存
    this.updateCache(data as UserProfile);
    
    return data as UserProfile;
  }
  
  /**
   * 更新用户的素材库访问列表
   */
  static async updateUserMaterialList(userId: string, materialList: string[]): Promise<UserProfile> {
    return this.updateUserProfile(userId, { material_list: materialList });
  }
  
  /**
   * 获取或创建用户配置
   * 如果用户配置不存在，则创建一个新的
   */
  static async getOrCreateUserProfile(userId: string, defaultProfile: Partial<UserProfile> = {}): Promise<UserProfile> {
    try {
      // 检查缓存中是否有数据
      if (this.isCacheValid(userId)) {
        return this.currentUserProfile!;
      }

      // 使用upsert操作，一次性完成获取或创建
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...defaultProfile,
          // 确保只在插入时设置created_at
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('获取或创建用户配置失败:', error);
        throw error;
      }
      
      // 更新缓存
      this.updateCache(data as UserProfile);
      
      return data as UserProfile;
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
      // 增强判断：只要有currentUser就优先使用，避免不必要的auth.getUser()调用
      if (this.currentUser) {
        // 如果有用户但没有配置，或者配置已过期，仅获取配置信息
        if (!this.currentUserProfile || (now - this.lastFetchTime >= this.CACHE_TTL)) {
          // 获取用户配置信息（不调用auth.getUser）
          const userId = this.currentUser.id;
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (profileError) {
            if (profileError.code !== 'PGRST116') {
              console.error('获取用户配置失败:', profileError);
              return {
                success: false,
                user: this.currentUser,
                message: '获取用户配置失败',
                error: profileError
              };
            }
            
            // 用户配置不存在，返回成功但没有配置
            this.updateCache(null);
            
            return {
              success: true,
              userId: this.currentUser.id,
              email: this.currentUser.email,
              profile: null,
              isAdmin: false
            };
          }
          
          // 更新缓存
          this.updateCache(profile as UserProfile);
          
          // 检查用户角色
          const isAdmin = profile?.role === 'admin';
          
          return {
            success: true,
            userId: this.currentUser.id,
            email: this.currentUser.email,
            profile,
            isAdmin
          };
        } else {
          // 用户和配置的缓存都有效
          return {
            success: true,
            userId: this.currentUser.id,
            email: this.currentUser.email,
            profile: this.currentUserProfile,
            isAdmin: this.currentUserProfile?.role === 'admin',
            fromCache: true
          };
        }
      }

      // 如果没有缓存用户，才调用auth.getUser()
      console.log('缓存中没有用户数据，调用auth.getUser()获取认证信息');
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
      
      // 尝试从缓存获取用户配置（虽然前面检查过，但updateCache可能被其他方法调用过）
      if (this.isCacheValid(user.id)) {
        const isAdmin = this.currentUserProfile?.role === 'admin';
        return {
          success: true,
          userId: user.id,
          email: user.email,
          profile: this.currentUserProfile,
          isAdmin,
          fromCache: true
        };
      }
      
      // 获取用户配置信息
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        if (profileError.code !== 'PGRST116') { // 不是"找不到记录"错误时才报错
          console.error('获取用户配置失败:', profileError);
          return {
            success: false,
            user,
            message: '获取用户配置失败',
            error: profileError
          };
        }
        
        // 用户配置不存在，返回成功但没有配置
        this.updateCache(null);
        
        return {
          success: true,
          userId: user.id,
          email: user.email,
          profile: null,
          isAdmin: false
        };
      }
      
      // 更新缓存
      this.updateCache(profile as UserProfile);
      
      // 检查用户角色
      const isAdmin = profile?.role === 'admin';
      
      return {
        success: true,
        userId: user.id,
        email: user.email,
        profile,
        isAdmin
      };
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
import supabase from './supabaseConfig';
import { User, Session } from '@supabase/supabase-js';

// 用户注册功能已移除

// 用户登录
export const loginUser = async (email: string, password: string): Promise<{ user: User | null; session: Session | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // 登录成功后更新用户资料中的updated_at字段以及email字段
    if (data.user) {
      try {
        const now = new Date().toISOString();
        
        // 1. 首先检查用户资料是否存在
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
          
        if (profileError) {
          if (profileError.code === 'PGRST116') { // PGRST116 是"没有找到记录"的错误
            console.error('用户资料不存在:', data.user.id);
          } else {
            console.error('查询用户资料失败:', profileError);
          }
        } else if (profileData) {
          // 2. 如果用户资料存在，更新它
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              updated_at: now,
              email: data.user.email
            })
            .eq('user_id', data.user.id);
          
          if (updateError) {
            console.error('更新用户最后登录时间和邮箱失败:', updateError);
          }
        }
      } catch (profileUpdateError) {
        // 确保即使资料更新失败，也不会影响登录过程
        console.error('用户资料更新过程中发生错误:', profileUpdateError);
      }
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// 用户退出
export const logoutUser = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// 获取当前用户
export const getCurrentUser = async (): Promise<User | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// 重置密码
export const resetPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// 更新用户资料
export const updateUserProfile = async (displayName: string, photoURL?: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        name: displayName,
        avatar_url: photoURL || null
      }
    });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// 更新用户邮箱
export const updateUserEmail = async (newEmail: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });
    if (error) throw error;
    // Supabase 会自动发送验证邮件
  } catch (error) {
    throw error;
  }
};

// 更新用户密码
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// 检查用户是否已认证
export const isAuthenticated = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// 检查邮箱是否已验证
export const isEmailVerified = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getUser();
  // Supabase 用户在确认邮箱后才能登录，所以如果用户存在且已登录，则邮箱已验证
  return !!data.user;
};

// 重新发送验证邮件功能已移除
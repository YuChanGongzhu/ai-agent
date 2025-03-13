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
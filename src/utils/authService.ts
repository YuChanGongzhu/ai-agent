import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { createUserDocument } from './userManagement';

// 用户注册
export const registerUser = async (
  email: string, 
  password: string
): Promise<UserCredential> => {
  try {
    // 创建用户
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 发送邮箱验证
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      
      // 创建用户文档
      await createUserDocument({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || email,
        displayName: email.split('@')[0],
        role: 'user',
        createdAt: new Date(),
        isActive: true
      });
    }
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// 用户登录
export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 更新用户最后登录时间
    if (userCredential.user) {
      try {
        const userId = userCredential.user.uid;
        await import('./userManagement').then(({ updateUserInfo }) => {
          updateUserInfo(userId, { lastLogin: new Date() });
        });
      } catch (err) {
        console.error('更新登录时间失败:', err);
      }
    }
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// 用户退出
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// 获取当前用户
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 重置密码
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// 更新用户资料
export const updateUserProfile = async (displayName: string, photoURL?: string): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL: photoURL || null
      });
    }
  } catch (error) {
    throw error;
  }
};

// 更新用户邮箱
export const updateUserEmail = async (newEmail: string): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updateEmail(auth.currentUser, newEmail);
      // 发送新邮箱验证
      await sendEmailVerification(auth.currentUser);
    }
  } catch (error) {
    throw error;
  }
};

// 更新用户密码
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  } catch (error) {
    throw error;
  }
};

// 检查用户是否已认证
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

// 检查邮箱是否已验证
export const isEmailVerified = (): boolean => {
  return auth.currentUser?.emailVerified || false;
}; 
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
      try {
        // 先发送邮箱验证
        await sendEmailVerification(auth.currentUser);
        console.log('验证邮件已发送到:', email);
      } catch (emailError) {
        console.error('发送验证邮件失败:', emailError);
        // 即使发送验证邮件失败，也不影响注册过程
      }
      
      try {
        // 尝试创建用户文档
        await createUserDocument({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || email,
          displayName: email.split('@')[0],
          role: 'user',
          createdAt: new Date(),
          isActive: true
        });
      } catch (docError: any) {
        console.error('创建用户文档失败:', docError);
        // 用户文档创建失败也不影响注册，只记录错误
        // 用户仍然可以验证邮箱并登录
        
        // 记录具体的错误代码和消息，以便调试
        if (docError.code === 'permission-denied') {
          console.warn('权限错误: 无法创建用户文档。请检查 Firebase 安全规则。');
        }
      }
    }
    
    return userCredential;
  } catch (error) {
    console.error('用户注册失败:', error);
    throw error;
  }
};

// 用户登录
export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 检查邮箱是否已验证
    if (!userCredential.user.emailVerified) {
      // 用户邮箱未验证，自动发送新的验证邮件
      await sendEmailVerification(userCredential.user);
      
      // 登出用户，因为邮箱未验证
      await signOut(auth);
      
      // 抛出错误，阻止登录
      throw {
        code: 'auth/email-not-verified',
        message: '您的邮箱尚未验证。我们已向您发送了新的验证邮件，请查收并完成验证后再登录。'
      };
    }
    
    // 邮箱已验证，更新用户最后登录时间
    if (userCredential.user) {
      try {
        const userId = userCredential.user.uid;
        const { getUserInfo, createUserDocument, updateUserInfo } = await import('./userManagement');
        
        // 先检查用户文档是否存在
        const userDoc = await getUserInfo(userId);
        
        if (userDoc) {
          // 如果文档存在，更新最后登录时间
          await updateUserInfo(userId, { lastLogin: new Date() });
          console.log('已更新用户最后登录时间');
        } else {
          // 如果文档不存在，创建新文档
          console.log('用户文档不存在，创建新文档...');
          try {
            await createUserDocument({
              uid: userId,
              email: userCredential.user.email || email,
              displayName: userCredential.user.displayName || email.split('@')[0],
              photoURL: userCredential.user.photoURL || '',
              role: 'user',
              createdAt: new Date(),
              lastLogin: new Date(),
              isActive: true
            });
            console.log('用户文档创建成功');
          } catch (createError) {
            console.error('创建用户文档失败:', createError);
            // 如果是权限错误，记录更具体的信息
            if (createError instanceof Error && createError.message.includes('permission-denied')) {
              console.warn('权限错误: 无法创建用户文档，请检查 Firebase 安全规则');
            }
          }
        }
      } catch (err) {
        // 只记录错误，不阻止登录流程
        console.error('更新或创建用户文档失败:', err);
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

// 重新发送验证邮件
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    } else {
      throw new Error('没有登录的用户，无法发送验证邮件');
    }
  } catch (error) {
    throw error;
  }
}; 
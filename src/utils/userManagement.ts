import { auth } from './firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getFirestore,
  CollectionReference,
  DocumentData,
  Query
} from 'firebase/firestore';
import app from './firebaseConfig';

// 初始化Firestore
const db = getFirestore(app);

// 用户角色类型
export type UserRole = 'admin' | 'manager' | 'user';

// 用户信息接口
export interface UserInfo {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  department?: string;
  position?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// 用户列表过滤条件
export interface UserFilters {
  role?: UserRole;
  department?: string;
  isActive?: boolean;
  searchTerm?: string;
}

// 创建用户文档
export const createUserDocument = async (userInfo: Partial<UserInfo>): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    const uid = userInfo.uid || auth.currentUser.uid;
    const userRef = doc(db, 'users', uid);
    
    // 设置默认值
    const userData: UserInfo = {
      uid,
      email: userInfo.email || auth.currentUser.email || '',
      displayName: userInfo.displayName || auth.currentUser.displayName || '',
      photoURL: userInfo.photoURL || auth.currentUser.photoURL || '',
      phoneNumber: userInfo.phoneNumber || auth.currentUser.phoneNumber || '',
      role: userInfo.role || 'user',
      createdAt: userInfo.createdAt || new Date(),
      isActive: userInfo.isActive !== undefined ? userInfo.isActive : true,
      department: userInfo.department || '',
      position: userInfo.position || '',
      metadata: userInfo.metadata || {},
    };

    await setDoc(userRef, userData);
  } catch (error) {
    throw error;
  }
};

// 获取用户信息
export const getUserInfo = async (uid?: string): Promise<UserInfo | null> => {
  try {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return userSnapshot.data() as UserInfo;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

// 更新用户信息
export const updateUserInfo = async (uid: string, userData: Partial<UserInfo>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { ...userData });
  } catch (error) {
    throw error;
  }
};

// 获取用户角色
export const getUserRole = async (uid?: string): Promise<UserRole | null> => {
  try {
    const userInfo = await getUserInfo(uid);
    return userInfo ? userInfo.role : null;
  } catch (error) {
    throw error;
  }
};

// 设置用户角色
export const setUserRole = async (uid: string, role: UserRole): Promise<void> => {
  try {
    await updateUserInfo(uid, { role });
  } catch (error) {
    throw error;
  }
};

// 查询用户列表
export const getUsersList = async (filters?: UserFilters): Promise<UserInfo[]> => {
  try {
    const usersCollection = collection(db, 'users');
    let usersQuery: Query<DocumentData> = usersCollection;
    
    // 如果有过滤条件，构建查询
    if (filters) {
      if (filters.role) {
        usersQuery = query(usersCollection, where('role', '==', filters.role));
      }
      
      if (filters.department) {
        usersQuery = query(
          filters.role ? usersQuery : usersCollection, 
          where('department', '==', filters.department)
        );
      }
      
      if (filters.isActive !== undefined) {
        usersQuery = query(
          (filters.role || filters.department) ? usersQuery : usersCollection, 
          where('isActive', '==', filters.isActive)
        );
      }
    }
    
    const querySnapshot = await getDocs(usersQuery);
    
    let usersList: UserInfo[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserInfo;
      
      // 如果有搜索词，过滤结果
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        if (
          userData.email?.toLowerCase().includes(searchTerm) ||
          userData.displayName?.toLowerCase().includes(searchTerm) ||
          userData.department?.toLowerCase().includes(searchTerm) ||
          userData.position?.toLowerCase().includes(searchTerm)
        ) {
          usersList.push(userData);
        }
      } else {
        usersList.push(userData);
      }
    });
    
    return usersList;
  } catch (error) {
    throw error;
  }
};

// 停用用户
export const deactivateUser = async (uid: string): Promise<void> => {
  try {
    await updateUserInfo(uid, { isActive: false });
  } catch (error) {
    throw error;
  }
};

// 激活用户
export const activateUser = async (uid: string): Promise<void> => {
  try {
    await updateUserInfo(uid, { isActive: true });
  } catch (error) {
    throw error;
  }
};

// 删除用户文档
export const deleteUserDocument = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error) {
    throw error;
  }
};

// 获取用户数量统计
export const getUsersStats = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  managerUsers: number;
  regularUsers: number;
}> => {
  try {
    const allUsers = await getUsersList();
    
    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(user => user.isActive).length,
      adminUsers: allUsers.filter(user => user.role === 'admin').length,
      managerUsers: allUsers.filter(user => user.role === 'manager').length,
      regularUsers: allUsers.filter(user => user.role === 'user').length,
    };
  } catch (error) {
    throw error;
  }
}; 
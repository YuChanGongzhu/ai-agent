// Firebase配置文件
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.REACT_APP_FIREBASE_PROJECT_NUMBER,
  appId: '1:' + process.env.REACT_APP_FIREBASE_PROJECT_NUMBER + ':web:' + process.env.REACT_APP_FIREBASE_PROJECT_NAME,
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 导出Auth实例
export const auth = getAuth(app);

/**
 * Firebase 安全规则配置指南
 * 
 * 如果遇到 "Firebase权限被拒绝" 错误，请确保在 Firebase 控制台中正确配置 Firestore 安全规则:
 * 
 * 1. 登录 Firebase 控制台 (https://console.firebase.google.com/)
 * 2. 选择您的项目
 * 3. 导航至 "Firestore Database" > "规则" 标签
 * 4. 添加以下规则:
 * 
 * ```
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // 允许已认证用户创建自己的用户文档
 *     match /users/{userId} {
 *       allow create: if request.auth != null && request.auth.uid == userId;
 *       allow read, update: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 * ```
 * 
 * 5. 点击 "发布" 按钮保存规则
 */

export default app; 
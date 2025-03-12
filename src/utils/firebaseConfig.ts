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
export default app; 
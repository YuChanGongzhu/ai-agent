import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initializeNacos } from './utils/nacosInit';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 初始化Nacos配置，不添加默认邀请码
initializeNacos({
  addDefaultInviteCodes: false
}).catch(error => {
  console.error('Nacos初始化失败:', error);
});

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

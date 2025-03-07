import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupIcon from '../img/nav/group.svg';
import loginImage from '../img/login.png';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证用户名和密码是否匹配环境变量
    if (username === process.env.REACT_APP_USERNAME && password === process.env.REACT_APP_PASSWORD) {
      // 登录成功，将登录状态存储在 localStorage 中
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full flex bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left Side - Images */}
        <div className="flex-1 bg-[#F8F9FF] p-12 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-8">
            <img src={groupIcon} alt="Lucy AI Icon" className="w-8 h-8" />
            <h1 className="text-primary text-2xl font-medium">LUCY AI</h1>
          </div>
          <img src={loginImage} alt="Login Illustration" className="w-96" />
          <p className="text-gray-600 mt-4">企业成功的关键选择</p>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-medium text-gray-900 mb-8">欢迎使用LUCY AI</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              <div>
                <input
                  type="text"
                  required
                  placeholder="请输入人工智能的名称"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div>
                <input
                  type="password"
                  required
                  placeholder="请输入人工智能的密码"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-600">
                  记住我的登录状态
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white rounded-lg py-3 hover:bg-primary/90 transition-colors"
              >
                登录
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupIcon from '../img/nav/group.svg';
import loginImage from '../img/login.png';
import { loginUser } from '../auth/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // 登录逻辑
      await loginUser(email, password);
      // 登录成功，导航到仪表盘
      navigate('/dashboard');
    } catch (error: any) {
      // 处理错误信息
      let errorMessage = '登录失败，请检查您的邮箱和密码';
      
      console.error('认证错误:', error);
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = '用户不存在';
            break;
          case 'auth/wrong-password':
            errorMessage = '密码错误';
            break;
          case 'auth/invalid-email':
            errorMessage = '邮箱格式不正确';
            break;
          case 'auth/network-request-failed':
            errorMessage = '网络请求失败，请检查网络连接';
            break;
          case 'auth/too-many-requests':
            errorMessage = '请求次数过多，请稍后再试';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = '该操作未被允许，登录方式可能已禁用';
            break;
          default:
            errorMessage = error.message || '登录失败，请稍后再试';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
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
          <img src={loginImage} alt="Login Illustration" className="w-96 mb-8" />
          <h1 className="text-primary text-3xl font-semibold">LUCY AI</h1>
          <p className="text-gray-600 mt-4">企业成功的关键选择</p>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-medium text-gray-900 mb-8">
              欢迎使用LUCY AI
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              {successMessage && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{successMessage}</div>
                </div>
              )}
              
              <div>
                <input
                  type="email"
                  required
                  placeholder="请输入邮箱地址"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  placeholder="请输入密码"
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
                className="w-full bg-primary text-white rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                还没有账号？{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  立即注册
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import loginImage from '../img/login.png';
import { loginUser } from '../auth/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  
  // Detect mobile screen size
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md sm:max-w-6xl flex flex-col md:flex-row bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left Side - Images (Hidden on Mobile) */}
        <div className={`${isMobile ? 'hidden' : 'flex-1'} bg-[rgba(108,93,211,0.05)] p-6 sm:p-12 flex flex-col items-center justify-center`}>
          <div className="flex items-center gap-2 mb-4 sm:mb-8">
            <h1 className="text-[rgba(108,93,211,1)] text-xl sm:text-2xl font-medium">LUCY AI</h1>
          </div>
          <img src={loginImage} alt="Login Illustration" className="w-64 sm:w-96 mb-4 sm:mb-8" />
          <h1 className="text-[rgba(108,93,211,1)] text-2xl sm:text-3xl font-semibold">LUCY AI</h1>
          <p className="text-gray-600 mt-2 sm:mt-4 text-sm sm:text-base">企业成功的关键选择</p>
        </div>

        {/* Logo for Mobile View Only */}
        {isMobile && (
          <div className="flex flex-col items-center justify-center py-6 bg-[rgba(108,93,211,0.05)]">
            <h1 className="text-[rgba(108,93,211,1)] text-3xl font-semibold">LUCY AI</h1>
            <p className="text-gray-600 mt-2 text-sm">企业成功的关键选择</p>
          </div>
        )}

        {/* Right Side - Login Form */}
        <div className="flex-1 p-6 sm:p-12">
          <div className="mx-auto">
            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 mb-6 sm:mb-8 text-center sm:text-left">
              欢迎使用LUCY AI
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-red-700">{error}</div>
                </div>
              )}
              
              {successMessage && (
                <div className="rounded-md bg-green-50 p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-green-700">{successMessage}</div>
                </div>
              )}
              
              <div>
                <input
                  type="email"
                  required
                  placeholder="请输入邮箱地址"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,0.2)] focus:border-[rgba(108,93,211,1)] transition-colors text-sm sm:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  placeholder="请输入密码"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(108,93,211,0.2)] focus:border-[rgba(108,93,211,1)] transition-colors text-sm sm:text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[rgba(108,93,211,1)] focus:ring-[rgba(108,93,211,1)] border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 text-xs sm:text-sm text-gray-600">
                  记住我的登录状态
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[rgba(108,93,211,1)] text-white rounded-lg py-2.5 sm:py-3 hover:bg-[rgba(108,93,211,0.9)] transition-colors disabled:opacity-50 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-xs sm:text-sm text-gray-600">
                还没有账号？{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="font-medium text-[rgba(108,93,211,1)] hover:text-[rgba(108,93,211,0.8)]"
                >
                  立即注册
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact Information Footer */}
      <div className="w-full max-w-md sm:max-w-6xl bg-[rgba(108,93,211,1)] text-white py-3 sm:py-4 px-4 sm:px-8 mt-4 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-8 rounded-b-lg text-xs sm:text-sm">
      </div>
    </div>
  );
};

export default Login;

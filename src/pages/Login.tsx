import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import groupIcon from '../img/nav/group.svg';
import loginImage from '../img/login.png';
import { authenticateUser } from '../api/nacos';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 检查是否有来自其他页面的消息（如注册成功消息）
  useEffect(() => {
    const state = location.state as { message?: string };
    if (state && state.message) {
      setMessage(state.message);
      // 清除location state以避免刷新页面时再次显示消息
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 使用Nacos认证
      const user = await authenticateUser(identifier, password);
      
      if (user) {
        // 登录成功，将用户信息和登录状态存储在 localStorage 中
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({
          username: user.username,
          email: user.email,
          role: user.role
        }));
        
        // 如果选择了"记住我"，则保存登录标识符
        if (rememberMe) {
          localStorage.setItem('rememberedIdentifier', identifier);
        } else {
          localStorage.removeItem('rememberedIdentifier');
        }
        
        navigate('/dashboard');
      } else {
        setError('用户名/邮箱/手机号或密码错误');
      }
    } catch (err: any) {
      console.error('登录出错:', err);
      
      // 处理不同类型的错误
      if (err.message === 'Network Error') {
        setError('网络错误，无法连接到服务器');
      } else if (err.response && err.response.status === 404) {
        setError('配置数据不存在，请联系管理员初始化系统');
      } else {
        setError('登录过程中发生错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 加载记住的登录标识符
  useEffect(() => {
    const rememberedIdentifier = localStorage.getItem('rememberedIdentifier');
    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier);
      setRememberMe(true);
    }
  }, []);

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
            <h2 className="text-2xl font-medium text-gray-900 mb-8">欢迎使用LUCY AI</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              {message && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{message}</div>
                </div>
              )}
              
              <div>
                <input
                  type="text"
                  required
                  placeholder="用户名/邮箱/手机号"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="password"
                  required
                  placeholder="密码"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
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
                
                <div className="text-sm">
                  <Link to="/register" className="text-primary hover:underline">
                    注册账号
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:bg-gray-400"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
            
            {/* 移除管理员账号信息的提示 */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>首次使用请使用邀请码注册账号</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

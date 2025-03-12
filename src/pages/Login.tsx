import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupIcon from '../img/nav/group.svg';
import loginImage from '../img/login.png';
import { loginUser, registerUser } from '../utils/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isRegistering) {
        // 注册逻辑
        if (password !== confirmPassword) {
          setError('两次输入的密码不匹配');
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError('密码长度必须至少为6位');
          setLoading(false);
          return;
        }

        // 验证邀请码
        const correctInviteCode = process.env.REACT_APP_INVITE_CODE;
        if (inviteCode !== correctInviteCode) {
          setError('邀请码不正确');
          setLoading(false);
          return;
        }

        // 注册新用户
        await registerUser(email, password);
        
        // 设置成功信息
        setSuccessMessage('注册成功！已向您的邮箱发送验证邮件，请前往验证。请使用您的邮箱和密码登录。');
        
        // 清空注册字段
        setConfirmPassword('');
        setInviteCode('');
        
        // 切换到登录模式
        setTimeout(() => {
          setIsRegistering(false);
          setSuccessMessage('');
        }, 5000);
      } else {
        // 登录逻辑
        await loginUser(email, password);
        // 登录成功，导航到仪表盘
        navigate('/dashboard');
      }
    } catch (error: any) {
      // 处理错误信息
      let errorMessage = '登录失败，请检查您的邮箱和密码';
      
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
          case 'auth/email-already-in-use':
            errorMessage = '该邮箱已被注册';
            break;
          case 'auth/weak-password':
            errorMessage = '密码强度不足，请使用至少6位密码';
            break;
          default:
            errorMessage = error.message || '登录失败，请稍后再试';
        }
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
              {isRegistering ? '创建账户' : '欢迎使用LUCY AI'}
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
                {isRegistering && (
                  <p className="text-xs text-gray-500 mt-1">密码长度至少为6位</p>
                )}
              </div>
              
              {isRegistering && (
                <>
                  <div>
                    <input
                      type="password"
                      required
                      placeholder="请确认密码"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="请输入邀请码"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                </>
              )}

              {!isRegistering && (
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
              )}

              <button
                type="submit"
                className="w-full bg-primary text-white rounded-lg py-3 hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? '处理中...' : isRegistering ? '注册' : '登录'}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-primary text-sm hover:underline"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setSuccessMessage('');
                  }}
                >
                  {isRegistering ? '已有账户？点击登录' : '没有账户？点击注册'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

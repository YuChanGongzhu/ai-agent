import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import groupIcon from '../img/nav/group.svg';
import loginImage from '../img/login.png';
import { loginUser, registerUser, resendVerificationEmail } from '../utils/authService';

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
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const navigate = useNavigate();

  // 重新发送验证邮件
  const handleResendVerificationEmail = async () => {
    if (!email) {
      setError('请输入邮箱地址以接收验证邮件');
      return;
    }
    
    setResendingEmail(true);
    try {
      // 尝试先登录，这样我们可以获得用户对象
      await loginUser(email, password);
      // 如果代码执行到这里，说明邮箱已验证（否则 loginUser 会抛出错误）
      // 执行到这里表示用户已经完成了验证
      setIsEmailUnverified(false);
      navigate('/dashboard');
    } catch (error: any) {
      // 如果是邮箱未验证的错误，验证邮件已经在 loginUser 中自动发送了
      if (error.code === 'auth/email-not-verified') {
        setSuccessMessage('验证邮件已发送，请查收并完成验证后再登录。');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        // 如果用户不存在或密码错误，我们无法发送验证邮件
        setError('邮箱或密码错误，无法发送验证邮件');
      } else {
        setError(error.message || '发送验证邮件失败，请稍后再试');
      }
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    setIsEmailUnverified(false);

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

        try {
          console.log('开始注册用户...');
          // 注册新用户
          await registerUser(email, password);
          
          // 设置成功信息 - 不再提到文档创建，避免混淆
          setSuccessMessage('注册成功！已向您的邮箱发送验证邮件，请查收并完成验证后再登录。');
          
          // 清空注册字段
          setConfirmPassword('');
          setInviteCode('');
          
          // 切换到登录模式
          setTimeout(() => {
            setIsRegistering(false);
            setSuccessMessage('');
          }, 5000);
        } catch (regError: any) {
          // 如果是邮箱已存在，提供直接登录的提示
          if (regError.code === 'auth/email-already-in-use' || 
             (regError.message && regError.message.includes('已被注册'))) {
            setError('该邮箱已注册。您是否要直接登录？');
            // 切换到登录模式，保留邮箱
            setIsRegistering(false);
            // 不清除邮箱，便于用户直接登录
            setConfirmPassword('');
            setInviteCode('');
            setLoading(false);
            return;
          }
          
          // 其他注册错误，重新抛出
          throw regError;
        }
      } else {
        // 登录逻辑
        await loginUser(email, password);
        // 登录成功，导航到仪表盘
        navigate('/dashboard');
      }
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
          case 'auth/email-already-in-use':
            errorMessage = '该邮箱已被注册';
            // 如果用户正在注册，提示切换到登录
            if (isRegistering) {
              errorMessage += '，您可以直接登录';
              setTimeout(() => setIsRegistering(false), 2000);
            }
            break;
          case 'auth/weak-password':
            errorMessage = '密码强度不足，请使用至少6位密码';
            break;
          case 'auth/missing-permissions':
          case 'auth/insufficient-permission':
            errorMessage = '操作权限不足，请联系管理员';
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
          case 'auth/email-not-verified':
            errorMessage = '您的邮箱尚未验证。请查收邮件并完成验证后再登录。';
            setIsEmailUnverified(true); // 设置邮箱未验证状态
            break;
          case 'permission-denied':
            errorMessage = 'Firebase权限被拒绝，请联系管理员检查安全规则设置';
            // 如果是注册过程中的权限错误，给用户更详细的信息
            if (isRegistering) {
              errorMessage = '注册成功！但由于权限原因，无法创建用户文档。您仍可以验证邮箱并登录，管理员稍后可能需要手动为您创建用户档案。';
              // 这实际上是成功消息而非错误
              setSuccessMessage(errorMessage);
              setError('');
              
              // 切换到登录模式
              setTimeout(() => {
                setIsRegistering(false);
                setSuccessMessage('');
              }, 8000);
              return; // 阻止设置错误消息
            }
            break;
          case 'unavailable':
            errorMessage = 'Firebase服务不可用，请稍后再试';
            break;
          default:
            errorMessage = error.message || '登录失败，请稍后再试';
        }
      } else if (error.message) {
        // 处理自定义错误消息，比如从 registerUser 中抛出的错误
        errorMessage = error.message;
        
        // 特殊处理含有"权限"的错误消息
        if (error.message.includes('权限')) {
          errorMessage = '权限错误：操作权限不足。请联系管理员检查 Firebase 权限设置。';
        }
        
        // 特殊处理邮箱已被注册的情况
        if (error.message.includes('邮箱已被注册')) {
          // 如果用户正在注册，提示切换到登录
          if (isRegistering) {
            setTimeout(() => setIsRegistering(false), 2000);
          }
        }
        
        // 特殊处理邮箱未验证的情况
        if (error.message.includes('邮箱尚未验证')) {
          setIsEmailUnverified(true);
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
                  
                  {/* 如果是邮箱未验证错误，显示重新发送验证邮件按钮 */}
                  {isEmailUnverified && (
                    <button
                      type="button"
                      className="mt-2 text-sm text-primary hover:underline"
                      onClick={handleResendVerificationEmail}
                      disabled={resendingEmail}
                    >
                      {resendingEmail ? '发送中...' : '重新发送验证邮件'}
                    </button>
                  )}
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
                    setIsEmailUnverified(false);
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

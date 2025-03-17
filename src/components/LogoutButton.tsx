import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../auth/authService';

interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`flex items-center justify-center ${className}`}
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? (
        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-current rounded-full mr-2"></div>
      ) : null}
      <span>退出登录</span>
    </button>
  );
};

export default LogoutButton; 
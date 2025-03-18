import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../auth/supabaseConfig';
import { logoutUser } from '../auth/authService';
import { useUser } from '../context/UserContext';

import calenderSVG from '../img/nav/calender.svg';
import employeeSVG from '../img/nav/employee.svg';
import dialogSVG from '../img/nav/dialog.svg';
import taskSVG from '../img/nav/task.svg';
import dashboardSVG from '../img/nav/dashboard.svg';
import groupSVG from '../img/nav/group.svg';
import serverSVG from '../img/nav/server.svg';
import usersSVG from '../img/nav/employee.svg'; // 暂时复用员工图标

interface NavItem {
  name: string;
  icon: string;
  url: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: '仪表盘', icon: dashboardSVG, url: '/dashboard' },
  { name: '员工', icon: employeeSVG, url: '/employee' },
  { name: '对话', icon: dialogSVG, url: '/dialog' },
  { name: '任务', icon: taskSVG, url: '/task' },
  { name: '日历', icon: calenderSVG, url: '/calendar' },
  { name: '服务器', icon: serverSVG, url: '/server' },
  { name: '系统管理', icon: usersSVG, url: '/manage', adminOnly: true },
];

const NavBar: React.FC = () => {
  const findSelectedNavItem = (path: string) => {
    const currentPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const matchingItem = navItems.find(item => 
      currentPath === item.url || 
      (currentPath.startsWith(item.url) && item.url !== '/dashboard')
    );
    return matchingItem ? matchingItem.name : '仪表盘';
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(findSelectedNavItem(location.pathname));
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 使用UserContext获取用户信息和管理员状态
  const { userProfile, isAdmin } = useUser();
  const [userData, setUserData] = useState<{displayName: string | null; email: string | null}>({
    displayName: null,
    email: null
  });

  useEffect(() => {
    setSelected(findSelectedNavItem(location.pathname));
  }, [location.pathname]);

  // 不再需要嗅探用户是否为管理员，现在从上下文中获取

  // 结合认证状态和用户上下文
  useEffect(() => {
    // 订阅认证状态变化（仅用于基本登录信息）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user;
          setUserData({
            displayName: user.user_metadata?.name || user.email?.split('@')[0] || null,
            email: user.email || null
          });
        } else if (event === 'SIGNED_OUT') {
          setUserData({
            displayName: null,
            email: null
          });
        }
      }
    );

    // 初始化当前用户的基本信息（仅在上下文加载之前使用）
    const initBasicUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData({
          displayName: user.user_metadata?.name || user.email?.split('@')[0] || null,
          email: user.email || null
        });
      }
    };

    initBasicUserInfo();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 使用UserContext中的用户配置信息
  useEffect(() => {
    if (userProfile) {
      // 当用户配置信息加载完成后，优先使用用户配置中的显示名称
      setUserData(prev => ({
        ...prev,
        displayName: userProfile.display_name || prev.displayName
      }));
      
      console.log('NavBar: 从UserContext获取用户配置信息', userProfile.display_name);
    }
  }, [userProfile]);

  const handleClick = (itemName: string, url: string) => {
    setSelected(itemName);
    navigate(url);
  };

  // 处理用户退出登录
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 点击外部关闭对话框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setShowLogoutDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
      <div className={`bg-white p-2 ${isCollapsed ? 'w-[6vw]' : 'w-[12vw]'} rounded-lg shadow-lg h-screen flex flex-col transition-all duration-300 text-base`}>
        {/* Logo Section */}
        <div className="flex items-center space-x-2 mb-8">
          <img src={groupSVG} alt="LUCYAI" className="w-10 h-10" />
          {!isCollapsed && <span className="text-2xl font-semibold text-purple-600">LUCYAI</span>}
        </div>

        {/* Navigation Items */}
        <div className="flex-1">
          <div className="flex flex-col items-start space-y-2">
            {navItems
              .filter(item => !item.adminOnly || (item.adminOnly && isAdmin))
              .map((item) => (
                <div
                  key={item.name}
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-3 rounded-lg w-full
                    ${selected === item.name ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => handleClick(item.name, item.url)}
                >
                  <img src={item.icon} alt={item.name} className="w-5 h-5" />
                  {!isCollapsed && <span className="text-base font-medium">{item.name}</span>}
                </div>
              ))}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="mt-auto pt-4 border-t relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.displayName || userData.email || 'User'}`}
                alt="User"
                className="w-10 h-10 rounded-full"
              />
              {!isCollapsed && (
                <div className="max-w-[8vw] overflow-hidden">
                  <div className="text-sm font-medium truncate">
                    {userData.displayName || userData.email?.split('@')[0] || '用户'}
                  </div>
                  <div 
                    className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 truncate"
                    title={userData.email || '账号'}
                    onClick={() => setShowLogoutDialog(!showLogoutDialog)}
                  >
                    {userData.email || '账号'}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={toggleCollapse}
              className="text-gray-500 hover:text-purple-600 ml-2"
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" />
                </svg>
              )}
            </button>
          </div>

          {showLogoutDialog && !isCollapsed && (
            <div 
              ref={dialogRef}
              className="absolute bottom-full left-0 mb-2 w-30 bg-white rounded-lg shadow-lg py-2 border border-gray-200"
            >
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600"
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
  );
};

export default NavBar;

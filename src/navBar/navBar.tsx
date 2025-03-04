import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import calenderSVG from '../img/nav/calender.svg';
import employeeSVG from '../img/nav/employee.svg';
import dialogSVG from '../img/nav/dialog.svg';
import taskSVG from '../img/nav/task.svg';
import dashboardSVG from '../img/nav/dashboard.svg';
import groupSVG from '../img/nav/group.svg';

interface NavItem {
  name: string;
  icon: string;
  url: string;
}

const navItems: NavItem[] = [
  { name: '仪表盘', icon: dashboardSVG, url: '/dashboard' },
  { name: '员工', icon: employeeSVG, url: '/employee' },
  { name: '对话', icon: dialogSVG, url: '/dialog' },
  // { name: '任务', icon: taskSVG, url: '/task' },
  { name: '日历', icon: calenderSVG, url: '/calendar' },
];

const NavBar: React.FC = () => {
  const [selected, setSelected] = useState<string>('仪表盘');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const handleClick = (itemName: string, url: string) => {
    setSelected(itemName);
    navigate(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
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
      <div className="bg-white p-4 w-48 rounded-lg shadow-lg h-screen flex flex-col">
        {/* Logo Section */}
        <div className="flex items-center space-x-2 mb-8">
          <img src={groupSVG} alt="LUCYAI" className="w-8 h-8" />
          <span className="text-xl font-semibold text-purple-600">LUCYAI</span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1">
          <div className="flex flex-col items-start space-y-4">
            {navItems.map((item) => (
              <div
                key={item.name}
                className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg w-full
                  ${selected === item.name ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => handleClick(item.name, item.url)}
              >
                <img src={item.icon} alt={item.name} className="w-6 h-6" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="mt-auto pt-4 border-t relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="text-sm font-medium">admin</div>
                <div 
                  className="text-xs text-gray-500 cursor-pointer hover:text-purple-600"
                  onClick={() => setShowLogoutDialog(!showLogoutDialog)}
                >
                  账号
                </div>
              </div>
            </div>
          </div>

          {/* 退出登录对话框 */}
          {showLogoutDialog && (
            <div 
              ref={dialogRef}
              className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-lg shadow-lg py-2 border border-gray-200"
            >
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-purple-600"
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

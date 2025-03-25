import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../auth/supabaseConfig';
import { logoutUser } from '../auth/authService';
import { useUser } from '../context/UserContext';

// Import regular SVG icons
import dashboardSVG from '../img/nav/dashboard.svg';
import employeeSVG from '../img/nav/employee.svg';
import dialogSVG from '../img/nav/dialog.svg';
import systemSVG from '../img/nav/system.svg';
import taskSVG from '../img/nav/task.svg';
import calendarSVG from '../img/nav/calender.svg';
import fileSVG from '../img/nav/file.svg';
import knowledgeSVG from '../img/nav/knowledge.svg';
import wechatSVG from '../img/nav/wechat.svg';
import businessSVG from '../img/nav/business.svg';
import mpwxSVG from '../img/nav/mpwx.svg';
import videoSVG from '../img/nav/video.svg';
import friendSVG from '../img/nav/friend.svg';

// Import active SVG icons
import dashboardActiveSVG from '../img/active/dashboard.svg';
import employeeActiveSVG from '../img/active/employee.svg';
import dialogActiveSVG from '../img/active/dialog.svg';
import systemActiveSVG from '../img/active/system.svg';
import taskActiveSVG from '../img/active/task.svg';
import calendarActiveSVG from '../img/active/calender.svg';
import fileActiveSVG from '../img/active/file.svg';
import knowledgeActiveSVG from '../img/active/knowledge.svg';
import wechatActiveSVG from '../img/active/wechat.svg';
import businessActiveSVG from '../img/active/business.svg';
import mpwxActiveSVG from '../img/active/mpwx.svg';
import videoActiveSVG from '../img/active/video.svg';
import friendActiveSVG from '../img/active/friend.svg';

interface SubNavItem {
  name: string;
  url: string;
  adminOnly?: boolean;
}

interface NavItem {
  name: string;
  icon: string;
  url: string;
  adminOnly?: boolean;
  subItems?: SubNavItem[];
  expanded?: boolean;
}

interface NavItemWithIcons extends NavItem {
  activeIcon: string;
}

// Define navigation categories and items
const basicItems: NavItemWithIcons[] = [
  { name: '数据视图', icon: dashboardSVG, activeIcon: dashboardActiveSVG, url: '/dashboard' },
  { name: '员工列表', icon: employeeSVG, activeIcon: employeeActiveSVG, url: '/employee' },
  { name: '对话管理', icon: dialogSVG, activeIcon: dialogActiveSVG, url: '/dialog' },
  { name: '系统管理', icon: systemSVG, activeIcon: systemActiveSVG, url: '/manage', adminOnly: true },
];

const officeItems: NavItemWithIcons[] = [
  { name: '任务列表', icon: taskSVG, activeIcon: taskActiveSVG, url: '/task' },
  { name: '日历看板', icon: calendarSVG, activeIcon: calendarActiveSVG, url: '/calendar' },
];

const knowledgeItems: NavItemWithIcons[] = [
  { name: '文件管理', icon: fileSVG, activeIcon: fileActiveSVG, url: '/knowledge/files' },
  { name: '知识库', icon: knowledgeSVG, activeIcon: knowledgeActiveSVG, url: '/knowledge/datasets' },
];

const channelItems: NavItemWithIcons[] = [
  { name: '个人微信', icon: wechatSVG, activeIcon: wechatActiveSVG, url: '/channels/personal' },
  { name: '企业微信', icon: businessSVG, activeIcon: businessActiveSVG, url: '/channels/enterprise' },
  { name: '公众号', icon: mpwxSVG, activeIcon: mpwxActiveSVG, url: '/channels/official' },
];

const aiItems: NavItemWithIcons[] = [
  { name: '视频号直播监控', icon: videoSVG, activeIcon: videoActiveSVG, url: '/ai/video' },
  { name: '朋友圈分析', icon: friendSVG, activeIcon: friendActiveSVG, url: '/ai/legal' },
];

const NavBar: React.FC = () => {
  // Combine all navigation items for route matching
  const allNavItems: NavItemWithIcons[] = [
    ...basicItems,
    ...officeItems,
    ...knowledgeItems,
    ...channelItems,
    ...aiItems
  ];

  const findSelectedNavItem = (path: string) => {
    const currentPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // Find a matching item in all navigation categories
    const matchingItem = allNavItems.find(item => 
      currentPath === item.url || 
      (currentPath.startsWith(item.url) && item.url !== '/dashboard')
    );
    return matchingItem ? matchingItem.name : '数据视图';
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(findSelectedNavItem(location.pathname));
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
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

  const handleClick = (item: NavItem) => {
    if (item.subItems && item.subItems.length > 0) {
      // Toggle expanded state for items with sub-items
      setExpandedItems(prev => ({
        ...prev,
        [item.name]: !prev[item.name]
      }));
    } else {
      // Navigate to the item's URL for items without sub-items
      setSelected(item.name);
      navigate(item.url);
    }
  };
  
  const handleSubItemClick = (parentName: string, subItem: SubNavItem) => {
    setSelected(subItem.name);
    navigate(subItem.url);
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
      <div className={`bg-[rgba(108,93,211,1)] p-2 ${isCollapsed ? 'w-[6vw]' : 'w-[12vw]'} rounded-lg shadow-lg h-screen flex flex-col transition-all duration-300 text-base text-white`}>
        {/* Logo Section */}
        <div className="flex items-center space-x-2 mb-8 px-2">
          <img src={employeeSVG} alt="LUCYAI" className="w-8 h-8" />
          {!isCollapsed && <span className="text-2xl font-semibold text-white">LUCYAI</span>}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          {/* Basic Category */}
          {!isCollapsed && <div className="text-sm font-medium px-4 py-2">基础配置</div>}
          <div className="flex flex-col items-start space-y-1 mb-4">
            {basicItems
              .filter(item => !item.adminOnly || (item.adminOnly && isAdmin))
              .map((item) => (
                <div key={item.name} className="w-full px-2">
                  <div
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-2 rounded-lg w-full
                      ${selected === item.name ? 'bg-white text-[rgba(108,93,211,1)]' : 'text-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                    onClick={() => handleClick(item)}
                  >
                    <img src={selected === item.name ? item.activeIcon : item.icon} alt={item.name} className="w-5 h-5" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Office Category */}
          {!isCollapsed && <div className="text-sm font-medium px-4 py-2">办公事项</div>}
          <div className="flex flex-col items-start space-y-1 mb-4">
            {officeItems.map((item) => (
              <div key={item.name} className="w-full px-2">
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-2 rounded-lg w-full
                    ${selected === item.name ? 'bg-white text-[rgba(108,93,211,1)]' : 'text-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                  onClick={() => handleClick(item)}
                >
                  <img src={selected === item.name ? item.activeIcon : item.icon} alt={item.name} className="w-5 h-5" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Knowledge Category */}
          {!isCollapsed && <div className="text-sm font-medium px-4 py-2">知识库</div>}
          <div className="flex flex-col items-start space-y-1 mb-4">
            {knowledgeItems.map((item) => (
              <div key={item.name} className="w-full px-2">
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-2 rounded-lg w-full
                    ${selected === item.name ? 'bg-white text-[rgba(108,93,211,1)]' : 'text-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                  onClick={() => handleClick(item)}
                >
                  <img src={selected === item.name ? item.activeIcon : item.icon} alt={item.name} className="w-5 h-5" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Channels Category */}
          {!isCollapsed && <div className="text-sm font-medium px-4 py-2">渠道接入</div>}
          <div className="flex flex-col items-start space-y-1 mb-4">
            {channelItems.map((item) => (
              <div key={item.name} className="w-full px-2">
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-2 rounded-lg w-full
                    ${selected === item.name ? 'bg-white text-[rgba(108,93,211,1)]' : 'text-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                  onClick={() => handleClick(item)}
                >
                  <img src={selected === item.name ? item.activeIcon : item.icon} alt={item.name} className="w-5 h-5" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* AI Features Category */}
          {!isCollapsed && <div className="text-sm font-medium px-4 py-2">付费功能</div>}
          <div className="flex flex-col items-start space-y-1 mb-4">
            {aiItems.map((item) => (
              <div key={item.name} className="w-full px-2">
                <div
                  className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer p-2 rounded-lg w-full
                    ${selected === item.name ? 'bg-white text-[rgba(108,93,211,1)]' : 'text-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                  onClick={() => handleClick(item)}
                >
                  <img src={selected === item.name ? item.activeIcon : item.icon} alt={item.name} className="w-5 h-5" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="mt-auto pt-4 border-t border-white/20 relative">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.displayName || userData.email || 'User'}`}
                alt="User"
                className="w-8 h-8 rounded-full bg-white"
              />
              {!isCollapsed && (
                <div className="max-w-[10vw] overflow-hidden">
                  <div className="text-sm font-medium truncate text-white">
                    {userData.displayName || userData.email?.split('@')[0] || '用户'}
                  </div>
                  <div 
                    className="text-xs text-white/70 cursor-pointer hover:text-white truncate"
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
              className="text-white/70 hover:text-white"
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 19.5-7.5-7.5 7.5-7.5" />
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
                className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-[rgba(108,93,211,1)]"
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

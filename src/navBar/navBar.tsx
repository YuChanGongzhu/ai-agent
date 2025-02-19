import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import calenderSVG from '../img/nav/calender.svg';
import employeeSVG from '../img/nav/employee.svg';
import dialogSVG from '../img/nav/dialog.svg';
import taskSVG from '../img/nav/task.svg';
import dashboardSVG from '../img/nav/dashboard.svg';

interface NavItem {
  name: string;
  icon: string;
  url: string;
}

const navItems: NavItem[] = [
  { name: '仪表盘', icon: dashboardSVG, url: '/dashboard' },
  { name: '员工', icon: employeeSVG, url: '/employee' },
  { name: '对话', icon: dialogSVG, url: '/dialog' },
  { name: '任务', icon: taskSVG, url: '/task' },
  { name: '日历', icon: calenderSVG, url: '/calendar' },
];

const NavBar: React.FC = () => {
  const [selected, setSelected] = useState<string>('仪表盘');

  const navigate = useNavigate();

  const handleClick = (itemName: string, url: string) => {
    setSelected(itemName);
    navigate(url);
  };

  return (
      <div className="bg-white p-4 w-48 rounded-lg shadow-lg">
        <div className="flex flex-col items-start space-y-4">
          {navItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center space-x-2 cursor-pointer p-2 rounded-lg 
                ${selected === item.name ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => handleClick(item.name, item.url)}
            >
              <img src={item.icon} alt={item.name} className="w-6 h-6" />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
  );
};

export default NavBar;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonCard from './components/personCard';

type TaskStatus = '全部' | '邀请' | '预约' | '完成';

interface Task {
  id: string;
  date: string;
  title: string;
  visitorCount: number;
  tags: string[];
  isHighlighted?: boolean;
}

const tasks: Task[] = [
  { id: '1', date: '2025.02.11', title: '情人节邀请', visitorCount: 27, tags: ['营销', '活动', '邀请活动'] },
  { id: '2', date: '2025.03.08', title: '咖啡节', visitorCount: 142, tags: ['营销', '活动'] },
  { id: '3', date: '2025.04.01', title: '电商知识节', visitorCount: 47, tags: ['营销', '自由职业'] },
  { id: '4', date: '2025.03.17', title: '破势创变', visitorCount: 91, tags: ['营销', '活动'] },
  { id: '5', date: '2025.03.21', title: '出海团门诊', visitorCount: 27, tags: ['营销', '活动'] },
  { id: '6', date: '2025.11.01', title: '游戏峰会', visitorCount: 344, tags: ['学习', '社群', '游戏开发'] },
  { id: '7', date: '2025.03.03', title: '国际物流大会', visitorCount: 98, tags: ['营销', '会议'] },
  { id: '8', date: '2025.04.01', title: '家具博览会', visitorCount: 127, tags: ['二手', '创意设计'] },
  { id: '9', date: '2025.06.24', title: '茶晚大会', visitorCount: 78, tags: ['社群', '茶道'] },
  { id: '10', date: '2025.03.19', title: '卡尔世界经典音乐', visitorCount: 42, tags: ['营销', '演出'] },
  { id: '11', date: '2025.07.14', title: '《龙猫》', visitorCount: 421, tags: ['营销', '二手', '18-24岁'] }
];

const TaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TaskStatus>('全部');
  const [searchText, setSearchText] = useState('');
  const [showNewTaskOptions, setShowNewTaskOptions] = useState(false);

  const handleOptionSelect = (option: '邀请' | '预约') => {
    setShowNewTaskOptions(false);
    if (option === '邀请') {
      navigate('/task/invite');
    } else {
      console.log('选择了预约');
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative">
          <button 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
            onClick={() => setShowNewTaskOptions(!showNewTaskOptions)}
          >
            新建任务
          </button>
          
          {/* Dropdown Menu */}
          {showNewTaskOptions && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-10 min-w-[120px]">
              <button 
                className="w-full px-4 py-3 text-center text-primary hover:bg-gray-50 font-medium text-sm border-b border-gray-100"
                onClick={() => handleOptionSelect('邀请')}
              >
                邀请
              </button>
              <button 
                className="w-full px-4 py-3 text-center text-primary hover:bg-gray-50 font-medium text-sm"
                onClick={() => handleOptionSelect('预约')}
              >
                预约
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索任务"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
          全选
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 mb-6 border-b border-gray-100">
        {['全部', '邀请', '预约', '完成'].map((tab) => (
          <button
            key={tab}
            className={`pb-3 px-1 text-sm font-medium relative ${activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(tab as TaskStatus)}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <PersonCard
            key={task.id}
            date={task.date}
            title={task.title}
            visitorCount={task.visitorCount}
            tags={task.tags}
            // isHighlighted={task.id === '1'}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskPage;

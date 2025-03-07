import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskCard from './components/taskCard';

interface Person {
  id: string;
  name: string;
  avatar: string;
  role: string;
  tags?: string[];
}

const people: Person[] = [
  { id: '1', name: '不吃鱼', avatar: '/avatars/1.jpg', role: '小乐专员', tags: ['邀请'] },
  { id: '2', name: '谭萌', avatar: '/avatars/2.jpg', role: '小乐专员', tags: ['邀请'] },
  { id: '3', name: '我不吃茄子', avatar: '/avatars/3.jpg', role: '小乐专员', tags: ['邀请'] },
  { id: '4', name: '超超', avatar: '/avatars/4.jpg', role: '新人专员', tags: ['邀请'] },
  { id: '5', name: '小牛', avatar: '/avatars/5.jpg', role: '新人专员', tags: ['邀请'] },
  { id: '6', name: '不是老弟', avatar: '/avatars/6.jpg', role: '新人专员', tags: ['邀请'] },
  { id: '7', name: '娟娟...', avatar: '/avatars/7.jpg', role: '新人专员', tags: ['邀请', '预约'] },
  { id: '8', name: '布丁面包', avatar: '/avatars/8.jpg', role: '新人专员', tags: ['邀请'] },
  { id: '9', name: 'Brettom', avatar: '/avatars/9.jpg', role: '小乐专员', tags: ['邀请'] },
  { id: '10', name: 'Amber姐', avatar: '/avatars/10.jpg', role: '新人专员', tags: ['邀请'] },
];

const filterTags = [
  '小组', '为你', '高活跃力值', '专员', '新人', '高级新人', '实习生待定',
  '国内', '18-24岁', '单身', '一线城市', '社交较强的'
];

const PersonSelector: React.FC = () => {
  const navigate = useNavigate();
  const [taskName, setTaskName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const togglePerson = (id: string) => {
    setSelectedPeople(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm w-full h-[90vh]">
      {/* Header with buttons */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h2 className="text-lg font-medium">新建邀请</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/task')} 
            className="px-4 py-1.5 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            取消
          </button>
          <button 
            onClick={() => {
              console.log('发布任务:', { taskName, selectedDate, selectedTags, selectedPeople });
              navigate('/task');
            }} 
            className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            发布任务
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Task Name Input */}
        <div className="mb-4">
          <label className="block text-sm mb-2">任务名称</label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </div>

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block text-sm mb-2">选择日期</label>
          <div className="relative">
            <input
              type="date"
              className="w-full px-3 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm mb-2">人群选择</label>
          <div className="flex flex-wrap gap-2">
            {filterTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="space-y-3 overflow-y-auto h-[60vh] p-2">
        {people.map(person => (
          <TaskCard
            key={person.id}
            avatar={person.avatar}
            name={person.name}
            description={person.role}
            onDelete={() => togglePerson(person.id)}
            onMore={() => console.log('More options for:', person.name)}
          />
        ))}
      </div>

    </div>
  );
};

export default PersonSelector;
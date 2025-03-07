import React from 'react';

interface TaskCardProps {
  avatar: string;
  name: string;
  description?: string;
  onDelete?: () => void;
  onMore?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  avatar,
  name,
  description = '小乐专员',
  onDelete,
  onMore
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4">
      {/* Left side - Avatar and Name */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* Purple accent bar */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full" />
          {/* Avatar */}
          <img 
            src={avatar} 
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <button 
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button 
          onClick={onMore}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
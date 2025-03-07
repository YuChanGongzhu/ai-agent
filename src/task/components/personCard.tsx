import React from 'react';

interface PersonCardProps {
  date: string;
  title: string;
  visitorCount: number;
  tags?: string[];
  isHighlighted?: boolean;
}

const PersonCard: React.FC<PersonCardProps> = ({ 
  date, 
  title, 
  visitorCount, 
  tags = ['营销', '活动'], 
  isHighlighted = false 
}) => {
  return (
    <div className={`relative bg-white rounded-lg shadow-sm w-[380px] overflow-hidden ${isHighlighted ? 'ring-2 ring-primary' : ''}`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${isHighlighted ? 'bg-yellow-400' : 'bg-primary'}`} />
      
      <div className="p-3">
        {/* Header with date and menu */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">{date}</span>
          <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="2" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="14" r="1.5" />
            </svg>
          </button>
        </div>
        
        {/* Title */}
        <h3 className="text-base font-medium text-gray-900 mb-2">{title}</h3>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span 
              key={index} 
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        
        {/* Visitor count */}
        <div className="text-sm text-gray-500">
          来访人数: {visitorCount}
        </div>
      </div>
    </div>
  );
};

export default PersonCard;

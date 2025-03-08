import React from 'react';

interface Tag {
  text: string;
}

interface UserProfileProps {
  tags: Tag[];
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ tags, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg p-4 ${className} h-[20vh] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">用户标签</h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <div
              key={index}
              className="px-3 py-1 rounded-full border border-purple-500 text-purple-500 text-sm"
            >
              {tag.text}
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-sm">暂无用户标签</div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

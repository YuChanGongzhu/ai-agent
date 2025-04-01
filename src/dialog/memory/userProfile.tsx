import React from 'react';

interface Tag {
  text: string;
  category?: string;
}

interface UserProfileProps {
  tags: Tag[];
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ tags, className = '' }) => {
  // Group tags by category
  const groupedTags: Record<string, Tag[]> = {};
  
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (
        typeof tag === 'object' && 
        tag !== null && 
        typeof tag.text === 'string' && 
        tag.text !== "未知" && 
        tag.text !== "不适用" && 
        !tag.text.includes("未知") && 
        !tag.text.includes("不适用")
      ) {
        // Extract just the value part if the text contains a key-value format
        let displayText = tag.text;
        if (displayText.includes(': ')) {
          displayText = displayText.split(': ')[1];
        }
        
        // Skip if the extracted value is empty, 未知 or 不适用
        if (!displayText || displayText === "未知" || displayText === "不适用") {
          return;
        }
        
        const category = tag.category || '其他';
        if (!groupedTags[category]) {
          groupedTags[category] = [];
        }
        
        // Create a new tag with the processed text
        groupedTags[category].push({
          ...tag,
          text: displayText
        });
      }
    });
  }

  // Define category order and colors
  const categoryConfig: Record<string, { title: string, color: string }> = {
    '价值观与兴趣': { title: '价值观与兴趣', color: 'purple' },
    '互动与认知': { title: '互动与认知', color: 'blue' },
    '购买决策': { title: '购买决策', color: 'green' },
    '客户关系': { title: '客户关系', color: 'orange' },
    '特殊来源': { title: '特殊来源', color: 'red' },
    '其他': { title: '其他', color: 'gray' }
  };

  // Order categories
  const orderedCategories = [
    '价值观与兴趣',
    '互动与认知',
    '购买决策',
    '客户关系',
    '特殊来源',
    '其他'
  ].filter(category => groupedTags[category] && groupedTags[category].length > 0);

  return (
    <div className={`bg-white rounded-lg p-4 ${className} h-[20vh] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">用户标签</h2>
      </div>
      
      {orderedCategories.length > 0 ? (
        <div className="space-y-3">
          {orderedCategories.map(category => (
            <div key={category} className="mb-2">
              <h3 className="text-sm font-medium mb-1 text-gray-700">{categoryConfig[category].title}</h3>
              <div className="flex flex-wrap gap-2">
                {groupedTags[category].map((tag, index) => {
                  const colorClass = `border-${categoryConfig[category].color}-500 text-${categoryConfig[category].color}-500`;
                  return (
                    <div
                      key={`${category}-${index}`}
                      className={`px-3 py-1 rounded-full border text-sm ${colorClass}`}
                    >
                      {tag.text}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-sm">暂无标签</div>
      )}
    </div>
  );
};

export default UserProfile;

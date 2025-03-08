import React from 'react';

interface Memory {
  date: string;
  content: string;
}

interface LongtimeMemoryProps {
  memories: Memory[];
  className?: string;
}

const LongtimeMemory: React.FC<LongtimeMemoryProps> = ({ memories, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg p-4 border ${className} h-[35vh] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">对话总结</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <span className="text-xl">...</span>
        </button>
      </div>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[6px] top-2 bottom-2 w-[2px] bg-purple-300"></div>
        
        {/* Memory items */}
        <div className="space-y-6">
          {memories.length > 0 ? (
            memories.map((memory, index) => (
              <div key={index} className="relative pl-6">
                {/* Circle dot */}
                <div className="absolute left-0 top-2 w-[14px] h-[14px] rounded-full border-2 border-purple-500 bg-white"></div>
                
                {/* Content */}
                <div className="text-sm">
                  <div className="text-gray-400 mb-1">{memory.date}</div>
                  <div className="text-gray-600">{memory.content}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm pl-6">暂无对话记录</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LongtimeMemory;

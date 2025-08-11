import React from "react";

interface Memory {
  date: string;
  content: string;
}

interface LongtimeMemoryProps {
  memories: Memory[];
  className?: string;
}

const LongtimeMemory: React.FC<LongtimeMemoryProps> = ({ memories, className = "" }) => {
  return (
    <div className={`${className} `}>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[6px] top-2 bottom-2 w-[2px] bg-[#D477E1]"></div>

        {/* Memory items */}
        <div className="space-y-6">
          {memories.length > 0 ? (
            memories.map((memory, index) => (
              <div key={index} className="relative pl-6">
                {/* Circle dot */}
                <div className="absolute left-0 top-2 w-[14px] h-[14px] rounded-full border-2 border-[#D477E1] bg-white"></div>

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

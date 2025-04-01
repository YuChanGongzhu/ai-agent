import React from 'react';

interface TokenConsumeProps {}

const TokenConsume: React.FC<TokenConsumeProps> = () => {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 
        className="text-xl font-medium mb-6 px-3 py-2" 
        style={{ color: 'rgba(108, 93, 211, 1)' }}
      >
        Token消耗逻辑
      </h2>
      
      <div className="relative px-4 py-2">
        {/* First row */}
        <div className="flex justify-between mb-6">
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(73, 55, 189, 1)' }}>
              客户输入 & 开始处理
            </p>
            <p className="text-center text-sm text-gray-500">0-20tokens</p>
          </div>
          
          <div className="flex items-center mx-1">
            <svg width="30" height="20" viewBox="0 0 30 20">
              <path 
                d="M0 10h25m-7-7l7 7-7 7" 
                stroke="rgba(73, 55, 189, 1)" 
                strokeWidth="3" 
                fill="none"
              />
            </svg>
          </div>
          
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              对话阶段判断
            </p>
            <p className="text-center text-sm text-gray-500">10-50tokens</p>
          </div>
        </div>
        
        {/* Right arrow down from 对话阶段判断 to 意图识别 */}
        <div className="absolute right-[8.5rem] top-[5rem]" style={{ zIndex: 10 }}>
          <svg width="20" height="35" viewBox="0 0 20 60">
            <path 
              d="M10 0v45m-7-7l7 7 7-7" 
              stroke="rgba(108, 93, 211, 1)" 
              strokeWidth="3" 
              fill="none"
            />
          </svg>
        </div>
        
        {/* Second row */}
        <div className="flex justify-between mb-6">
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              需求明确
            </p>
            <p className="text-center text-sm text-gray-500">1K-2Ktokens</p>
          </div>
          
          <div className="flex items-center mx-1">
            <svg width="30" height="20" viewBox="0 0 30 20">
              <path 
                d="M25 10H0m7-7l-7 7 7 7" 
                stroke="rgba(108, 93, 211, 1)" 
                strokeWidth="2" 
                fill="none"
              />
            </svg>
          </div>
          
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              意图识别
            </p>
            <p className="text-center text-sm text-gray-500">2K-3Ktokens</p>
          </div>
        </div>
        
        {/* Left arrow down from 需求明确 to 知识检索 */}
        <div className="absolute left-[8.5rem] top-[11rem]" style={{ zIndex: 10 }}>
          <svg width="20" height="35" viewBox="0 0 20 60">
            <path 
              d="M10 0v45m-7-7l7 7 7-7" 
              stroke="rgba(108, 93, 211, 1)" 
              strokeWidth="3" 
              fill="none"
            />
          </svg>
        </div>
        
        {/* Third row */}
        <div className="flex justify-between mb-6">
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              知识检索
            </p>
            <p className="text-center text-sm text-gray-500">1K-2Ktokens</p>
          </div>
          
          <div className="flex items-center mx-1">
            <svg width="30" height="20" viewBox="0 0 30 20">
              <path 
                d="M0 10h25m-7-7l7 7-7 7" 
                stroke="rgba(108, 93, 211, 1)" 
                strokeWidth="2" 
                fill="none"
              />
            </svg>
          </div>
          
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              条件判断/策略
            </p>
            <p className="text-center text-sm text-gray-500">500-1Ktokens</p>
          </div>
        </div>
        
        {/* Right arrow down from 条件判断/策略 to 信息整合 */}
        <div className="absolute right-[8.5rem] top-[17rem]" style={{ zIndex: 10 }}>
          <svg width="20" height="35" viewBox="0 0 20 60">
            <path 
              d="M10 0v45m-7-7l7 7 7-7" 
              stroke="rgba(108, 93, 211, 1)" 
              strokeWidth="3" 
              fill="none"
            />
          </svg>
        </div>
        
        {/* Fourth row */}
        <div className="flex justify-between mb-8">
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              最终回复润色
            </p>
            <p className="text-center text-sm text-gray-500">2K-2.5Ktokens</p>
          </div>
          
          <div className="flex items-center mx-1">
            <svg width="30" height="20" viewBox="0 0 30 20">
              <path 
                d="M25 10H0m7-7l-7 7 7 7" 
                stroke="rgba(108, 93, 211, 1)" 
                strokeWidth="2" 
                fill="none"
              />
            </svg>
          </div>
          
          <div className="w-5/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(108, 93, 211, 1)' }}>
              信息整合
            </p>
            <p className="text-center text-sm text-gray-500">2K-3Ktokens</p>
          </div>
        </div>
        
        {/* Left arrow down from 最终回复润色 to AI输出 & 回复给客户 */}
        <div className="absolute left-[8.5rem] top-[23rem]" style={{ zIndex: 10 }}>
          <svg width="20" height="35" viewBox="0 0 20 60">
            <path 
              d="M10 0v45m-7-7l7 7 7-7" 
              stroke="rgba(73, 55, 189, 1)" 
              strokeWidth="4" 
              fill="none"
            />
          </svg>
        </div>
        
        {/* Total row */}
        <div className="flex justify-center">
          <div className="w-10/12 rounded-lg p-3" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
            <p className="text-center font-medium mb-1" style={{ color: 'rgba(73, 55, 189, 1)' }}>
              AI输出 & 回复给客户
            </p>
            <p className="text-center text-sm text-gray-500">
              2K+3K+2K+1K+2.5K+3K 
              <span style={{ color: 'rgba(108, 93, 211, 1)' }}> = 13.5K Tokens</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenConsume;
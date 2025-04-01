import React from 'react';
import wxIcon from '../../img/wx-purple.svg';
import wxWorkIcon from '../../img/wx-work-purple.svg';

interface ChargeNavProps {
  version: string;
  onUpgrade?: () => void;
  currentFunctionCount: number;
  maxFunctionCount: number;
  currentAPICount: number;
  maxAPICount: number;
  onAddNew?: () => void;
  tokenBalance: number;
}

const ChargeNav: React.FC<ChargeNavProps> = ({
  version = 'AIR',
  onUpgrade,
  currentFunctionCount = 1,
  maxFunctionCount = 1,
  currentAPICount = 0,
  maxAPICount = 0,
  onAddNew,
  tokenBalance = 0,
}) => {
  return (
    <>
    <h2 className="text-xl font-medium px-6 pt-4 pb-2 text-gray-700">充值中心</h2>
      
      <div className="flex flex-wrap rounded-lg p-4 mx-4 mb-4" style={{ backgroundColor: 'rgba(108, 93, 211, 0.1)' }}>
        {/* Left Section - Version */}
        <div className="flex-1 flex flex-col items-start p-2 border-r border-gray-200">
          <p className="text-sm text-gray-500 mb-1">您当前使用的AI版本</p>
          <div className="flex items-center">
            <span className="text-indigo-600 font-bold text-4xl mr-2">{version}</span>
            <button 
              onClick={onUpgrade}
              className="px-3 py-1 border border-indigo-600 text-indigo-600 rounded-md text-sm hover:bg-indigo-50 transition-colors"
            >
              升级
            </button>
          </div>
        </div>

        {/* Middle Section - Usage Stats */}
        <div className="flex-1 flex flex-col items-start p-2 border-r border-gray-200">
          <p className="text-sm text-gray-500 mb-1">您当前的绑定的账号数量</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
              <img src={wxIcon} alt="WeChat Pay" width="20" height="20" />
              </div>
              <span className="text-indigo-600 font-medium">
                {currentFunctionCount}/{maxFunctionCount}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                <img src={wxWorkIcon} alt="WeChat Work" width="20" height="20" />
              </div>
              <span className="text-indigo-600 font-medium">
                {currentAPICount}/{maxAPICount}
              </span>
            </div>

            <button 
              onClick={onAddNew}
              className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-md text-sm hover:bg-indigo-200 transition-colors"
            >
              新增
            </button>
          </div>
        </div>

        {/* Right Section - Token Balance */}
        <div className="flex-1 flex flex-col items-start p-2">
          <p className="text-sm text-gray-500 mb-1">您当前的账户TOKENS余额</p>
          <div className="flex items-center">
            <span className="text-4xl font-bold text-indigo-600 mr-2">{tokenBalance}</span>
            <span className="text-gray-400 text-xs self-end mb-1">tokens</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChargeNav;
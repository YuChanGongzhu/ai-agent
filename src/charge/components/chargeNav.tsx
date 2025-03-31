import React from 'react';

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
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md">
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-1.008c-.56.23-1.064.414-1.264.471-.434.125-.904.155-1.302.155-.21 0-.41-.02-.6-.056-.265-.052-.57-.207-.75-.422-.165-.195-.3-.488-.3-.83 0-.423.23-.818.49-1.087.147-.15.334-.268.53-.37.273-.144.52-.252.683-.314C2.497 11.598 2 9.84 2 8c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9a1 1 0 11-2 0 1 1 0 012 0zm3 1a1 1 0 100-2 1 1 0 000 2zm3-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-indigo-600 font-medium">
                {currentFunctionCount}/{maxFunctionCount}
              </span>
            </div>
            
            <div className="flex items-center">
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
                </svg>
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
    </div>
  );
};

export default ChargeNav;
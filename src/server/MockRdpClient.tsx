import React from 'react';

interface MockRdpClientProps {
  serverIp: string;
  serverName: string;
  onDisconnect: () => void;
}

/**
 * 模拟RDP客户端组件
 * 当Guacamole未配置或出现错误时，提供一个模拟的远程桌面界面
 */
const MockRdpClient: React.FC<MockRdpClientProps> = ({ 
  serverIp, 
  serverName, 
  onDisconnect 
}) => {
  // 模拟Windows桌面图标
  const desktopIcons = [
    { name: '此电脑', icon: 'computer' },
    { name: '回收站', icon: 'recycle-bin' },
    { name: 'Microsoft Edge', icon: 'edge' },
    { name: '文件资源管理器', icon: 'folder' },
    { name: '设置', icon: 'settings' }
  ];
  
  return (
    <div className="flex flex-col h-full bg-[#0078D7] overflow-hidden">
      {/* 模拟的Windows桌面 */}
      <div className="flex-1 p-4 relative">
        {/* 桌面图标 */}
        <div className="grid grid-cols-1 gap-y-6">
          {desktopIcons.map((icon, index) => (
            <div key={index} className="flex flex-col items-center w-24 cursor-pointer">
              <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                {icon.icon === 'computer' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {icon.icon === 'recycle-bin' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                {icon.icon === 'edge' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                )}
                {icon.icon === 'folder' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                )}
                {icon.icon === 'settings' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <span className="mt-1 text-white text-xs text-center">{icon.name}</span>
            </div>
          ))}
        </div>
        
        {/* 模拟对话框 */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-100 rounded-md shadow-xl w-96">
          <div className="bg-[#0078D7] text-white px-4 py-2 rounded-t-md flex justify-between items-center">
            <span>Windows 安全</span>
            <div className="flex space-x-2">
              <button className="focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <button className="focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-500 p-2 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Guacamole未配置</h3>
                <p className="text-sm text-gray-600">这是一个模拟的Windows远程桌面界面</p>
              </div>
            </div>
            <div className="bg-gray-200 p-4 rounded mb-4">
              <p>当前连接信息:</p>
              <ul className="text-sm">
                <li><strong>服务器:</strong> {serverName} ({serverIp})</li>
              </ul>
            </div>
            <p className="text-sm mb-4">
              请按照文档配置Apache Guacamole服务器，以启用真实的远程桌面功能。
            </p>
            <div className="flex justify-end">
              <button 
                onClick={onDisconnect}
                className="bg-[#0078D7] hover:bg-blue-700 text-white font-medium py-1 px-4 rounded"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 模拟的任务栏 */}
      <div className="bg-gray-800 h-10 flex items-center px-2">
        <button className="text-white p-1 rounded hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="ml-2 text-white text-xs">
          开始
        </div>
        <div className="flex-1"></div>
        <div className="text-white text-xs mx-2">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default MockRdpClient; 
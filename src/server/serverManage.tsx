import React, { useState, useEffect } from 'react';
import { guacamoleService } from '../utils/guacamoleService';

interface WindowsServer {
  ip: string;
  name: string;
}

export const ServerManage: React.FC = () => {
  const [servers, setServers] = useState<WindowsServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [serverToConnect, setServerToConnect] = useState<WindowsServer | null>(null);

  useEffect(() => {
    // 从环境变量获取服务器列表和凭据
    const serverIPs = process.env.REACT_APP_WINDOWS_SERVER_IPS?.split(',') || [];
    const serverNames = process.env.REACT_APP_WINDOWS_SERVER_NAMES?.split(',') || [];
    
    // 创建服务器列表
    const serverList: WindowsServer[] = serverIPs.map((ip, index) => ({
      ip: ip.trim(),
      name: (serverNames[index] || `服务器 ${index + 1}`).trim()
    }));

    setServers(serverList);
    setLoading(false);

    if (serverList.length === 0) {
      setError('未找到服务器配置。请检查环境变量设置。');
    }
  }, []);

  const initiateConnection = (ip: string) => {
    const server = servers.find(s => s.ip === ip);
    if (server) {
      setServerToConnect(server);
      setShowPasswordDialog(true);
    }
  };

  const connectToServerWithPassword = async () => {
    if (!serverToConnect) return;
    
    setShowPasswordDialog(false);
    setSelectedServer(serverToConnect.ip);
    setConnecting(true);
    setConnectionError(null);
    setConnectionUrl(null);
    
    console.log(`尝试连接到服务器: ${serverToConnect.ip}`);
    
    try {
      // 检查Guacamole URL是否已配置
      const guacamoleUrl = process.env.GUACAMOLE_URL;
      console.log(process.env);
      console.log(`Guacamole URL: ${guacamoleUrl}`);

      
      if (!guacamoleUrl) {
        // 没有配置Guacamole，抛出错误
        throw new Error('未配置Guacamole URL，无法连接到远程服务器');
      }
      
      // 验证Guacamole认证
      console.log('开始Guacamole认证...');
      const authenticated = await guacamoleService.authenticate();
      console.log(`Guacamole认证结果: ${authenticated}`);
      
      if (!authenticated) {
        throw new Error('连接到Guacamole服务器失败，无法进行认证');
      }
      
      // 获取或创建连接，传入密码
      console.log(`尝试获取服务器连接ID: ${serverToConnect.name} (${serverToConnect.ip})`);
      const connectionId = await guacamoleService.getConnectionForServer(
        serverToConnect.ip, 
        serverToConnect.name,
        password
      );
      console.log(`获取到连接ID: ${connectionId}`);
      
      if (!connectionId) {
        // 如果没有获取到连接ID，可能是密码错误
        throw new Error(`未能创建到服务器 ${serverToConnect.name} 的连接，可能是密码错误`);
      }
      
      // 测试连接是否可用（这里可以添加一个简单的测试，但我们先跳过）
      
      // 获取连接URL
      console.log(`生成客户端URL，连接ID: ${connectionId}`);
      const url = guacamoleService.getClientUrl(connectionId);
      console.log(`生成的客户端URL: ${url}`);
      
      if (!url) {
        throw new Error('生成连接URL失败');
      }
      
      setConnectionUrl(url);
      // 清除密码
      setPassword('');
    } catch (err) {
      console.error('连接到Windows服务器时出错:', err);
      const errorMessage = err instanceof Error ? err.message : '连接失败，请稍后重试';
      setConnectionError(errorMessage);
      
      // 如果错误信息包含"密码错误"，显示密码输入对话框
      if (errorMessage.includes('密码错误') || errorMessage.includes('未能创建')) {
        // 延迟一点显示密码对话框，让用户先看到错误信息
        setTimeout(() => {
          setShowPasswordDialog(true);
        }, 1500);
      }
    } finally {
      setConnecting(false);
    }
  };

  const closeConnection = () => {
    setSelectedServer(null);
    setConnectionUrl(null);
    setConnectionError(null);
    setServerToConnect(null);
    setPassword('');
    setShowPasswordDialog(false);
  };

  const cancelPasswordDialog = () => {
    setShowPasswordDialog(false);
    setServerToConnect(null);
    setPassword('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 密码输入对话框 */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">输入Windows密码</h3>
            <p className="text-gray-600 mb-4">
              请输入服务器 {serverToConnect?.name} ({serverToConnect?.ip}) 的Administrator密码
            </p>
            {connectionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">上次连接失败: {connectionError}</p>
                <p className="text-sm mt-1">请重新输入密码尝试</p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="输入密码"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password) {
                    connectToServerWithPassword();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelPasswordDialog}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                取消
              </button>
              <button
                onClick={connectToServerWithPassword}
                disabled={!password}
                className={`font-bold py-2 px-4 rounded ${
                  password ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-300 text-gray-100 cursor-not-allowed'
                }`}
              >
                连接
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Windows 云服务器管理</h1>
        <p className="text-gray-600">选择一台服务器进行远程桌面连接</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {selectedServer ? (
        <div className="bg-white rounded-lg shadow-lg p-4 h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              远程桌面 - {servers.find(s => s.ip === selectedServer)?.name || selectedServer}
            </h2>
            <button
              onClick={closeConnection}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
            >
              断开连接
            </button>
          </div>
          
          <div className="relative h-full w-full border border-gray-300 rounded">
            {connecting ? (
              <div className="flex items-center justify-center h-full">
                <div>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">正在连接到Windows服务器...</p>
                </div>
              </div>
            ) : connectionError ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xl font-semibold text-red-600 mt-4">连接错误</p>
                <p className="text-gray-600 mt-2 text-center">{connectionError}</p>
                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={() => initiateConnection(selectedServer)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded"
                  >
                    重试连接
                  </button>
                </div>
              </div>
            ) : connectionUrl ? (
              <div className="relative h-full w-full">
                <div className="mb-2 p-2 bg-blue-100 rounded">
                  <p className="text-sm text-blue-800">连接URL: {connectionUrl}</p>
                </div>
                <iframe
                  src={connectionUrl}
                  className="w-full h-[90%]"
                  title="Remote Desktop"
                  allow="clipboard-read; clipboard-write"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  onLoad={() => console.log('iframe 加载完成')}
                  onError={(e) => console.error('iframe 加载错误', e)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600">正在准备连接...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((server) => (
            <div
              key={server.ip}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => initiateConnection(server.ip)}
            >
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-14z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-800">{server.name}</h3>
              </div>
              <p className="text-gray-600">{server.ip}</p>
              <button
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  initiateConnection(server.ip);
                }}
              >
                连接
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServerManage; 
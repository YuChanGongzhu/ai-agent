import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { guacamoleService } from '../utils/guacamoleService';
import { getUserServers, assignServerToUser, removeServerFromUser } from '../api/nacos';

interface WindowsServer {
  id: string;
  ip: string;
  name: string;
  description?: string;
}

export const ServerManage: React.FC = () => {
  const navigate = useNavigate();
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
  // 添加表单相关状态
  const [showAddServerForm, setShowAddServerForm] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>('');
  const [newServerIp, setNewServerIp] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [username, setUsername] = useState<string>(''); // 当前用户名，从登录信息获取

  useEffect(() => {
    // 检查用户是否已登录
    const userStr = localStorage.getItem('user');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!userStr || !isAuthenticated) {
      // 用户未登录，重定向到登录页面
      navigate('/login', { state: { message: '请先登录以访问服务器管理页面' } });
      return;
    }
    
    // 获取当前用户名
    try {
      const userData = JSON.parse(userStr);
      const currentUser = userData.username;
      
      if (!currentUser) {
        // 无效的用户数据，重定向到登录页面
        navigate('/login', { state: { message: '无效的用户信息，请重新登录' } });
        return;
      }
      
      setUsername(currentUser);
      loadServers(currentUser);
    } catch (e) {
      console.error('解析用户数据失败:', e);
      navigate('/login', { state: { message: '用户会话无效，请重新登录' } });
    }
  }, [navigate]);

  const loadServers = async (currentUser: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 从配置中心获取服务器列表
      const userServers = await getUserServers(currentUser);
      
      if (userServers && userServers.length > 0) {
        setServers(userServers);
      } else {
        // 如果配置中心没有数据，尝试从环境变量获取（保持向后兼容）
        const serverIPs = process.env.REACT_APP_WINDOWS_SERVER_IPS?.split(',') || [];
        const serverNames = process.env.REACT_APP_WINDOWS_SERVER_NAMES?.split(',') || [];
        
        // 创建服务器列表
        const serverList: WindowsServer[] = serverIPs.map((ip, index) => ({
          id: `server-${index + 1}`,
          ip: ip.trim(),
          name: (serverNames[index] || `服务器 ${index + 1}`).trim(),
          description: `Windows服务器 ${index + 1}`
        }));

        setServers(serverList);
      }
    } catch (err) {
      console.error('加载服务器列表时出错:', err);
      setError('无法加载服务器列表，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

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
    
    let connectionId: string | null = null;
    
    try {
      // 检查Guacamole URL是否已配置
      const guacamoleUrl = process.env.REACT_APP_GUACAMOLE_URL;
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
      connectionId = await guacamoleService.getConnectionForServer(
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
      
      // 如果已经创建了连接但连接失败，不需要在这里删除连接
      // 因为在GuacamoleService.getConnectionForServer中已经实现了自动删除和重建连接的功能
      
      // 如果错误信息包含"密码错误"或"未能创建"，显示密码输入对话框
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
    // 如果有选中的服务器，尝试删除对应的连接
    if (selectedServer) {
      const server = servers.find(s => s.ip === selectedServer);
      if (server) {
        // 异步删除连接，不阻塞UI
        (async () => {
          try {
            console.log(`断开连接，尝试删除服务器 ${server.name} 的连接`);
            // 查找连接ID
            const connectionId = await guacamoleService.findConnectionByName(server.name);
            if (connectionId) {
              console.log(`找到连接ID: ${connectionId}，准备删除`);
              const deleted = await guacamoleService.deleteConnection(connectionId);
              console.log(`删除连接结果: ${deleted ? '成功' : '失败'}`);
            } else {
              console.log(`未找到名为 ${server.name} 的连接，无需删除`);
            }
          } catch (error) {
            console.error('删除连接时出错:', error);
          }
        })();
      }
    }
    
    // 重置状态
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

  // 添加服务器
  const handleAddServer = async () => {
    // 验证表单
    if (!newServerName.trim()) {
      setFormError('服务器名称不能为空');
      return;
    }
    
    if (!newServerIp.trim()) {
      setFormError('服务器IP不能为空');
      return;
    }
    
    // 验证IP格式
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(newServerIp.trim())) {
      setFormError('请输入有效的IP地址');
      return;
    }
    
    // 检查IP是否已存在
    if (servers.some(server => server.ip === newServerIp.trim())) {
      setFormError('该IP地址已存在');
      return;
    }
    
    setUpdating(true);
    setFormError(null);
    
    try {
      // 创建新服务器对象
      const newServer: WindowsServer = {
        id: `server-${Date.now()}`, // 生成唯一ID
        name: newServerName.trim(),
        ip: newServerIp.trim(),
        description: `Windows服务器 - ${newServerName.trim()}`
      };
      
      // 添加到配置中心
      const success = await assignServerToUser(username, newServer);
      
      if (success) {
        // 更新本地状态
        setServers(prevServers => [...prevServers, newServer]);
        setShowAddServerForm(false);
        setNewServerName('');
        setNewServerIp('');
      } else {
        setFormError('更新配置失败，请稍后重试');
      }
    } catch (err) {
      console.error('添加服务器时出错:', err);
      setFormError('添加服务器时出错，请稍后重试');
    } finally {
      setUpdating(false);
    }
  };

  // 删除服务器
  const handleDeleteServer = async (serverId: string) => {
    if (!window.confirm('确定要删除此服务器吗？')) {
      return;
    }
    
    setUpdating(true);
    
    try {
      // 从配置中心删除
      const success = await removeServerFromUser(username, serverId);
      
      if (success) {
        // 更新本地状态
        setServers(prevServers => prevServers.filter(server => server.id !== serverId));
      } else {
        setError('删除服务器失败，请稍后重试');
      }
    } catch (err) {
      console.error('删除服务器时出错:', err);
      setError('删除服务器时出错，请稍后重试');
    } finally {
      setUpdating(false);
    }
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

      {/* 添加服务器表单对话框 */}
      {showAddServerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">添加Windows服务器</h3>
            
            {formError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">{formError}</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serverName">
                服务器名称
              </label>
              <input
                id="serverName"
                type="text"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="输入服务器名称"
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serverIp">
                服务器IP地址
              </label>
              <input
                id="serverIp"
                type="text"
                value={newServerIp}
                onChange={(e) => setNewServerIp(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="例如: 192.168.1.100"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowAddServerForm(false);
                  setNewServerName('');
                  setNewServerIp('');
                  setFormError(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                取消
              </button>
              <button
                onClick={handleAddServer}
                disabled={updating}
                className={`font-bold py-2 px-4 rounded ${
                  updating ? 'bg-purple-300 text-gray-100 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {updating ? '添加中...' : '添加服务器'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Windows 云服务器管理</h1>
          <p className="text-gray-600">选择一台服务器进行远程桌面连接</p>
        </div>
        <button
          onClick={() => setShowAddServerForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          添加服务器
        </button>
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
          {servers.length > 0 ? (
            servers.map((server) => (
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
                <div className="mt-4 flex space-x-2">
                  <button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateConnection(server.ip);
                    }}
                  >
                    连接
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteServer(server.id);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 bg-gray-100 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-xl text-gray-600 mt-4">还没有添加服务器</p>
              <button
                onClick={() => setShowAddServerForm(true)}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                添加服务器
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerManage; 
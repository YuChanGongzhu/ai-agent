import React, { useState, useEffect } from 'react';
import { tencentCloudService, LighthouseInstance, SUPPORTED_REGIONS, RegionInfo } from '../api/tencent_cloud';
import { useUser } from '../context/UserContext'; // 导入useUser钩子

interface WindowsServer {
  ip: string;
  name: string;
  instanceId?: string;
  osName?: string;
  status?: string;
  region?: string;
}

export const ServerManage: React.FC = () => {
  const [regionServers, setRegionServers] = useState<Map<string, WindowsServer[]>>(new Map());
  const [filteredRegionServers, setFilteredRegionServers] = useState<Map<string, WindowsServer[]>>(new Map());
  const [selectedRegion, setSelectedRegion] = useState<string>(SUPPORTED_REGIONS[0].id);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverToConnect, setServerToConnect] = useState<WindowsServer | null>(null);
  
  // 使用UserContext提供的用户信息
  const { userProfile, isAdmin, isLoading: userLoading, email } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 等待用户上下文加载完成
        if (userLoading) {
          return; // 用户数据加载中，等待
        }

        // 获取所有地域的服务器列表
        console.log('正在从腾讯云API获取所有地域的服务器列表...');
        await fetchAllRegionInstances();
      } catch (err) {
        console.error('获取服务器列表时出错:', err);
        setError(err instanceof Error ? err.message : '获取服务器列表失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userLoading]); // 依赖于userLoading

  // 根据用户权限过滤服务器列表
  useEffect(() => {
    if (regionServers.size === 0) return;

    const newFilteredServers = new Map<string, WindowsServer[]>();
    
    regionServers.forEach((servers, regionId) => {
      if (isAdmin) {
        // 管理员可以看到所有服务器
        newFilteredServers.set(regionId, servers);
      } else if (email) {
        // 普通用户只能看到名称包含其邮箱的服务器
        const userEmailParts = email.split('@')[0].toLowerCase();
        const filteredServers = servers.filter(server => 
          server.name.toLowerCase().includes(userEmailParts)
        );
        newFilteredServers.set(regionId, filteredServers);
      } else {
        // 没有邮箱的用户不能看到任何服务器
        newFilteredServers.set(regionId, []);
      }
    });
    
    setFilteredRegionServers(newFilteredServers);
    
  }, [regionServers, isAdmin, email]);

  const fetchAllRegionInstances = async () => {
    try {
      const instancesByRegion = await tencentCloudService.getAllRegionInstances();
      const serversByRegion = new Map<string, WindowsServer[]>();
      
      instancesByRegion.forEach((instances, regionId) => {
        const servers: WindowsServer[] = instances.map((instance: LighthouseInstance) => ({
          ip: instance.PublicAddresses[0] || instance.PrivateAddresses[0] || '',
          name: instance.InstanceName,
          instanceId: instance.InstanceId,
          osName: instance.OsName,
          status: instance.InstanceState,
          region: instance.Region
        }));
        
        serversByRegion.set(regionId, servers);
      });
      
      setRegionServers(serversByRegion);
      
      let totalCount = 0;
      serversByRegion.forEach(servers => {
        totalCount += servers.length;
      });
      
      console.log(`成功获取 ${totalCount} 台腾讯云服务器实例，分布在 ${serversByRegion.size} 个地域`);
    } catch (error) {
      console.error('获取腾讯云服务器列表失败:', error);
      throw error;
    }
  };

  const connectToVnc = async (server: WindowsServer) => {
    if (!server.instanceId) {
      setConnectionError('无法连接VNC，缺少实例ID');
      return;
    }
    
    if (server.status !== 'RUNNING') {
      setConnectionError(`无法连接VNC，实例当前状态为: ${server.status || '未知'}`);
      return;
    }
    
    if (!server.region) {
      setConnectionError('无法连接VNC，缺少实例所在地域信息');
      return;
    }
    
    setSelectedServer(server.ip);
    setServerToConnect(server);
    setConnecting(true);
    setConnectionError(null);
    setConnectionUrl(null);
    
    console.log(`尝试连接到地域 ${server.region} 实例 ${server.instanceId} 的VNC终端`);
    
    try {
      const vncUrl = await tencentCloudService.getInstanceVncUrl(server.instanceId, server.region);
      console.log(`获取到VNC URL: ${vncUrl}`);
      setConnectionUrl(vncUrl);
    } catch (error) {
      console.error('连接VNC终端失败:', error);
      const errorMessage = error instanceof Error ? error.message : '连接VNC终端失败，请稍后重试';
      setConnectionError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const closeConnection = () => {
    setSelectedServer(null);
    setConnectionUrl(null);
    setConnectionError(null);
    setServerToConnect(null);
  };

  const getServersForSelectedRegion = (): WindowsServer[] => {
    return filteredRegionServers.get(selectedRegion) || [];
  };

  const getRegionName = (regionId: string): string => {
    const region = SUPPORTED_REGIONS.find(r => r.id === regionId);
    return region ? region.name : regionId;
  };

  // 获取各地域过滤后的服务器数量
  const getRegionServerCount = (regionId: string): number => {
    return filteredRegionServers.get(regionId)?.length || 0;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">服务器管理</h1>
        <p className="text-gray-600">
          {isAdmin 
            ? '管理员模式：显示所有服务器' 
            : `普通用户模式：仅显示与您账号 (${email}) 相关的服务器`}
        </p>
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
              VNC终端 - {serverToConnect?.name || selectedServer}
              {serverToConnect?.region && (
                <span className="ml-2 text-sm text-gray-500">
                  ({getRegionName(serverToConnect.region)})
                </span>
              )}
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
                  <p className="mt-4 text-gray-600">正在连接到服务器VNC终端...</p>
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
                    onClick={() => {
                      if (serverToConnect) {
                        connectToVnc(serverToConnect);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded"
                  >
                    重试连接
                  </button>
                </div>
              </div>
            ) : connectionUrl ? (
              <div className="relative h-full w-full">
                <iframe
                  src={connectionUrl}
                  className="w-full h-full"
                  title="VNC Terminal"
                  allow="clipboard-read; clipboard-write"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  onLoad={() => console.log('iframe 加载完成')}
                  onError={(e) => console.error('iframe 加载错误', e)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600">正在准备VNC终端连接...</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex border-b border-gray-200">
            {SUPPORTED_REGIONS.map((region) => (
              <button
                key={region.id}
                className={`py-2 px-4 mr-2 font-medium text-sm focus:outline-none ${
                  selectedRegion === region.id
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRegion(region.id)}
                disabled={region.disabled}
              >
                {region.name}
                <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  {getRegionServerCount(region.id)}
                </span>
              </button>
            ))}
            <button
              className="ml-auto text-sm text-blue-600 hover:text-blue-800"
              onClick={fetchAllRegionInstances}
            >
              刷新列表
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getServersForSelectedRegion().length === 0 ? (
              <div className="col-span-3 py-8 text-center text-gray-500">
                {isAdmin 
                  ? `当前地域 ${getRegionName(selectedRegion)} 未发现服务器实例` 
                  : `当前地域 ${getRegionName(selectedRegion)} 未发现与您关联的服务器实例`}
              </div>
            ) : (
              getServersForSelectedRegion().map((server) => (
                <div
                  key={server.ip}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-14z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">{server.name}</h3>
                  </div>
                  <p className="text-gray-600">{server.ip}</p>
                  
                  {server.osName && (
                    <p className="text-gray-600 text-sm mt-1">{server.osName}</p>
                  )}
                  
                  {server.status && (
                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      server.status === 'RUNNING' ? 'bg-green-100 text-green-800' : 
                      server.status === 'STOPPED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {server.status === 'RUNNING' ? '运行中' : 
                      server.status === 'STOPPED' ? '已停止' : server.status}
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                      onClick={() => connectToVnc(server)}
                      disabled={!server.instanceId || server.status !== 'RUNNING'}
                    >
                      VNC终端连接
                    </button>
                    {(!server.instanceId || server.status !== 'RUNNING') && (
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {!server.instanceId ? '此服务器无法使用VNC' : '服务器必须处于运行状态才能连接'}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerManage; 
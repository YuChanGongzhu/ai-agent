import React, { useState, useEffect } from 'react';
import { tencentCloudService, LighthouseInstance, SUPPORTED_REGIONS, RegionInfo } from '../api/tencent_cloud';
import { useUser } from '../context/UserContext'; // 导入useUser钩子
import { useWxAccount } from '../context/WxAccountContext'; // 导入useWxAccount钩子

interface WindowsServer {
  ip: string;
  publicIp: string;  // 外网IP
  privateIp: string; // 内网IP
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
  // 重启功能相关状态
  const [serverToReboot, setServerToReboot] = useState<WindowsServer | null>(null);
  const [isRebootDialogOpen, setIsRebootDialogOpen] = useState<boolean>(false);
  const [isRebooting, setIsRebooting] = useState<boolean>(false);
  const [rebootError, setRebootError] = useState<string | null>(null);
  
  // 使用UserContext提供的用户信息
  const { userProfile, isAdmin, isLoading: userLoading, email } = useUser();
  
  // 使用WxAccountContext提供的微信账号列表
  const { wxAccountList, isLoading: wxLoading } = useWxAccount();

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
        // 筛选仅保留Windows服务器
        const windowsInstances = instances.filter((instance: LighthouseInstance) => 
          instance.OsName && instance.OsName.toLowerCase().includes('windows')
        );
        
        const servers: WindowsServer[] = windowsInstances.map((instance: LighthouseInstance) => ({
          ip: instance.PublicAddresses[0] || instance.PrivateAddresses[0] || '',
          publicIp: instance.PublicAddresses[0] || '',
          privateIp: instance.PrivateAddresses[0] || '',
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
      
      console.log(`成功获取 ${totalCount} 台Windows服务器实例，分布在 ${serversByRegion.size} 个地域`);
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

  // 打开重启确认对话框
  const showRebootConfirmation = (server: WindowsServer) => {
    setServerToReboot(server);
    setIsRebootDialogOpen(true);
    setRebootError(null);
  };

  // 关闭重启确认对话框
  const closeRebootDialog = () => {
    setIsRebootDialogOpen(false);
    setServerToReboot(null);
    setRebootError(null);
  };

  // 执行重启操作
  const rebootServer = async () => {
    if (!serverToReboot || !serverToReboot.instanceId || !serverToReboot.region) {
      setRebootError('缺少实例ID或地域信息，无法执行重启操作');
      return;
    }

    if (serverToReboot.status !== 'RUNNING') {
      setRebootError(`无法重启实例，当前状态为: ${serverToReboot.status || '未知'}，只有运行中的实例才能重启`);
      return;
    }

    setIsRebooting(true);
    setRebootError(null);

    try {
      await tencentCloudService.rebootInstances([serverToReboot.instanceId], serverToReboot.region);
      
      // 更新服务器状态
      const updatedServers = new Map(regionServers);
      const regionServersArray = updatedServers.get(serverToReboot.region) || [];
      
      const updatedServersArray = regionServersArray.map(server => {
        if (server.instanceId === serverToReboot.instanceId) {
          return { ...server, status: 'REBOOTING' };
        }
        return server;
      });
      
      updatedServers.set(serverToReboot.region, updatedServersArray);
      setRegionServers(updatedServers);
      
      // 关闭对话框
      setIsRebootDialogOpen(false);
      setServerToReboot(null);
      
      // 延迟几秒后刷新服务器列表以获取最新状态
      setTimeout(() => {
        fetchAllRegionInstances();
      }, 5000);
      
    } catch (error) {
      console.error('重启服务器失败:', error);
      const errorMessage = error instanceof Error ? error.message : '重启服务器失败，请稍后重试';
      setRebootError(errorMessage);
    } finally {
      setIsRebooting(false);
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

  // 根据服务器IP地址和微信账号列表判断微信状态
  const getWechatStatusLabel = (server: WindowsServer) => {
    // 检查匹配当前服务器IP的所有微信账号
    const runningWxAccounts = wxAccountList.filter(
      account => account.source_ip && 
      (account.source_ip === server.publicIp || account.source_ip === server.privateIp)
    );
    
    if (runningWxAccounts.length > 0) {
      return {
        label: '微信运行中',
        className: 'bg-green-100 text-green-800',
        accounts: runningWxAccounts
      };
    } else {
      return {
        label: '空闲中',
        className: 'bg-gray-100 text-gray-600',
        accounts: []
      };
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
                  
                  {/* 将内网和外网IP显示在同一行 */}
                  <div className="mt-1 flex items-center flex-wrap gap-1">
                    {server.publicIp && (
                      <div className="flex items-center mr-3">
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mr-1">外</span>
                        <span className="text-gray-600 text-sm">{server.publicIp}</span>
                      </div>
                    )}
                    {server.privateIp && (
                      <div className="flex items-center">
                        <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded mr-1">内</span>
                        <span className="text-gray-600 text-sm">{server.privateIp}</span>
                      </div>
                    )}
                  </div>
                  
                  {server.osName && (
                    <p className="text-gray-600 text-sm mt-2">{server.osName}</p>
                  )}
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* 添加服务器实例状态标签 */}
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      server.status === 'RUNNING' 
                        ? 'bg-green-100 text-green-800' 
                        : server.status === 'REBOOTING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : server.status === 'STOPPED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                      状态: {server.status || '未知'}
                    </div>
                    
                    {/* 微信状态标签 */}
                    {!wxLoading && server.status === 'RUNNING' && (
                      <>
                        {getWechatStatusLabel(server).accounts.length > 0 ? (
                          // 如果有微信账号在运行，为每个账号显示一个标签
                          getWechatStatusLabel(server).accounts.map((account, index) => (
                            <div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              微信({account.name || account.wxid || account.mobile || `账号${index+1}`})运行中
                            </div>
                          ))
                        ) : (
                          // 如果没有微信账号在运行，显示空闲中
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            微信空闲中
                          </div>
                        )}
                      </>
                    )}
                    {/* 非运行状态的服务器也显示微信空闲状态 */}
                    {!wxLoading && server.status !== 'RUNNING' && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        微信空闲中
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                      onClick={() => connectToVnc(server)}
                      disabled={!server.instanceId || server.status !== 'RUNNING'}
                    >
                      VNC终端连接
                    </button>
                    
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
                      onClick={() => showRebootConfirmation(server)}
                      disabled={!server.instanceId || server.status !== 'RUNNING'}
                    >
                      重启系统
                    </button>

                    {(!server.instanceId || server.status !== 'RUNNING') && (
                      <p className="text-xs text-gray-500 mt-1 text-center col-span-2">
                        {!server.instanceId ? '此服务器无法使用操作' : `服务器当前状态: ${server.status || '未知'}`}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 重启确认对话框 */}
          {isRebootDialogOpen && serverToReboot && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">确认重启服务器</h3>
                <p className="text-gray-700 mb-6">
                  您确定要重启服务器 <span className="font-semibold">{serverToReboot.name}</span> 吗？此操作可能会导致正在运行的应用程序中断。
                </p>
                
                {rebootError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {rebootError}
                  </div>
                )}
                
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeRebootDialog}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                    disabled={isRebooting}
                  >
                    取消
                  </button>
                  <button
                    onClick={rebootServer}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded flex items-center"
                    disabled={isRebooting}
                  >
                    {isRebooting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        正在重启...
                      </>
                    ) : (
                      '确认重启'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServerManage; 
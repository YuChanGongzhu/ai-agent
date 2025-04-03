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
  // 创建实例相关状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);
  const [createdInstanceIds, setCreatedInstanceIds] = useState<string[]>([]);
  // 用户配额相关状态
  const [serverQuota, setServerQuota] = useState<number>(0);
  const [usedQuota, setUsedQuota] = useState<number>(0);
  // 删除实例相关状态
  const [serverToDelete, setServerToDelete] = useState<WindowsServer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  // 添加删除状态和阶段跟踪
  const [deletePhase, setDeletePhase] = useState<'isolating' | 'terminating' | null>(null);
  const [serverCurrentStatus, setServerCurrentStatus] = useState<string | null>(null);

  // 使用UserContext提供的用户信息
  const { userProfile, isAdmin, isLoading: userLoading, email } = useUser();

  // 使用WxAccountContext提供的微信账号列表
  const { wxAccountList, isLoading: wxLoading, updateServerList } = useWxAccount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 等待用户上下文加载完成
        if (userLoading) {
          return; // 用户数据加载中，等待
        }
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
        newFilteredServers.set(regionId, servers);
      } else if (email) {
        const userEmail = email.toLowerCase();
        const filteredServers = servers.filter(server => {
          return server.name && server.name.toLowerCase().indexOf(userEmail) !== -1;
        });
        newFilteredServers.set(regionId, filteredServers);
      } else {
        newFilteredServers.set(regionId, []);
      }
    });
    console.log('根据用户权限过滤后的服务器列表:', newFilteredServers);

    setFilteredRegionServers(newFilteredServers);

    // 计算已使用的配额
    let totalUsedServers = 0;
    newFilteredServers.forEach((servers) => {
      totalUsedServers += servers.length;
    });
    setUsedQuota(totalUsedServers);

    // 设置用户配额
    setServerQuota(isAdmin ? 50 : 2);

  }, [regionServers, isAdmin, email]);

  // 检查是否超出配额
  const checkQuotaExceeded = (): boolean => {
    return usedQuota >= serverQuota;
  };

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

      // 将服务器列表传递给WxAccountContext
      updateServerList(serversByRegion);

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

  // 打开创建实例对话框
  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setCreateError(null);
    setCreateSuccess(false);
    setCreatedInstanceIds([]);
  };

  // 关闭创建实例对话框
  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    // 如果创建成功了，刷新实例列表
    if (createSuccess) {
      fetchAllRegionInstances();
    }
  };

  // 创建实例
  const createInstance = async () => {
    try {
      // 检查是否超出配额
      if (checkQuotaExceeded()) {
        setCreateError(`您已达到服务器配额上限(${serverQuota})，无法创建更多实例`);
        return;
      }

      setIsCreating(true);
      setCreateError(null);
      setCreateSuccess(false);

      // 从环境变量获取Windows密码
      // 注意：环境变量必须以REACT_APP_开头才能在React前端访问
      const windowsPassword = process.env.REACT_APP_WINDOWS_PASSWORD;

      // 检查密码是否存在
      if (!windowsPassword) {
        console.warn('未找到环境变量REACT_APP_WINDOWS_PASSWORD，将使用默认密码');
      }

      const password = windowsPassword;

      // 设置创建实例参数
      const params = {
        BundleId: 'bundle_starter_mc_med2_01',
        BlueprintId: 'lhbp-4286aomh',
        InstanceName: `WCF_${email}`,
        FirewallTemplateId: 'lhft-ikbqyf7x',
        DryRun: false, // 是否仅预检请求，false为实际创建实例
        LoginConfiguration: {
          AutoGeneratePassword: 'NO',
          Password: password
        },
        InstanceChargePrepaid: {
          Period: 1,
          RenewFlag: 'NOTIFY_AND_MANUAL_RENEW'
        },
        region: selectedRegion
      };

      const instanceIds = await tencentCloudService.createInstances(params);

      setCreateSuccess(true);
      setCreatedInstanceIds(instanceIds);

      // 创建成功后3秒自动关闭对话框
      setTimeout(() => {
        closeCreateDialog();
      }, 3000);
    } catch (error) {
      console.error('创建实例失败:', error);
      setCreateError(error instanceof Error ? error.message : '创建实例失败，请稍后重试');
      setCreateSuccess(false);
    } finally {
      setIsCreating(false);
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

  // 打开删除确认对话框
  const showDeleteConfirmation = (server: WindowsServer) => {
    setServerToDelete(server);
    setIsDeleteDialogOpen(true);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  // 关闭删除确认对话框
  const closeDeleteDialog = () => {
    // 无论在什么情况下，重置所有状态
    setIsDeleteDialogOpen(false);
    setServerToDelete(null);
    setDeleteError(null);
    setDeletePhase(null);
    setServerCurrentStatus(null);
    setIsDeleting(false);
    setDeleteSuccess(false);
    
    // 如果删除成功，刷新服务器列表
    if (deleteSuccess) {
      fetchAllRegionInstances();
    }
  };

  // 执行删除操作（先隔离，再销毁）
  const deleteServer = async () => {
    if (!serverToDelete || !serverToDelete.instanceId || !serverToDelete.region) {
      setDeleteError('缺少实例ID或地域信息，无法执行删除操作');
      return;
    }

    // 确保实例ID和地域都存在
    const instanceId = serverToDelete.instanceId;
    const region = serverToDelete.region;

    if (serverToDelete.status !== 'RUNNING' && serverToDelete.status !== 'STOPPED' && serverToDelete.status !== 'SHUTDOWN') {
      setDeleteError(`无法删除实例，当前状态为: ${serverToDelete.status || '未知'}，只有运行中、已停止或已关机的实例才能删除`);
      return;
    }

    // 检查是否有微信账号在运行
    if (getWechatStatusLabel(serverToDelete).accounts.length > 0) {
      setDeleteError('无法删除实例，该实例上有微信账号正在运行');
      return;
    }

    // 开始删除流程，重置错误状态
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(false);
    setServerCurrentStatus(serverToDelete.status || '未知');

    try {
      // 首先获取实例的最新状态，确保我们有最准确的信息
      try {
        const instancesByRegion = await tencentCloudService.getAllRegionInstances();
        const regionInstances = instancesByRegion.get(region) || [];
        const instance = regionInstances.find(ins => ins.InstanceId === instanceId);
        
        if (instance) {
          // 更新当前状态显示
          setServerCurrentStatus(instance.InstanceState);
          
          // 如果最新状态已经是SHUTDOWN，直接走销毁流程
          if (instance.InstanceState === 'SHUTDOWN') {
            serverToDelete.status = 'SHUTDOWN';  // 更新本地对象状态
          }
        }
      } catch (error) {
        // 如果获取最新状态失败，继续使用当前已知状态
        console.error('获取实例最新状态失败，使用当前已知状态:', error);
      }
      
      // 如果实例已经是SHUTDOWN状态，直接执行销毁操作
      if (serverToDelete.status === 'SHUTDOWN') {
        try {
          setDeletePhase('terminating');
          setServerCurrentStatus('SHUTDOWN');
          
          await tencentCloudService.terminateInstances([instanceId], region);
          setDeleteSuccess(true);

          // 更新服务器状态（从列表中移除）
          const updatedServers = new Map(regionServers);
          const servers = updatedServers.get(region);

          if (servers && Array.isArray(servers)) {
            const updatedServersArray = servers.filter(server =>
              server.instanceId !== instanceId
            );
            updatedServers.set(region, updatedServersArray);
            setRegionServers(updatedServers);
          }

          // 立即自动关闭对话框并刷新实例列表
          fetchAllRegionInstances();
          closeDeleteDialog();
          return;
        } catch (terminateError) {
          console.error('销毁实例失败:', terminateError);
          const errorMessage = terminateError instanceof Error ? terminateError.message : String(terminateError);

          if (errorMessage.includes('UnsupportedOperation.LatestOperationUnfinished')) {
            // 如果是操作未完成错误，提示用户稍后手动销毁
            setDeleteError('实例正在执行其他操作，请稍后再尝试删除');
          } else {
            setDeleteError('销毁实例失败，请稍后重试');
          }
          setIsDeleting(false);
          setDeletePhase(null);
          return;
        }
      }

      // 对于非SHUTDOWN状态，先隔离实例（退还实例）
      setDeletePhase('isolating');
      try {
        // 执行隔离操作
        await tencentCloudService.isolateInstances([instanceId], region);
        
        // 设置状态为正在隔离
        setServerCurrentStatus('隔离中');
      } catch (isolateError) {
        console.error('隔离实例失败:', isolateError);
        const errorMessage = isolateError instanceof Error ? isolateError.message : String(isolateError);
        
        // 如果错误信息表明实例已经是SHUTDOWN状态
        if (errorMessage.includes('is in `SHUTDOWN` state')) {
          // 实例已经是SHUTDOWN状态，直接尝试销毁
          setServerCurrentStatus('SHUTDOWN');
          setDeletePhase('terminating');
          
          try {
            await tencentCloudService.terminateInstances([instanceId], region);
            setDeleteSuccess(true);
            
            // 更新服务器状态（从列表中移除）
            const updatedServers = new Map(regionServers);
            const servers = updatedServers.get(region);
            
            if (servers && Array.isArray(servers)) {
              const updatedServersArray = servers.filter(server =>
                server.instanceId !== instanceId
              );
              updatedServers.set(region, updatedServersArray);
              setRegionServers(updatedServers);
            }
            
            // 立即自动关闭对话框并刷新实例列表
            fetchAllRegionInstances();
            closeDeleteDialog();
            return;
          } catch (terminateError) {
            console.error('销毁实例失败:', terminateError);
            setDeleteError('实例删除失败，请稍后重试');
            setIsDeleting(false);
            setDeletePhase(null);
            return;
          }
        } else {
          // 其他类型的错误
          setDeleteError('隔离实例失败，请稍后重试');
          setIsDeleting(false);
          setDeletePhase(null);
          return;
        }
      }

      // 延迟检查实例状态，等待其变为 SHUTDOWN
      let retryCount = 0;
      const maxRetry = 20; // 增加最大重试次数
      const initialWaitTime = 15000; // 首次等待15秒
      const checkIntervalTime = 5000; // 每次检查间隔5秒

      const checkInstanceStatus = async () => {
        try {
          // 获取实例最新状态
          const instancesByRegion = await tencentCloudService.getAllRegionInstances();
          const regionInstances = instancesByRegion.get(region) || [];
          const instance = regionInstances.find(ins => ins.InstanceId === instanceId);

          if (!instance) {
            // 如果实例已不存在，可能已经被删除了，直接认为成功
            setDeleteSuccess(true);
            setServerCurrentStatus('已删除');
            setDeletePhase(null);

            // 更新服务器状态（从列表中移除）
            const updatedServers = new Map(regionServers);
            const servers = updatedServers.get(region);

            if (servers && Array.isArray(servers)) {
              const updatedServersArray = servers.filter(server =>
                server.instanceId !== instanceId
              );
              updatedServers.set(region, updatedServersArray);
              setRegionServers(updatedServers);
            }

            // 立即自动关闭对话框并刷新实例列表 
            fetchAllRegionInstances();
            closeDeleteDialog();
            return;
          }

          // 更新当前状态显示
          setServerCurrentStatus(instance.InstanceState || '未知');

          // 检查是否有正在进行的操作
          if (instance.LatestOperation === 'IsolateInstances' &&
            instance.LatestOperationState === 'OPERATING') {
            // 如果隔离操作仍在进行中，继续等待
            setServerCurrentStatus(`${instance.InstanceState} (隔离中...)`);
            if (retryCount < maxRetry) {
              retryCount++;
              setTimeout(checkInstanceStatus, checkIntervalTime);
              return;
            } else {
              throw new Error('隔离实例操作超时，请稍后手动尝试销毁操作');
            }
          }

          // 特别检查：确保最后一次操作是隔离并且已经成功完成
          if (instance.LatestOperation === 'IsolateInstances' && 
              instance.LatestOperationState === 'SUCCESS' &&
              instance.InstanceState === 'SHUTDOWN') {
            
            // 隔离操作已完成，状态已是SHUTDOWN，可以执行销毁操作
            // 额外等待10秒确保隔离完全生效
            setServerCurrentStatus('隔离完成，准备销毁...');
            
            setTimeout(async () => {
              try {
                // 执行销毁操作
                setDeletePhase('terminating');
                setServerCurrentStatus('正在销毁...');
                
                await tencentCloudService.terminateInstances([instanceId], region);
                setDeleteSuccess(true);
                setServerCurrentStatus('已销毁');
                setDeletePhase(null);

                // 更新服务器状态（从列表中移除）
                const updatedServers = new Map(regionServers);
                const servers = updatedServers.get(region);

                if (servers && Array.isArray(servers)) {
                  const updatedServersArray = servers.filter(server =>
                    server.instanceId !== instanceId
                  );
                  updatedServers.set(region, updatedServersArray);
                  setRegionServers(updatedServers);
                }

                // 立即自动关闭对话框并刷新实例列表
                fetchAllRegionInstances();
                closeDeleteDialog();
              } catch (terminateError) {
                // 如果销毁失败，不显示具体错误信息
                console.error('销毁实例失败:', terminateError);
                setDeleteError('销毁实例失败，请稍后重试');
                setDeletePhase(null);
                setIsDeleting(false);
              }
            }, 10000); // 额外等待10秒再执行销毁操作
          } else if (retryCount < maxRetry) {
            // 如果状态不是期望的状态且未超过重试次数，则继续等待
            retryCount++;
            setTimeout(checkInstanceStatus, checkIntervalTime);
          } else {
            // 如果超过最大重试次数，则提示错误
            throw new Error('等待实例状态变更超时');
          }
        } catch (error) {
          console.error('检查实例状态失败:', error);
          setDeleteError('删除操作未完成，请稍后重试');
          setDeletePhase(null);
          setIsDeleting(false);
        }
      };

      // 开始检查实例状态，首次检查前等待时间更长
      setTimeout(checkInstanceStatus, initialWaitTime);
    } catch (error) {
      console.error('删除服务器失败:', error);
      setDeleteError('删除服务器失败，请稍后重试');
      setDeleteSuccess(false);
      setDeletePhase(null);
      setIsDeleting(false);
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
    <div className="p-6 md:mt-0 mt-14">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">服务器管理</h1>
        <p className="text-gray-600">
          {isAdmin
            ? '管理员模式：显示所有服务器'
            : `普通用户模式：仅显示与您账号 (${email}) 相关的服务器`}
        </p>
        <p className="text-gray-600 mt-1">
          服务器配额: <span className={usedQuota >= serverQuota ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {usedQuota} / {serverQuota}
          </span>
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

          {/* 添加操作提示 */}
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">操作步骤</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">1. 登录Windows系统后，<span className="text-orange-600">无需额外操作</span>，等待微信登录二维码自动出现</p>
                  <p className="mt-1">2. 如果没有出现微信二维码或登录异常，请尝试点击"重启系统"按钮</p>
                  <p className="mt-1">3. 微信登录后，系统将自动管理微信，<span className="text-orange-600">请勿手动操作</span>Windows系统</p>
                </div>
              </div>
            </div>
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
                className={`py-2 px-4 mr-2 font-medium text-sm focus:outline-none ${selectedRegion === region.id
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
              className="ml-auto flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-1.5 px-3 rounded transition-colors"
              onClick={fetchAllRegionInstances}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新列表
            </button>
            {/* 添加创建实例按钮（对所有用户显示） */}
            <button
              className={`ml-2 flex items-center font-medium py-1.5 px-3 rounded transition-colors ${checkQuotaExceeded()
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              onClick={openCreateDialog}
              disabled={checkQuotaExceeded()}
              title={checkQuotaExceeded() ? `已达到服务器配额上限(${serverQuota})` : '创建新实例'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建实例
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
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${server.status === 'RUNNING'
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
                              微信({account.name || account.wxid || account.mobile || `账号${index + 1}`})运行中
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

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded text-sm"
                      onClick={() => connectToVnc(server)}
                      disabled={!server.instanceId || server.status !== 'RUNNING'}
                    >
                      登录系统
                    </button>

                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-3 rounded text-sm"
                      onClick={() => showRebootConfirmation(server)}
                      disabled={!server.instanceId || server.status !== 'RUNNING'}
                    >
                      重启系统
                    </button>

                    {/* 添加删除实例按钮 - 对所有用户显示 */}
                    <button
                      className={`${!server.instanceId ||
                          (server.status !== 'RUNNING' && server.status !== 'STOPPED' && server.status !== 'SHUTDOWN') ||
                          getWechatStatusLabel(server).accounts.length > 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                        } text-white font-semibold py-2 px-3 rounded text-sm`}
                      onClick={() => showDeleteConfirmation(server)}
                      disabled={!server.instanceId ||
                        (server.status !== 'RUNNING' && server.status !== 'STOPPED' && server.status !== 'SHUTDOWN') ||
                        getWechatStatusLabel(server).accounts.length > 0}
                      title={getWechatStatusLabel(server).accounts.length > 0 ?
                        "微信运行中的实例不能删除" :
                        (!server.instanceId || (server.status !== 'RUNNING' && server.status !== 'STOPPED' && server.status !== 'SHUTDOWN')) ?
                          "只有运行中、已停止或已关机的实例才能删除" : "删除实例"}
                    >
                      删除实例
                    </button>

                    {(!server.instanceId || server.status !== 'RUNNING') && (
                      <p className="text-xs text-gray-500 mt-1 text-center col-span-3">
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

          {/* 创建实例对话框 */}
          {isCreateDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">创建新实例</h3>
                <div className="mb-4">
                  <h4 className="font-medium mb-2">实例配置参数</h4>
                  <p className="text-sm text-blue-600 mb-2">
                    使用环境变量 REACT_APP_WINDOWS_PASSWORD 中的密码
                  </p>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-700">当前配额状态:</p>
                    <span className={usedQuota >= serverQuota ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {usedQuota} / {serverQuota}
                    </span>
                  </div>
                  <ul className="space-y-2 text-gray-700 text-sm bg-gray-50 p-3 rounded">
                    <li><span className="font-medium">套餐ID:</span> bundle_starter_mc_med2_01</li>
                    <li><span className="font-medium">镜像ID:</span> lhbp-4286aomh</li>
                    <li><span className="font-medium">防火墙模板:</span> lhft-ikbqyf7x</li>
                    <li><span className="font-medium">实例名称:</span> WCX_{email ? email.split('@')[0] : '[邮箱]'}</li>
                    <li><span className="font-medium">登录密码:</span> 已设置默认密码</li>
                    <li><span className="font-medium">购买时长:</span> 1个月</li>
                    <li><span className="font-medium">测试模式:</span> 否（实际创建实例）</li>
                  </ul>
                </div>

                {createError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <p>创建实例请求成功！</p>
                    {createdInstanceIds.length > 0 && (
                      <p className="text-sm">实例ID: {createdInstanceIds.join(', ')}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeCreateDialog}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                    disabled={isCreating}
                  >
                    {createSuccess ? '关闭' : '取消'}
                  </button>
                  {!createSuccess && (
                    <button
                      onClick={createInstance}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded flex items-center"
                      disabled={isCreating || checkQuotaExceeded()}
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          创建中...
                        </>
                      ) : checkQuotaExceeded() ? (
                        '配额已满'
                      ) : (
                        '确认创建'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 删除实例确认对话框 */}
          {isDeleteDialogOpen && serverToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">确认删除服务器</h3>
                
                {!isDeleting && !deleteError && (
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">
                      您确定要删除服务器 <span className="font-semibold">{serverToDelete.name}</span> 吗？此操作<span className="text-red-600 font-bold">不可逆</span>，将会：
                    </p>
                  </div>
                )}

                {deleteError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p>{deleteError}</p>
                    <p className="text-sm mt-2">请稍后再试或联系管理员</p>
                  </div>
                )}

                {isDeleting && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-4">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-blue-700">
                          {deletePhase === 'isolating' ? '正在隔离实例...' : 
                          deletePhase === 'terminating' ? '正在销毁实例...' : 
                          '处理中...'}
                        </p>
                        <p className="text-sm text-blue-600">
                          当前状态: {serverCurrentStatus || '未知'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          删除过程自动进行，完成后将自动关闭此窗口
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  {!isDeleting && (
                    <button
                      onClick={closeDeleteDialog}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                    >
                      {deleteError ? '关闭' : '取消'}
                    </button>
                  )}
                  {!isDeleting && !deleteError && (
                    <button
                      onClick={deleteServer}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded flex items-center"
                    >
                      确认删除
                    </button>
                  )}
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
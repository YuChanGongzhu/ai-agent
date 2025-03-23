import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WxAccount, getWxAccountListApi } from '../api/airflow';
import { useUser } from './UserContext';
import { UserProfile } from './type';
import { tencentCloudService, LighthouseInstance } from '../api/tencent_cloud';

// 服务器类型定义
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

// 微信账号上下文类型定义
interface WxAccountContextType {
  wxAccountList: WxAccount[];
  filteredWxAccountList: WxAccount[];
  isLoading: boolean;
  error: string | null;
  refreshWxAccounts: () => Promise<void>;
  updateServerList: (newServerList: Map<string, any[]>) => void;
}

// 创建上下文
const WxAccountContext = createContext<WxAccountContextType | undefined>(undefined);

/**
 * 微信账号上下文提供者组件
 * 管理微信账号列表状态并提供给子组件
 */
export const WxAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 状态定义
  const [wxAccountList, setWxAccountList] = useState<WxAccount[]>([]);
  const [filteredWxAccountList, setFilteredWxAccountList] = useState<WxAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 使用服务器列表
  const [serverList, setServerList] = useState<Map<string, WindowsServer[]>>(new Map());
  const [isLoadingServers, setIsLoadingServers] = useState<boolean>(false);
  
  // 使用用户上下文获取用户信息和管理员状态
  const { userProfile, isAdmin, isLoading: userLoading } = useUser();

  // 过滤微信账号列表，根据用户权限
  const filterWxAccounts = (accounts: WxAccount[], profile: UserProfile | null, isUserAdmin: boolean, regionServers?: Map<string, WindowsServer[]>) => {
    console.log('开始过滤微信账号，总账号数量：', accounts.length);
    console.log('当前用户信息：', profile?.email, '是否管理员：', isUserAdmin);
    
    if (isUserAdmin) {
      console.log('用户是管理员，显示所有账号');
      return accounts;
    }
    
    if (!profile || !profile.email) {
      console.log('用户没有邮箱信息，不显示任何账号');
      return [];
    }

    // 1. 先获取该用户关联的所有服务器IP地址
    const userEmail = profile.email.toLowerCase();
    console.log('用户邮箱：', userEmail);

    // 用于存储用户关联的服务器IP信息
    const userServers: {publicIp: string, privateIp: string}[] = [];
    
    // 如果提供了regionServers参数，则从中筛选用户关联的服务器
    if (regionServers && regionServers.size > 0) {
      console.log('服务器列表地域数量：', regionServers.size);
      let allServerCount = 0;
      let matchedServerCount = 0;
      
      regionServers.forEach((servers, regionId) => {
        console.log(`处理地域 ${regionId} 的服务器，数量：`, servers.length);
        allServerCount += servers.length;
        
        // 查找名称包含用户完整邮箱的服务器
        const userRelatedServers = servers.filter(server => {
          // 使用直接字符串匹配找完整邮箱，而不是匹配子字符串
          const isMatch = server.name && server.name.toLowerCase().indexOf(userEmail) !== -1;
          if (isMatch) {
            console.log(`找到匹配的服务器：${server.name}，IP: 公网=${server.publicIp}，内网=${server.privateIp}`);
          }
          return isMatch;
        });
        
        matchedServerCount += userRelatedServers.length;
        console.log(`地域 ${regionId} 中与用户关联的服务器数量：`, userRelatedServers.length);
        
        // 收集这些服务器的IP地址
        userRelatedServers.forEach(server => {
          if (server.publicIp || server.privateIp) {
            userServers.push({
              publicIp: server.publicIp || '',
              privateIp: server.privateIp || ''
            });
          }
        });
      });
      
      console.log('总服务器数量：', allServerCount);
      console.log('与用户关联的服务器数量：', matchedServerCount);
      console.log('收集到的用户服务器IP列表：', userServers);
    } else {
      console.log('没有提供服务器列表或列表为空');
    }
    
    // 2. 根据服务器IP过滤微信账号
    // 只显示source_ip匹配用户服务器IP的微信账号
    const filteredAccounts = accounts.filter(account => {
      if (!account.source_ip) {
        console.log(`账号 ${account.name || account.wxid || account.mobile || '未知账号'} 没有source_ip，过滤掉`);
        return false;
      }
      
      // 检查账号source_ip是否与用户的任一服务器IP匹配
      const isMatched = userServers.some(server => {
        const matchPublic = account.source_ip === server.publicIp;
        const matchPrivate = account.source_ip === server.privateIp;
        if (matchPublic || matchPrivate) {
          console.log(`账号 ${account.name || account.wxid || account.mobile || '未知账号'} 的source_ip=${account.source_ip} 匹配服务器IP ${matchPublic ? server.publicIp : server.privateIp}`);
        }
        return matchPublic || matchPrivate;
      });
      
      if (!isMatched) {
        console.log(`账号 ${account.name || account.wxid || account.mobile || '未知账号'} 的source_ip=${account.source_ip} 没有匹配的服务器IP`);
      }
      
      return isMatched;
    });
    
    console.log('过滤后的微信账号数量：', filteredAccounts.length);
    console.log('过滤后的微信账号列表：', filteredAccounts);
    
    return filteredAccounts;
  };

  /**
   * 从腾讯云API获取所有服务器实例
   */
  const fetchAllRegionInstances = async () => {
    console.log('开始从腾讯云API获取所有服务器实例...');
    try {
      setIsLoadingServers(true);
      
      const instancesByRegion = await tencentCloudService.getAllRegionInstances();
      console.log('成功获取所有地域的实例数据，地域数量：', instancesByRegion.size);
      
      const serversByRegion = new Map<string, WindowsServer[]>();
      
      instancesByRegion.forEach((instances, regionId) => {
        console.log(`处理地域 ${regionId} 的实例，总数量：`, instances.length);
        
        // 筛选仅保留Windows服务器
        const windowsInstances = instances.filter((instance: LighthouseInstance) => 
          instance.OsName && instance.OsName.toLowerCase().includes('windows')
        );
        
        console.log(`地域 ${regionId} 的Windows实例数量：`, windowsInstances.length);
        
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
        
        console.log(`地域 ${regionId} 的Windows服务器详情：`, servers);
        
        serversByRegion.set(regionId, servers);
      });
      
      setServerList(serversByRegion);
      
      let totalCount = 0;
      serversByRegion.forEach(servers => {
        totalCount += servers.length;
      });
      
      console.log(`WxAccountContext: 成功获取 ${totalCount} 台Windows服务器实例，分布在 ${serversByRegion.size} 个地域`);
      
      return serversByRegion;
    } catch (error) {
      console.error('获取腾讯云服务器列表失败:', error);
      setError('获取服务器列表失败，可能会影响微信账号显示');
      return new Map<string, WindowsServer[]>();
    } finally {
      setIsLoadingServers(false);
    }
  };

  /**
   * 获取微信账号列表
   */
  const fetchWxAccounts = async (regionServers?: Map<string, WindowsServer[]>) => {
    console.log('开始获取微信账号列表...');
    try {
      setIsLoading(true);
      setError(null);
      
      const accounts = await getWxAccountListApi();
      console.log('成功获取微信账号列表，数量：', accounts.length);
      console.log('微信账号详情：', accounts);
      
      setWxAccountList(accounts);
      
      // 使用传入的服务器列表或当前状态中的服务器列表
      const serversToUse = regionServers || serverList;
      
      // 根据用户权限和服务器IP过滤账号
      if (!userLoading && (serversToUse.size > 0 || isAdmin)) {
        console.log('用户信息已加载，服务器列表已获取，开始过滤微信账号');
        console.log('是否使用传入的服务器列表:', !!regionServers);
        
        const filtered = filterWxAccounts(accounts, userProfile, isAdmin, serversToUse);
        setFilteredWxAccountList(filtered);
      } else {
        console.log('用户信息加载中或服务器列表为空，暂不过滤微信账号');
        console.log('用户加载状态:', userLoading, '服务器列表大小:', serversToUse.size);
        
        // 管理员或无法过滤时，直接显示所有账号
        if (isAdmin) {
          setFilteredWxAccountList(accounts);
        }
      }
      
      return accounts;
    } catch (err) {
      console.error('获取微信账号失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 刷新微信账号列表
   * 可在微信账号列表变更后调用此方法
   */
  const refreshWxAccounts = async () => {
    console.log('开始刷新微信账号列表和服务器列表...');
    
    try {
      setIsLoading(true);
      
      // 先获取服务器列表
      const servers = await fetchAllRegionInstances();
      
      // 直接使用获取到的服务器列表来过滤微信账号
      await fetchWxAccounts(servers);
      
      console.log('刷新完成');
    } catch (error) {
      console.error('刷新数据失败:', error);
      setError('刷新数据失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 当用户信息加载完成后获取微信账号列表和服务器列表
  useEffect(() => {
    if (!userLoading) {
      console.log('用户信息加载完成，开始初始化数据...');
      
      // 使用一个自执行异步函数来确保顺序执行
      (async () => {
        try {
          // 先获取服务器列表
          const servers = await fetchAllRegionInstances();
          
          // 然后使用获取到的服务器列表来过滤微信账号
          await fetchWxAccounts(servers);
          
          console.log('初始化数据完成');
        } catch (error) {
          console.error('初始化数据失败:', error);
        }
      })();
    }
  }, [userProfile, isAdmin, userLoading]);

  // 更新服务器列表的方法（由ServerManage组件调用，可选使用）
  const updateServerList = (newServerList: Map<string, any[]>) => {
    const typedServerList = new Map<string, WindowsServer[]>();
    
    newServerList.forEach((servers, regionId) => {
      console.log(`从ServerManage接收到地域 ${regionId} 的服务器列表，数量:`, servers.length);
      typedServerList.set(regionId, servers as WindowsServer[]);
    });
    
    setServerList(typedServerList);
    
    // 如果微信账号列表已加载，立即更新过滤
    if (wxAccountList.length > 0 && !userLoading) {
      setTimeout(() => {
        // 延迟执行，确保服务器列表状态已更新
        const filtered = filterWxAccounts(wxAccountList, userProfile, isAdmin, typedServerList);
        setFilteredWxAccountList(filtered);
      }, 0);
    } else {
      console.log('无法更新微信账号过滤，原因：', 
                 wxAccountList.length === 0 ? '微信账号列表为空' : '用户信息加载中');
    }
  };

  // 提供上下文值
  const contextValue: WxAccountContextType = {
    wxAccountList,
    filteredWxAccountList,
    isLoading: isLoading || isLoadingServers, // 任何一个加载中都视为加载中
    error,
    refreshWxAccounts,
    updateServerList // 保留此方法以兼容已有代码
  };

  return (
    <WxAccountContext.Provider value={contextValue}>
      {children}
    </WxAccountContext.Provider>
  );
};

/**
 * 微信账号上下文钩子
 * 用于在组件中访问微信账号列表和相关功能
 * 
 * 示例用法:
 * ```
 * const { wxAccountList, filteredWxAccountList, isLoading } = useWxAccount();
 * if (isLoading) return <加载中组件>;
 * return <展示微信账号列表内容>;
 * ```
 */
export const useWxAccount = (): WxAccountContextType => {
  const context = useContext(WxAccountContext);
  if (context === undefined) {
    throw new Error('useWxAccount必须在WxAccountProvider内部使用');
  }
  return context;
}; 
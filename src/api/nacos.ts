import axios from 'axios';

// Nacos配置
const nacosConfig = {
  server: process.env.REACT_APP_NACOS_SERVER || '',
  username: process.env.REACT_APP_NACOS_USERNAME || '',
  password: process.env.REACT_APP_NACOS_PASSWORD || '',
  namespace: process.env.REACT_APP_NACOS_NAMESPACE || 'public',
  // 新增认证相关配置
  authEnabled: process.env.REACT_APP_NACOS_AUTH_ENABLE || 'true',  // 默认启用认证
  authIdentityKey: process.env.REACT_APP_NACOS_AUTH_IDENTITY_KEY || 'serverIdentity',
  authIdentityValue: process.env.REACT_APP_NACOS_AUTH_IDENTITY_VALUE || 'security',
  authToken: process.env.REACT_APP_NACOS_AUTH_TOKEN || '' // 应从环境变量获取
};

// Nacos配置组和数据ID常量
const CONFIG_GROUP = 'lucy-ai';
const INVITE_CODES_DATA_ID = 'invite-codes';
const USERS_DATA_ID = 'users';
const USER_CONFIGS_DATA_ID = 'user-configs';
const USER_SERVERS_DATA_ID = 'user-servers';

// 内存缓存，用于解决Nacos配置读写不一致问题
const configCache: Record<string, { 
  data: any; 
  timestamp: number; 
  dirtyFlag: boolean;
}> = {};

// 缓存过期时间(毫秒)
const CACHE_TTL = 60000; // 30秒

// 类型定义
interface InviteCode {
  code: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
}

interface User {
  username: string;
  password: string;
  email: string;
  phone: string;
  createdAt: string;
  role: 'user' | 'admin';
  inviteCode: string;
}

interface UserConfig {
  username: string;
  settings: Record<string, any>;
}

interface ServerInfo {
  id: string;
  name: string;
  ip: string;
  port?: number;
  description?: string;
}

interface UserServers {
  username: string;
  servers: ServerInfo[];
}

/**
 * 获取Nacos认证令牌
 * Nacos 2.x的认证机制有所不同，支持两种方式:
 * 1. 通过用户名密码获取accessToken
 * 2. 通过身份验证密钥直接访问
 */
const getNacosToken = async (): Promise<string> => {
  try {
    // 修改: 不再直接使用预配置的认证令牌，而是始终通过用户名密码登录获取
    console.log('[Nacos] 通过用户名密码获取认证令牌');
    const response = await axios.post(
      `${nacosConfig.server}/nacos/v1/auth/login`,
      `username=${nacosConfig.username}&password=${nacosConfig.password}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    if (!response.data.accessToken) {
      throw new Error('Nacos返回的响应中没有accessToken');
    }
    
    console.log('[Nacos] 成功获取到认证令牌');
    return response.data.accessToken;
  } catch (error) {
    console.error('[Nacos] 获取令牌失败:', error);
    throw new Error('获取Nacos认证令牌失败');
  }
};

/**
 * 向请求中添加Nacos认证信息
 * @param params 请求参数
 * @returns 添加了认证信息的参数
 */
const addAuthParams = async (params: any = {}): Promise<any> => {
  const newParams = { ...params };
  
  // 添加命名空间
  if (nacosConfig.namespace && nacosConfig.namespace !== 'public') {
    newParams.tenant = nacosConfig.namespace;
  }
  
  // 是否需要添加认证信息
  if (nacosConfig.authEnabled === 'true') {
    // 修改: 不再添加身份验证键值对，只使用accessToken
    // 添加访问令牌
    try {
      const accessToken = await getNacosToken();
      if (accessToken) {
        newParams.accessToken = accessToken;
        console.log('[Nacos] 已添加认证令牌到请求');
      }
    } catch (error) {
      console.error('[Nacos] 添加认证信息失败:', error);
    }
  }
  
  return newParams;
};

// 验证Nacos管理员账号
export const authenticateNacosAdmin = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    // 只验证nacos账号
    if (username !== 'nacos') {
      return false;
    }
    
    // 尝试使用提供的凭据登录Nacos
    const response = await axios.post(
      `${nacosConfig.server}/nacos/v1/auth/login`,
      `username=${username}&password=${password}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    // 如果获得了令牌，说明认证成功
    return !!response.data.accessToken;
  } catch (error) {
    console.error('[Nacos] 验证管理员失败:', error);
    return false;
  }
};

// 通用获取配置函数
export const getNacosConfig = async (dataId: string): Promise<any> => {
  try {
    // 从缓存获取数据
    const cacheEntry = configCache[dataId];
    const now = Date.now();
    
    // 如果缓存未过期且没有被标记为脏数据，直接返回缓存
    if (cacheEntry && (now - cacheEntry.timestamp < CACHE_TTL) && !cacheEntry.dirtyFlag) {
      console.log(`[Nacos] 从缓存获取配置: ${dataId}`);
      return cacheEntry.data;
    }
    
    console.log(`[Nacos] 从服务器获取配置: ${dataId}`);
    
    // 准备基本参数
    const baseParams = {
      dataId,
      group: CONFIG_GROUP,
    };
    
    // 添加认证信息
    const params = await addAuthParams(baseParams);
    
    // 增加日志记录请求详情
    console.log(`[Nacos] 发送请求: ${nacosConfig.server}/nacos/v1/cs/configs 参数:`, params);
    
    // 发送请求
    const response = await axios.get(
      `${nacosConfig.server}/nacos/v1/cs/configs`,
      { params }
    );
    
    console.log(`[Nacos] 服务器响应状态: ${response.status}`);
    
    // 修复数据处理逻辑，安全处理不同类型的响应
    let parsedData = null;
    if (response.data) {
      console.log(`[Nacos] 收到响应数据类型: ${typeof response.data}`);
      
      // 如果数据是字符串且不为空，尝试解析为JSON
      if (typeof response.data === 'string') {
        const trimmedData = response.data.trim();
        if (trimmedData) {
          try {
            parsedData = JSON.parse(trimmedData);
            console.log(`[Nacos] 成功解析配置: ${dataId}`);
          } catch (e) {
            console.error(`[Nacos] JSON解析失败: ${dataId}`, e);
            // 如果无法解析为JSON，则使用原始字符串
            parsedData = trimmedData;
          }
        }
      } else if (typeof response.data === 'object') {
        // 如果已经是对象，直接使用
        parsedData = response.data;
      }
    }
    
    // 更新缓存
    if (parsedData !== null) {
      configCache[dataId] = { 
        data: parsedData, 
        timestamp: now,
        dirtyFlag: false
      };
    }
    
    return parsedData;
  } catch (error) {
    // 增强错误处理
    if (axios.isAxiosError(error)) {
      console.error(`[Nacos] 请求错误: ${dataId}, 状态码: ${error.response?.status}, 消息: ${error.message}`);
      
      // 401或403错误，说明认证问题
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('[Nacos] 认证失败，请检查用户名、密码或令牌设置');
      }
      
      // 404错误表示配置不存在
      if (error.response?.status === 404) {
        console.log(`[Nacos] 配置不存在: ${dataId}`);
      }
    } else {
      console.error(`[Nacos] 非请求错误: ${dataId}`, error);
    }
    
    // 如果有缓存且标记为脏，使用缓存
    if (configCache[dataId] && configCache[dataId].dirtyFlag) {
      console.log(`[Nacos] 使用脏缓存: ${dataId}`);
      return configCache[dataId].data;
    }
    
    // 如果有缓存，使用缓存
    if (configCache[dataId]) {
      console.log(`[Nacos] 发生错误，使用缓存: ${dataId}`);
      return configCache[dataId].data;
    }
    
    return null;
  }
};

// 重试函数
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000): Promise<any> => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`操作失败，重试 ${i+1}/${maxRetries}`, error);
      lastError = error;
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 增加重试延迟，指数退避策略
      delay *= 2;
    }
  }
  
  throw lastError;
};

// 通用发布配置函数
export const publishNacosConfig = async (dataId: string, content: any): Promise<boolean> => {
  try {
    // 先更新本地缓存，这样即使远程写入失败，至少有一个本地副本
    configCache[dataId] = { 
      data: content, 
      timestamp: Date.now(),
      dirtyFlag: true // 标记为脏数据，表示可能未成功写入Nacos
    };
    
    console.log(`[Nacos] 发布配置: ${dataId}`);
    
    // 准备基本参数
    const params = new URLSearchParams();
    params.append('dataId', dataId);
    params.append('group', CONFIG_GROUP);
    params.append('content', JSON.stringify(content));
    
    // 添加命名空间
    if (nacosConfig.namespace && nacosConfig.namespace !== 'public') {
      params.append('tenant', nacosConfig.namespace);
    }
    
    // 添加认证信息
    if (nacosConfig.authEnabled === 'true') {
      // 修改: 不再添加身份键值，只使用accessToken
      try {
        // 添加令牌
        const accessToken = await getNacosToken();
        if (accessToken) {
          params.append('accessToken', accessToken);
          console.log('[Nacos] 已添加认证令牌到发布请求');
        }
      } catch (error) {
        console.error('[Nacos] 添加认证信息到发布请求失败:', error);
        throw error;
      }
    }

    // 使用重试逻辑发布配置
    const response = await retryOperation(async () => {
      return await axios.post(
        `${nacosConfig.server}/nacos/v1/cs/configs`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    });
    
    const success = response.status === 200 && response.data === true;
    
    if (success) {
      // 更新成功，清除脏标记
      if (configCache[dataId]) {
        configCache[dataId].dirtyFlag = false;
      }
      console.log(`[Nacos] 配置发布成功: ${dataId}`);
    } else {
      console.error(`[Nacos] 配置发布失败: ${dataId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`[Nacos] 发布配置失败: ${dataId}`, error);
    return false;
  }
};

// 获取配置
const getConfig = async (dataId: string): Promise<any> => {
  return await getNacosConfig(dataId);
};

// 发布配置
const publishConfig = async (dataId: string, content: any): Promise<boolean> => {
  return await publishNacosConfig(dataId, content);
};

// 邀请码管理
export const getInviteCodes = async (): Promise<InviteCode[]> => {
  const codes = await getConfig(INVITE_CODES_DATA_ID);
  return codes || [];
};

export const addInviteCode = async (code: string): Promise<boolean> => {
  const codes = await getInviteCodes();
  // 检查是否已存在该邀请码
  if (codes.some(c => c.code === code)) {
    return false;
  }
  
  codes.push({
    code,
    used: false
  });
  
  const success = await publishConfig(INVITE_CODES_DATA_ID, codes);
  
  // 验证写入是否成功
  if (success) {
    // 等待一段时间后尝试验证配置是否成功保存
    setTimeout(async () => {
      try {
        // 强制清除缓存
        if (configCache[INVITE_CODES_DATA_ID]) {
          configCache[INVITE_CODES_DATA_ID].timestamp = 0;
        }
        
        const savedCodes = await getInviteCodes();
        const codeExists = savedCodes.some(c => c.code === code);
        
        if (!codeExists) {
          console.error(`[Nacos] 邀请码 ${code} 可能未成功保存`);
          // 重新尝试保存
          await publishConfig(INVITE_CODES_DATA_ID, codes);
        }
      } catch (error) {
        console.error(`[Nacos] 验证保存失败:`, error);
      }
    }, 2000); // 2秒后检查
  }
  
  return success;
};

export const deleteInviteCode = async (code: string): Promise<boolean> => {
  const codes = await getInviteCodes();
  
  // 找到邀请码的索引
  const codeIndex = codes.findIndex(c => c.code === code);
  
  // 如果找不到该邀请码，返回失败
  if (codeIndex === -1) {
    return false;
  }
  
  // 如果邀请码已被使用，不允许删除
  if (codes[codeIndex].used) {
    return false;
  }
  
  // 删除邀请码
  codes.splice(codeIndex, 1);
  
  // 保存更新后的邀请码列表
  return await publishConfig(INVITE_CODES_DATA_ID, codes);
};

export const markInviteCodeAsUsed = async (code: string, username: string): Promise<boolean> => {
  const codes = await getInviteCodes();
  const codeIndex = codes.findIndex(c => c.code === code && !c.used);
  
  if (codeIndex === -1) {
    return false;
  }
  
  codes[codeIndex].used = true;
  codes[codeIndex].usedBy = username;
  codes[codeIndex].usedAt = new Date().toISOString();
  
  return await publishConfig(INVITE_CODES_DATA_ID, codes);
};

export const checkInviteCode = async (code: string): Promise<boolean> => {
  const codes = await getInviteCodes();
  return codes.some(c => c.code === code && !c.used);
};

// 用户管理
export const getUsers = async (): Promise<User[]> => {
  const users = await getConfig(USERS_DATA_ID);
  return users || [];
};

// 新增通用查找用户函数，支持用户名、邮箱或手机号查找
export const findUserByIdentifier = async (identifier: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => 
    user.username === identifier || 
    user.email === identifier || 
    user.phone === identifier
  ) || null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find(user => user.username === username) || null;
};

// 删除用户及其所有相关配置
export const deleteUser = async (username: string): Promise<boolean> => {
  try {
    // 1. 删除用户账号
    const users = await getUsers();
    const updatedUsers = users.filter(user => user.username !== username);
    const userDeleted = await publishConfig(USERS_DATA_ID, updatedUsers);
    
    if (!userDeleted) {
      console.error(`[删除用户] 删除用户账号失败: ${username}`);
      return false;
    }
    
    // 2. 删除用户配置
    const configs = await getConfig(USER_CONFIGS_DATA_ID) || [];
    const updatedConfigs = configs.filter((config: UserConfig) => config.username !== username);
    await publishConfig(USER_CONFIGS_DATA_ID, updatedConfigs);
    
    // 3. 删除用户服务器配置
    const userServersConfig = await getConfig(USER_SERVERS_DATA_ID) || [];
    const updatedUserServers = userServersConfig.filter(
      (entry: UserServers) => entry.username !== username
    );
    await publishConfig(USER_SERVERS_DATA_ID, updatedUserServers);
    
    console.log(`[删除用户] 成功删除用户及相关配置: ${username}`);
    return true;
  } catch (error) {
    console.error(`[删除用户] 删除用户时发生错误: ${username}`, error);
    return false;
  }
};

export const registerUser = async (
  username: string, 
  password: string, 
  email: string,
  phone: string,
  inviteCode: string
): Promise<boolean> => {
  // 检查用户名、邮箱和手机号是否已存在
  const users = await getUsers();
  if (users.some(user => 
    user.username === username || 
    user.email === email || 
    (phone && user.phone === phone) // 手机号可能是可选的，只有当提供了手机号时才检查
  )) {
    return false;
  }
  
  // 使用邀请码
  const codeValid = await markInviteCodeAsUsed(inviteCode, username);
  if (!codeValid) {
    return false;
  }
  
  // 添加新用户
  const newUser: User = {
    username,
    password, // 注意：实际项目中应该对密码进行加密存储
    email,
    phone,
    createdAt: new Date().toISOString(),
    role: 'user',
    inviteCode
  };
  
  const updatedUsers = [...users, newUser];
  return await publishConfig(USERS_DATA_ID, updatedUsers);
};

export const authenticateUser = async (
  identifier: string, 
  password: string
): Promise<User | null> => {
  // 首先检查是否是Nacos管理员账号
  const isNacosAdmin = await authenticateNacosAdmin(identifier, password);
  if (isNacosAdmin) {
    // 如果是Nacos管理员，返回一个管理员用户对象
    return {
      username: identifier,
      password: '', // 不存储密码
      email: `${identifier}@admin.com`,
      phone: '',
      createdAt: new Date().toISOString(),
      role: 'admin',
      inviteCode: ''
    };
  }
  
  // 如果不是Nacos管理员，则检查普通用户 - 支持用户名、邮箱或手机号查找
  const user = await findUserByIdentifier(identifier);
  
  if (user && user.password === password) {
    return user;
  }
  
  return null;
};

// 用户配置管理
export const getUserConfig = async (username: string): Promise<UserConfig | null> => {
  const configs = await getConfig(USER_CONFIGS_DATA_ID) || [];
  return configs.find((config: UserConfig) => config.username === username) || null;
};

export const saveUserConfig = async (username: string, settings: Record<string, any>): Promise<boolean> => {
  const configs = await getConfig(USER_CONFIGS_DATA_ID) || [];
  const configIndex = configs.findIndex((config: UserConfig) => config.username === username);
  
  if (configIndex !== -1) {
    configs[configIndex].settings = settings;
  } else {
    configs.push({
      username,
      settings
    });
  }
  
  return await publishConfig(USER_CONFIGS_DATA_ID, configs);
};

// 用户服务器列表管理
export const getAllServers = async (): Promise<ServerInfo[]> => {
  // 读取系统环境变量中的服务器列表
  const serverIPs = process.env.REACT_APP_WINDOWS_SERVER_IPS?.split(',') || [];
  const serverNames = process.env.REACT_APP_WINDOWS_SERVER_NAMES?.split(',') || [];
  
  // 将环境变量中的服务器信息转换为ServerInfo对象
  const servers: ServerInfo[] = [];
  for (let i = 0; i < serverIPs.length; i++) {
    servers.push({
      id: `server-${i + 1}`,
      name: serverNames[i] || `Server ${i + 1}`,
      ip: serverIPs[i],
      description: `Windows服务器 ${i + 1}`
    });
  }
  
  return servers;
};

export const getUserServers = async (username: string): Promise<ServerInfo[]> => {
  // 如果是管理员，返回所有服务器
  if (username === 'nacos') {
    return await getAllServers();
  }
  
  // 获取用户服务器配置
  const userServersConfig = await getConfig(USER_SERVERS_DATA_ID) || [];
  const userServerEntry = userServersConfig.find(
    (entry: UserServers) => entry.username === username
  );
  
  // 如果找到用户的服务器配置，返回它
  if (userServerEntry) {
    return userServerEntry.servers;
  }
  
  // 未找到配置，返回空数组
  return [];
};

export const assignServerToUser = async (username: string, server: ServerInfo): Promise<boolean> => {
  // 获取用户服务器配置
  const userServersConfig = await getConfig(USER_SERVERS_DATA_ID) || [];
  const userIndex = userServersConfig.findIndex(
    (entry: UserServers) => entry.username === username
  );
  
  if (userIndex !== -1) {
    // 如果用户已存在配置，检查服务器是否已分配
    const serverIndex = userServersConfig[userIndex].servers.findIndex(
      (s: ServerInfo) => s.id === server.id
    );
    
    if (serverIndex === -1) {
      // 添加新服务器
      userServersConfig[userIndex].servers.push(server);
    } else {
      // 更新现有服务器
      userServersConfig[userIndex].servers[serverIndex] = server;
    }
  } else {
    // 添加新的用户服务器配置
    userServersConfig.push({
      username,
      servers: [server]
    });
  }
  
  // 保存配置
  return await publishConfig(USER_SERVERS_DATA_ID, userServersConfig);
};

export const removeServerFromUser = async (username: string, serverId: string): Promise<boolean> => {
  // 获取用户服务器配置
  const userServersConfig = await getConfig(USER_SERVERS_DATA_ID) || [];
  const userIndex = userServersConfig.findIndex(
    (entry: UserServers) => entry.username === username
  );
  
  if (userIndex !== -1) {
    // 过滤掉要删除的服务器
    userServersConfig[userIndex].servers = userServersConfig[userIndex].servers.filter(
      (s: ServerInfo) => s.id !== serverId
    );
    
    // 保存配置
    return await publishConfig(USER_SERVERS_DATA_ID, userServersConfig);
  }
  
  return false; // 用户不存在
}; 
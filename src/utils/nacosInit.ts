import { getInviteCodes, addInviteCode, getUsers, getNacosConfig, publishNacosConfig } from '../api/nacos';

/**
 * 检查配置是否存在，如果不存在则创建初始配置
 */
const ensureConfigExists = async (dataId: string, initialValue: any): Promise<boolean> => {
  try {
    // 尝试获取配置
    const config = await getNacosConfig(dataId);
    
    // 如果配置不存在，创建初始配置
    if (config === null) {
      console.log(`配置 ${dataId} 不存在，正在创建初始配置...`);
      
      // 处理特殊情况：users配置为空时添加管理员账号
      if (dataId === 'users') {
        // 检查必要的环境变量是否存在
        if (!process.env.REACT_APP_NACOS_USERNAME || !process.env.REACT_APP_NACOS_PASSWORD) {
          throw new Error('环境变量 REACT_APP_NACOS_USERNAME 或 REACT_APP_NACOS_PASSWORD 未设置');
        }
        
        const adminUser = {
          username: process.env.REACT_APP_NACOS_USERNAME,
          password: process.env.REACT_APP_NACOS_PASSWORD,
          email: "lucy@lucyai.ai",
          phone: "",
          createdAt: new Date().toISOString(),
          role: "admin",
          inviteCode: "lucyai"
        };
        initialValue = [adminUser];
        console.log(`正在添加管理员账号: ${adminUser.username}`);
      }
      
      const success = await publishNacosConfig(dataId, initialValue);
      if (success) {
        console.log(`成功创建配置 ${dataId}`);
        return true;
      } else {
        console.error(`创建配置 ${dataId} 失败`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`检查配置 ${dataId} 时出错:`, error);
    return false;
  }
};

/**
 * 初始化Nacos配置
 * 检查并确保必要的配置项存在
 * @param options 初始化选项
 */
export const initializeNacos = async (options?: {
  addDefaultInviteCodes?: boolean; // 是否添加默认邀请码，默认为false
  defaultInviteCodes?: string[]; // 自定义默认邀请码
}): Promise<void> => {
  // 设置默认值
  const addDefaultCodes = options?.addDefaultInviteCodes ?? false;
  const defaultCodes = options?.defaultInviteCodes ?? ['LUCYAI001', 'LUCYAI002', 'LUCYAI003'];
  
  try {
    console.log('正在初始化Nacos配置...');
    
    // 确保用户配置存在
    await ensureConfigExists('users', []);
    
    // 确保邀请码配置存在
    await ensureConfigExists('invite-codes', []);
    
    // 确保用户配置存在
    await ensureConfigExists('user-configs', []);
    
    // 确保用户服务器配置存在
    await ensureConfigExists('user-servers', []);
    
    // 检查邀请码
    const inviteCodes = await getInviteCodes();
    console.log(`发现${inviteCodes.length}个邀请码`);
    
    // 只有在开启添加默认邀请码功能且当前没有邀请码时才添加
    if (addDefaultCodes && inviteCodes.length === 0) {
      console.log('添加默认邀请码...');
      
      for (const code of defaultCodes) {
        const success = await addInviteCode(code);
        if (success) {
          console.log(`已添加初始邀请码: ${code}`);
        } else {
          console.error(`添加初始邀请码失败: ${code}`);
        }
      }
    }
    
    // 检查用户
    const users = await getUsers();
    console.log(`发现${users.length}个注册用户`);
    
    console.log('Nacos配置初始化完成');
  } catch (error) {
    console.error('初始化Nacos配置失败:', error);
  }
}; 
/**
 * Guacamole API服务
 * 用于与Guacamole服务器通信，获取认证令牌和连接信息
 */

interface GuacamoleAuthResponse {
  authToken: string;
  username: string;
  dataSource: string;
  availableDataSources: string[];
}

interface GuacamoleConnection {
  identifier: string;
  name: string;
  protocol: string;
}

// 添加创建连接的接口
interface CreateConnectionParams {
  name: string;
  hostname: string;
  port?: string;
  username?: string;
  password?: string;
}

class GuacamoleService {
  private baseUrl: string;
  private authToken: string | null = null;
  private dataSource: string | null = null;
  
  constructor() {
    this.baseUrl = process.env.REACT_APP_GUACAMOLE_URL || '';
    console.log('Guacamole baseUrl:', this.baseUrl); // 添加日志
  }

  /**
   * 获取Guacamole身份验证令牌
   */
  async authenticate(): Promise<boolean> {
    try {
      const username = process.env.REACT_APP_GUACAMOLE_ADMIN_USERNAME || '';
      const password = process.env.REACT_APP_GUACAMOLE_ADMIN_PASSWORD || '';
      
      if (!username || !password) {
        console.log(process.env);
        console.error('Guacamole认证信息未配置');
        return false;
      }

      // 准备认证参数
      const payload = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      
      // 使用正确的API路径
      const response = await fetch(`${this.baseUrl}/api/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload,
      });

      console.log('认证响应状态:', response.status); // 添加日志

      if (!response.ok) {
        console.error('Guacamole认证失败:', await response.text());
        return false;
      }

      const data = await response.json() as GuacamoleAuthResponse;
      this.authToken = data.authToken;
      this.dataSource = data.dataSource || data.availableDataSources[0];
      
      console.log('认证成功，获取到令牌:', this.authToken.substring(0, 10) + '...'); // 添加日志
      return true;
    } catch (error) {
      console.error('Guacamole认证过程中发生错误:', error);
      return false;
    }
  }

  /**
   * 获取连接列表
   */
  async getConnections(): Promise<GuacamoleConnection[]> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        return [];
      }
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/session/data/${this.dataSource}/connections?token=${this.authToken}`
      );

      if (!response.ok) {
        console.error('获取连接列表失败:', await response.text());
        return [];
      }

      const data = await response.json();
      return Object.values(data) as GuacamoleConnection[];
    } catch (error) {
      console.error('获取连接列表过程中发生错误:', error);
      return [];
    }
  }

  /**
   * 根据连接名称查找连接ID
   */
  async findConnectionByName(name: string): Promise<string | null> {
    console.log(`开始查找连接名称: ${name}`);
    const connections = await this.getConnections();
    console.log(`获取到 ${connections.length} 个连接`);
    console.log(`连接列表: ${JSON.stringify(connections)}`);
    
    const connection = connections.find(conn => conn.name === name);
    console.log(`查找结果: ${connection ? JSON.stringify(connection) : 'null'}`);
    
    return connection ? connection.identifier : null;
  }
  
  /**
   * 创建新的RDP连接
   */
  async createConnection(params: CreateConnectionParams): Promise<string | null> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.error('创建连接前认证失败');
        return null;
      }
    }

    try {
      console.log(`尝试创建新连接: ${params.name} (${params.hostname})`);
      
      // 使用传入的用户名和密码，如果没有提供则使用默认值
      const username = params.username || 'Administrator'; // 默认使用Administrator
      const port = params.port || '3389';
      
      // 如果没有提供密码，则返回null，表示需要用户输入
      if (!params.password) {
        console.log('未提供密码，需要用户输入');
        return null;
      }
      
      // 创建连接的JSON数据
      const connectionData = {
        parentIdentifier: "ROOT",
        name: params.name,
        protocol: "rdp",
        parameters: {
          hostname: params.hostname,
          port: port,
          username: username,
          password: params.password,
          security: "any",
          "ignore-cert": "true",
          "enable-drive": "true",
          "create-drive-path": "true",
          "enable-wallpaper": "false",
          "enable-theming": "false",
          "enable-font-smoothing": "true",
          "enable-full-window-drag": "false",
          "enable-desktop-composition": "false",
          "enable-menu-animations": "false",
          "disable-bitmap-caching": "false",
          "disable-offscreen-caching": "false",
          "disable-glyph-caching": "false",
          "color-depth": "24"
        },
        attributes: {
          "max-connections": "1",
          "max-connections-per-user": "1"
        }
      };
      
      // 发送API请求创建连接
      const response = await fetch(
        `${this.baseUrl}/api/session/data/${this.dataSource}/connections?token=${this.authToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(connectionData),
        }
      );
      
      if (!response.ok) {
        console.error('创建连接失败:', await response.text());
        return null;
      }
      
      const data = await response.json();
      console.log('创建连接响应:', data);
      
      // 返回新创建的连接ID
      return data.identifier || null;
    } catch (error) {
      console.error('创建连接过程中发生错误:', error);
      return null;
    }
  }
  
  /**
   * 根据IP地址查找或创建连接
   */
  async getConnectionForServer(serverIp: string, serverName: string, password?: string): Promise<string | null> {
    try {
      console.log(`尝试为服务器 ${serverName} (${serverIp}) 查找连接`);
      
      // 首先尝试按名称查找现有连接
      console.log(`查找连接名称: ${serverName}`);
      const connectionId = await this.findConnectionByName(serverName);
      console.log(`查找结果: ${connectionId}`);
      
      // 如果找到现有连接且提供了密码，先删除旧连接再创建新连接
      if (connectionId && password) {
        console.log(`找到现有连接ID: ${connectionId}，准备删除并重新创建`);
        const deleted = await this.deleteConnection(connectionId);
        console.log(`删除旧连接结果: ${deleted ? '成功' : '失败'}`);
        
        // 如果删除失败，仍然返回现有连接ID
        if (!deleted) {
          console.log(`删除失败，返回现有连接ID: ${connectionId}`);
          return connectionId;
        }
        
        // 删除成功后，创建新连接
        console.log(`删除成功，创建新连接`);
        const newConnectionId = await this.createConnection({
          name: serverName,
          hostname: serverIp,
          password: password
        });
        
        if (newConnectionId) {
          console.log(`成功创建新连接，ID: ${newConnectionId}`);
          return newConnectionId;
        } else {
          console.error(`创建新连接失败`);
          return null;
        }
      }
      
      // 如果找到现有连接且没有提供密码，直接返回
      if (connectionId && !password) {
        console.log(`找到现有连接ID: ${connectionId}，但未提供密码，直接返回`);
        return connectionId;
      }
      
      // 如果找不到现有连接，且提供了密码，尝试创建新连接
      if (!connectionId && password) {
        console.log(`未找到现有连接，尝试创建新连接`);
        const newConnectionId = await this.createConnection({
          name: serverName,
          hostname: serverIp,
          password: password
        });
        
        if (newConnectionId) {
          console.log(`成功创建新连接，ID: ${newConnectionId}`);
          return newConnectionId;
        }
      } else if (!password) {
        console.log(`未提供密码，无法创建连接`);
      }
      
      console.warn(`未能为服务器${serverName}(${serverIp})创建连接，请在Guacamole中手动配置`);
      return null;
    } catch (error) {
      console.error('获取服务器连接过程中发生错误:', error);
      return null;
    }
  }

  /**
   * 删除指定的连接
   */
  async deleteConnection(connectionId: string): Promise<boolean> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        console.error('删除连接前认证失败');
        return false;
      }
    }

    try {
      console.log(`尝试删除连接ID: ${connectionId}`);
      
      // 发送API请求删除连接
      const response = await fetch(
        `${this.baseUrl}/api/session/data/${this.dataSource}/connections/${connectionId}?token=${this.authToken}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        console.error('删除连接失败:', await response.text());
        return false;
      }
      
      console.log(`成功删除连接ID: ${connectionId}`);
      return true;
    } catch (error) {
      console.error('删除连接过程中发生错误:', error);
      return false;
    }
  }

  /**
   * 生成Guacamole客户端URL
   */
  getClientUrl(connectionId: string): string {
    if (!this.authToken || !connectionId) {
      return '';
    }
    
    // 注意：在iframe中使用URL片段（#）可能会有问题
    console.log(`生成客户端URL: baseUrl=${this.baseUrl}, connectionId=${connectionId}, token=${this.authToken.substring(0, 10)}...`);
    
    // 使用标准的片段URL
    return `${this.baseUrl}/#/client/${connectionId}?token=${this.authToken}`;
  }
}

// 导出单例
export const guacamoleService = new GuacamoleService(); 
import CryptoJS from 'crypto-js';
import axios from 'axios';

export interface RegionInfo {
  id: string;
  name: string;
  disabled?: boolean;
}

// 支持的地域列表
export const SUPPORTED_REGIONS: RegionInfo[] = [
  { id: 'ap-guangzhou', name: '华南地区（广州）' },
//   { id: 'ap-beijing', name: '华北地区（北京）' },
//   { id: 'ap-shanghai', name: '华东地区（上海）' },
];

interface TencentCloudConfig {
  secretId: string;
  secretKey: string;
  region: string;
}

interface InstanceFilter {
  Name: string;
  Values: string[];
}

interface InstanceQueryParams {
  instanceIds?: string[];
  filters?: InstanceFilter[];
  offset?: number;
  limit?: number;
  orderField?: string;
  order?: 'ASC' | 'DESC';
  region?: string; // 新增地域参数
}

interface SystemDisk {
  DiskType: string;
  DiskSize: number;
  DiskId: string;
}

interface InternetAccessible {
  InternetChargeType: string;
  InternetMaxBandwidthOut: number;
  PublicIpAssigned: boolean;
}

interface LoginSettings {
  KeyIds: string[];
}

interface Tag {
  Key: string;
  Value: string;
}

export interface LighthouseInstance {
  InstanceId: string;
  BundleId: string;
  BlueprintId: string;
  Zone: string;
  CPU: number;
  Memory: number;
  InstanceName: string;
  OsName: string;
  Platform: string;
  PlatformType: string;
  InstanceChargeType: string;
  SystemDisk: SystemDisk;
  PrivateAddresses: string[];
  PublicAddresses: string[];
  InternetAccessible: InternetAccessible;
  RenewFlag: string;
  LoginSettings: LoginSettings;
  Tags: Tag[];
  InstanceState: string;
  InstanceRestrictState: string;
  Uuid: string;
  LatestOperation: string;
  LatestOperationState: string;
  LatestOperationRequestId: string;
  CreatedTime: string;
  ExpiredTime: string;
  IsolatedTime: string | null;
  Region?: string; // 新增地域字段，用于前端展示
}

export class TencentCloudService {
  private config: TencentCloudConfig;
  private baseUrl: string = 'lighthouse.tencentcloudapi.com';
  private apiVersion: string = '2020-03-24';
  private proxyUrl: string = '/api/tencent-cloud'; // 使用React开发服务器的代理路径

  constructor() {
    this.config = {
      secretId: process.env.REACT_APP_TENCENT_CLOUD_SECRET_ID || '',
      secretKey: process.env.REACT_APP_TENCENT_CLOUD_SECRET_KEY || '',
      region: 'ap-guangzhou',
    };
    
    // 验证配置
    if (!this.config.secretId || !this.config.secretKey) {
      console.warn('腾讯云API密钥未配置，请检查环境变量 REACT_APP_TENCENT_CLOUD_SECRET_ID 和 REACT_APP_TENCENT_CLOUD_SECRET_KEY');
    }

    // 检查是否有自定义代理URL
    if (process.env.REACT_APP_TENCENT_CLOUD_PROXY_URL) {
      this.proxyUrl = process.env.REACT_APP_TENCENT_CLOUD_PROXY_URL;
    }
  }

  // 获取所有支持地域的实例列表
  public async getAllRegionInstances(): Promise<Map<string, LighthouseInstance[]>> {
    const instancesByRegion = new Map<string, LighthouseInstance[]>();
    
    // 并行查询所有地域
    const promises = SUPPORTED_REGIONS.map(async (region) => {
      try {
        const instances = await this.getInstances({ region: region.id });
        
        // 添加地域信息到每个实例
        const instancesWithRegion = instances.map(instance => ({
          ...instance,
          Region: region.id
        }));
        
        instancesByRegion.set(region.id, instancesWithRegion);
      } catch (error) {
        console.error(`获取 ${region.name} 实例列表失败:`, error);
        instancesByRegion.set(region.id, []);
      }
    });
    
    await Promise.all(promises);
    return instancesByRegion;
  }

  // 获取腾讯云轻量服务器实例列表
  public async getInstances(params: InstanceQueryParams = {}): Promise<LighthouseInstance[]> {
    const region = params.region || this.config.region;
    console.log(`正在获取 ${region} 地域的腾讯云实例列表...`);
    
    try {
      const requestData = {
        Action: 'DescribeInstances',
        Version: this.apiVersion,
        Limit: params.limit ?? 100,
        ...this.prepareParams(params),
      };

      const response = await this.sendRequest(requestData, region);
      return response.InstanceSet || [];
    } catch (error) {
      console.error(`获取 ${region} 地域的腾讯云实例列表失败:`, error);
      throw error;
    }
  }

  // 获取实例的VNC URL
  public async getInstanceVncUrl(instanceId: string, region: string = this.config.region): Promise<string> {
    console.log(`正在获取 ${region} 地域实例 ${instanceId} 的VNC URL...`);
    try {
      const requestData = {
        Action: 'DescribeInstanceVncUrl',
        Version: this.apiVersion,
        InstanceId: instanceId,
      };

      const response = await this.sendRequest(requestData, region);
      const vncUrl = response.InstanceVncUrl;
      
      if (!vncUrl) {
        throw new Error('获取VNC URL失败');
      }

      // 组合完整的VNC URL
      const fullVncUrl = `https://img.qcloud.com/qcloud/app/active_vnc/index.html?InstanceVncUrl=${vncUrl}`;
      console.log(`VNC URL生成成功: ${fullVncUrl}`);
      
      return fullVncUrl;
    } catch (error) {
      console.error(`获取实例 ${instanceId} 的VNC URL失败:`, error);
      throw error;
    }
  }

  // 重启实例
  public async rebootInstances(instanceIds: string[], region: string = this.config.region): Promise<string> {
    if (!instanceIds || instanceIds.length === 0) {
      throw new Error('重启实例失败: 未提供实例ID');
    }
    
    console.log(`正在重启 ${region} 地域的实例 ${instanceIds.join(', ')}...`);
    
    try {
      // 使用API文档中指定的格式：InstanceIds作为数组传递
      const requestData = {
        Action: 'RebootInstances',
        Version: this.apiVersion,
        InstanceIds: instanceIds // 直接传递实例ID数组
      };
      
      // 输出请求数据进行调试
      console.log('重启实例请求数据:', JSON.stringify(requestData));
      
      // 调用API
      const response = await this.sendRequest(requestData, region);
      console.log(`重启实例请求成功，RequestId: ${response.RequestId}`);
      
      return response.RequestId;
    } catch (error) {
      console.error(`重启实例失败:`, error);
      throw error;
    }
  }

  // 准备查询参数
  private prepareParams(params: InstanceQueryParams): any {
    const result: any = {};

    // 处理实例ID列表
    if (params.instanceIds && params.instanceIds.length > 0) {
      params.instanceIds.forEach((id, index) => {
        result[`InstanceIds.${index}`] = id;
      });
    }

    // 处理过滤器
    if (params.filters && params.filters.length > 0) {
      params.filters.forEach((filter, filterIndex) => {
        result[`Filters.${filterIndex}.Name`] = filter.Name;
        filter.Values.forEach((value, valueIndex) => {
          result[`Filters.${filterIndex}.Values.${valueIndex}`] = value;
        });
      });
    }

    // 处理其他参数
    if (params.offset !== undefined) result.Offset = params.offset;
    if (params.limit !== undefined) result.Limit = params.limit;
    if (params.orderField) result.OrderField = params.orderField;
    if (params.order) result.Order = params.order;

    return result;
  }

  // 发送请求到腾讯云API
  private async sendRequest(data: any, region: string = this.config.region): Promise<any> {
    // 准备签名
    const timestamp = Math.round(new Date().getTime() / 1000);
    const requestPayload = this.buildRequestPayload(data);
    
    // 计算签名
    const signature = this.sign(timestamp, requestPayload, region);
    
    try {
      console.log(`通过代理发送请求到腾讯云API: ${data.Action}, 地域: ${region}`);

      // 使用本地代理URL而不是直接调用腾讯云API
      const response = await axios({
        method: 'POST',
        url: this.proxyUrl,
        headers: {
          'Content-Type': 'application/json',
          // 下面的头信息会透过代理传递给腾讯云API
          'X-TC-Action': data.Action,
          'X-TC-Region': region,
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Version': data.Version,
          'Authorization': signature,
        },
        data: requestPayload,
      });
      
      if (response.data.Response?.Error) {
        throw new Error(`API错误: ${response.data.Response.Error.Message}`);
      }
      
      return response.data.Response;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // 构建请求体
  private buildRequestPayload(data: any): any {
    const payload: any = { ...data };
    
    // 移除一些特殊字段，这些字段会在header中单独发送
    delete payload.Action;
    delete payload.Version;
    
    // 调试输出，检查是否保留了 InstanceIds 参数
    console.log('构建的请求载荷:', JSON.stringify(payload));
    
    return payload;
  }

  // 计算API签名
  private sign(timestamp: number, payload: any, region: string = this.config.region): string {
    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const service = 'lighthouse';
    
    // 准备签名字符串
    const canonicalHeaders = `content-type:application/json\nhost:${this.baseUrl}\n`;
    const signedHeaders = 'content-type;host';
    
    const payloadJson = JSON.stringify(payload);
    const hashedPayload = CryptoJS.SHA256(payloadJson).toString(CryptoJS.enc.Hex);
    
    const canonicalRequest = [
      'POST',
      '/',
      '',
      canonicalHeaders,
      signedHeaders,
      hashedPayload
    ].join('\n');
    
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);
    
    const stringToSign = [
      'TC3-HMAC-SHA256',
      timestamp,
      credentialScope,
      hashedCanonicalRequest
    ].join('\n');
    
    // 计算签名
    const secretDate = CryptoJS.HmacSHA256(date, 'TC3' + this.config.secretKey);
    const secretService = CryptoJS.HmacSHA256(service, secretDate);
    const secretSigning = CryptoJS.HmacSHA256('tc3_request', secretService);
    const signature = CryptoJS.HmacSHA256(stringToSign, secretSigning).toString(CryptoJS.enc.Hex);
    
    // 生成Authorization
    return `TC3-HMAC-SHA256 Credential=${this.config.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }
}

// 导出腾讯云服务实例
export const tencentCloudService = new TencentCloudService();

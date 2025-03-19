import COS from 'cos-js-sdk-v5';

// 腾讯云COS配置
interface COSConfig {
  SecretId: string;
  SecretKey: string;
  Bucket: string;
  Region: string;
}

// 上传进度回调函数类型
interface UploadProgressCallback {
  (progressData: {
    loaded: number;
    total: number;
    speed: number;
    percent: number;
  }): void;
}

// COS文件项定义
export interface CosFileItem {
  key: string;       // 文件在COS中的完整路径
  name: string;      // 文件名
  url: string;       // 文件访问URL
  size: number;      // 文件大小（字节）
  lastModified: string; // 最后修改时间
  type: string;      // 文件MIME类型
}

// 腾讯云COS服务类
class TencentCOSService {
  private cos: any;
  private config: COSConfig;

  constructor() {
    // 从环境变量获取配置
    this.config = {
      SecretId: process.env.REACT_APP_TENCENT_CLOUD_COS_SECRET_ID || '',
      SecretKey: process.env.REACT_APP_TENCENT_CLOUD_COS_SECRET_KEY || '',
      Bucket: process.env.REACT_APP_TENCENT_COS_BUCKET || '',
      Region: process.env.REACT_APP_TENCENT_COS_REGION || 'ap-guangzhou',
    };

    // 初始化COS对象
    this.cos = new COS({
      // 直接提供永久密钥
      SecretId: this.config.SecretId,
      SecretKey: this.config.SecretKey,
      // 全球加速可能会导致CORS问题，先关闭
      UseAccelerate: false,
      // 指定使用的协议，https更安全
      Protocol: 'https:',
      // 默认将文件分片大小设置为1MB，小文件可以使用更小的值
      SliceSize: 1024 * 1024,
    });

    // 验证配置
    if (!this.config.SecretId || !this.config.SecretKey || !this.config.Bucket) {
      console.warn('腾讯云COS配置不完整，请检查环境变量');
    }
  }

  /**
   * 上传文件到腾讯云COS
   * @param file 要上传的文件
   * @param path 保存路径（不包含文件名）
   * @param onProgress 上传进度回调
   * @returns 返回上传结果，包含文件URL
   */
  async uploadFile(file: File, path: string, onProgress?: UploadProgressCallback): Promise<{ url: string; key: string }> {
    // 确保路径末尾有斜杠
    const normalizedPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    
    // 构建完整的文件路径（Key）
    const key = `${normalizedPath}${file.name}`;
    
    return new Promise((resolve, reject) => {
      try {
        // 使用简单上传方法，对于小文件更简单有效
        if (file.size < 1024 * 1024 * 10) { // 小于10MB的文件使用简单上传
          this.cos.putObject({
            Bucket: this.config.Bucket,
            Region: this.config.Region,
            Key: key,
            Body: file,
            // 添加ACL设置，使文件可公开访问
            ACL: 'public-read',
            onProgress: onProgress,
          }, (err: any, data: any) => {
            if (err) {
              console.error('腾讯云COS上传失败(putObject):', err);
              // 特别处理CORS错误
              if (err.message && err.message.includes('CORS')) {
                console.error('请在腾讯云COS控制台配置存储桶的CORS规则，允许来自localhost:3000的请求');
                reject(new Error('上传失败: 跨域请求(CORS)被拒绝。请联系管理员在腾讯云COS控制台配置存储桶的CORS规则。'));
              } else {
                reject(err);
              }
              return;
            }
            
            // 使用SDK提供的方法获取文件URL，避免域名不一致问题
            this.cos.getObjectUrl({
              Bucket: this.config.Bucket,
              Region: this.config.Region,
              Key: key,
              Expires: 7200, // URL有效期：2小时
              Sign: false, // 不签名，生成永久URL
            }, (err: any, data: any) => {
              if (err) {
                console.warn('获取文件URL失败，使用默认URL构建方式:', err);
                // 备用URL构建方式
                const url = `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}`;
                resolve({ url, key });
              } else {
                resolve({ url: data.Url, key });
              }
            });
          });
        } else {
          // 大文件使用分块上传
          this.cos.uploadFile({
            Bucket: this.config.Bucket,
            Region: this.config.Region,
            Key: key,
            Body: file,
            // 添加ACL设置，使文件可公开访问
            ACL: 'public-read',
            SliceSize: 1024 * 1024 * 5, // 5MB分块上传
            onProgress: onProgress,
          }, (err: any, data: any) => {
            if (err) {
              console.error('腾讯云COS上传失败(uploadFile):', err);
              // 特别处理CORS错误
              if (err.message && err.message.includes('CORS')) {
                console.error('请在腾讯云COS控制台配置存储桶的CORS规则，允许来自localhost:3000的请求');
                reject(new Error('上传失败: 跨域请求(CORS)被拒绝。请联系管理员在腾讯云COS控制台配置存储桶的CORS规则。'));
              } else {
                reject(err);
              }
              return;
            }
            
            // 使用SDK提供的方法获取文件URL，避免域名不一致问题
            this.cos.getObjectUrl({
              Bucket: this.config.Bucket,
              Region: this.config.Region,
              Key: key,
              Expires: 7200, // URL有效期：2小时
              Sign: false, // 不签名，生成永久URL
            }, (err: any, data: any) => {
              if (err) {
                console.warn('获取文件URL失败，使用默认URL构建方式:', err);
                // 备用URL构建方式
                const url = `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}`;
                resolve({ url, key });
              } else {
                resolve({ url: data.Url, key });
              }
            });
          });
        }
      } catch (e) {
        console.error('腾讯云COS上传过程中发生异常:', e);
        reject(e);
      }
    });
  }

  /**
   * 删除COS中的文件
   * @param key 文件路径
   * @returns 
   */
  async deleteFile(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.deleteObject({
        Bucket: this.config.Bucket,
        Region: this.config.Region,
        Key: key,
      }, (err: any, data: any) => {
        if (err) {
          console.error('删除文件失败:', err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * 获取用户上传的文件列表
   * @param prefix 文件路径前缀，通常是用户名
   * @param maxKeys 最大返回数量
   * @returns 文件列表
   */
  async listFiles(prefix: string = '', maxKeys: number = 1000): Promise<CosFileItem[]> {
    return new Promise((resolve, reject) => {
      this.cos.getBucket({
        Bucket: this.config.Bucket,
        Region: this.config.Region,
        Prefix: prefix,
        MaxKeys: maxKeys
      }, (err: any, data: any) => {
        if (err) {
          console.error('获取文件列表失败:', err);
          reject(err);
          return;
        }

        const fileList: CosFileItem[] = data.Contents.map((item: any) => {
          const key = item.Key;
          const name = key.split('/').pop();
          
          // 构建文件URL
          const url = `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}`;
          
          return {
            key,
            name,
            url,
            size: item.Size,
            lastModified: item.LastModified,
            type: this.getFileTypeFromKey(key)
          };
        });
        
        resolve(fileList);
      });
    });
  }

  /**
   * 根据文件扩展名判断文件类型
   * @param key 文件路径
   * @returns 文件MIME类型
   */
  private getFileTypeFromKey(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
  
  /**
   * 从腾讯云COS获取文件内容
   * @param key 文件路径
   * @returns 文件对象
   */
  async getFileContent(key: string, fileName: string, fileType: string): Promise<File> {
    return new Promise((resolve, reject) => {
      this.cos.getObject({
        Bucket: this.config.Bucket,
        Region: this.config.Region,
        Key: key,
        DataType: 'blob'
      }, (err: any, data: any) => {
        if (err) {
          console.error('获取文件内容失败:', err);
          reject(err);
          return;
        }
        
        // 从响应中获取文件Blob
        const fileBlob = data.Body;
        
        // 创建文件对象
        const file = new File([fileBlob], fileName, { type: fileType });
        resolve(file);
      });
    });
  }
}

// 导出单例实例
export const tencentCOSService = new TencentCOSService();

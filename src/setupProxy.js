const { createProxyMiddleware } = require('http-proxy-middleware');

// 增强的内存缓存实现
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 缓存有效期5分钟
const MAX_CACHE_SIZE = 100; // 最大缓存条目数
const CACHEABLE_CONTENT_TYPES = ['application/json', 'text/plain', 'application/xml'];

// 缓存清理函数
const cleanCache = () => {
  // 如果缓存超过最大大小，删除最旧的缓存
  if (cache.size > MAX_CACHE_SIZE) {
    // 找出最旧的缓存项
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey);
      console.log(`[Cache] 删除最旧缓存: ${oldestKey}`);
    }
  }
  
  // 删除过期的缓存项
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
      console.log(`[Cache] 删除过期缓存: ${key}`);
    }
  }
};

// 每分钟执行一次缓存清理
setInterval(cleanCache, 60 * 1000);

// 生成更精确的缓存键
const generateCacheKey = (req) => {
  // 组合URL和查询参数
  const baseKey = req.originalUrl || req.url;
  
  // 对于POST请求，考虑请求体
  if (req.method === 'POST' && req.body) {
    try {
      // 尝试获取请求体的哈希或摘要
      // 这里使用简单的字符串化，生产环境可能需要更复杂的哈希
      const bodyString = typeof req.body === 'string' 
        ? req.body 
        : JSON.stringify(req.body);
      return `${baseKey}:${bodyString}`;
    } catch (e) {
      // 如果无法序列化请求体，回退到使用URL
      console.log('[Cache] 无法序列化请求体，仅使用URL作为缓存键');
      return baseKey;
    }
  }
  
  return baseKey;
};

// 创建缓存中间件
const cacheMiddleware = (req, res, next) => {
  // 只缓存GET和某些POST请求
  if (req.method !== 'GET' && req.method !== 'POST') {
    return next();
  }
  
  // 对于某些不应该缓存的路径，直接跳过
  if (req.path.includes('/real-time/') || req.path.includes('/stream/')) {
    return next();
  }

  const cacheKey = generateCacheKey(req);
  const cachedResponse = cache.get(cacheKey);
  
  if (cachedResponse) {
    const { data, headers, timestamp } = cachedResponse;
    // 检查缓存是否过期
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log(`[Cache] 命中缓存: ${cacheKey}`);
      
      // 设置响应头
      if (headers) {
        Object.keys(headers).forEach(key => {
          res.setHeader(key, headers[key]);
        });
      }
      
      res.send(data);
      return;
    } else {
      // 清除过期缓存
      cache.delete(cacheKey);
    }
  }
  
  // 保存原始的send方法
  const originalSend = res.send;
  
  // 重写send方法以捕获响应数据并缓存
  res.send = function(body) {
    // 检查内容类型，只缓存特定类型的响应
    const contentType = this.getHeader('content-type') || '';
    const shouldCache = CACHEABLE_CONTENT_TYPES.some(type => contentType.includes(type));
    
    if (shouldCache) {
      // 缓存响应数据和部分头信息
      const headersToCache = {
        'content-type': this.getHeader('content-type'),
        'content-language': this.getHeader('content-language'),
        'cache-control': this.getHeader('cache-control'),
      };
      
      cache.set(cacheKey, {
        data: body,
        headers: headersToCache,
        timestamp: Date.now()
      });
      console.log(`[Cache] 缓存响应: ${cacheKey}`);
      
      // 清理缓存，避免无限增长
      if (cache.size > MAX_CACHE_SIZE) {
        cleanCache();
      }
    }
    
    // 调用原始的send方法
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = function(app) {
  // 先应用缓存中间件
  app.use('/api/tencent-cloud', cacheMiddleware);
  
  // 然后设置代理
  app.use(
    '/api/tencent-cloud',
    createProxyMiddleware({
      target: 'https://lighthouse.tencentcloudapi.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/tencent-cloud': ''
      },
      onProxyReq: (proxyReq, req) => {
        // 确保Host头正确设置
        proxyReq.setHeader('Host', 'lighthouse.tencentcloudapi.com');
        
        // 处理POST请求体，确保参数正确传递
        if (req.method === 'POST' && req.body) {
          try {
            // 如果请求体已经是字符串，则直接使用
            let bodyData = req.body;
            
            // 如果请求体是对象，则转为JSON字符串
            if (typeof req.body !== 'string') {
              bodyData = JSON.stringify(req.body);
            }
            
            // 修改请求体并重写Content-Length
            const bodyLength = Buffer.byteLength(bodyData);
            proxyReq.setHeader('Content-Length', bodyLength);
            
            // 写入请求体
            proxyReq.write(bodyData);
            
            console.log(`[Proxy] POST请求体已重写，长度: ${bodyLength}字节`);
          } catch (error) {
            console.error('[Proxy] 处理请求体时出错:', error);
          }
        }
        
        // 在开发环境下记录请求信息
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Proxy] 请求: ${req.method} ${req.path}`);
          
          // 记录请求头信息，用于调试
          console.log('[Proxy] 请求头:', JSON.stringify(proxyReq.getHeaders()));
          
          // 记录请求参数，用于调试
          if (req.body) {
            console.log('[Proxy] 请求体:', typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
          }
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // 为响应添加缓存相关的HTTP头
        proxyRes.headers['Cache-Control'] = 'max-age=300'; // 5分钟缓存
        
        // 添加标识响应时间的头部
        proxyRes.headers['X-Response-Time'] = new Date().toISOString();
        
        // 在开发环境下记录响应状态
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Proxy] 响应: ${proxyRes.statusCode} ${req.path}`);
        }
      },
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
    })
  );
  
  // 添加缓存统计端点（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/cache-stats', (req, res) => {
      res.json({
        cacheSize: cache.size,
        maxSize: MAX_CACHE_SIZE,
        cacheTTL: CACHE_TTL / 1000, // 转换为秒
        cacheKeys: Array.from(cache.keys())
      });
    });
  }
}; 
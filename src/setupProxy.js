const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/tencent-cloud',
    createProxyMiddleware({
      target: 'https://lighthouse.tencentcloudapi.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/tencent-cloud': ''
      },
      onProxyReq: (proxyReq) => {
        // 确保Host头正确设置
        proxyReq.setHeader('Host', 'lighthouse.tencentcloudapi.com');
      },
      logLevel: 'debug' // 开发时使用debug级别查看详细日志
    })
  );
}; 
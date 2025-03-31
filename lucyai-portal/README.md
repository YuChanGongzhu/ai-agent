# LucyAI 公司门户网站

这是一个基于Next.js和Docker的公司门户网站项目，支持PDF文档展示和后台控制台跳转功能。

## 功能特点

- 简洁科技风格的公司门户网站
- 集成PDF文档查看功能
- 响应式设计，适配各种设备
- 提供到LucyAI智能客服控制台的跳转按钮
- 使用TypeScript开发，提供类型安全
- 通过Docker容器化部署

## 目录结构

```
lucyai-portal/
├── app/                  # Next.js 应用目录
│   ├── components/       # 可复用组件
│   ├── docs/             # 文档页面
│   └── globals.css       # 全局样式
├── public/               # 静态资源
│   ├── images/           # 图片资源
│   └── pdfs/             # PDF文档
├── .env                  # 环境变量
├── .env.example          # 环境变量示例
├── docker-compose.yml    # Docker Compose配置
└── next.config.js        # Next.js配置
```

## 开发环境设置

### 使用Docker开发（推荐）

1. 确保已安装Docker和Docker Compose
2. 复制环境变量文件：
```bash
cp .env.example .env
```
3. 运行以下命令启动开发环境:
```bash
docker-compose up
```
4. 浏览器访问 http://localhost:3000

### 手动开发

1. 安装依赖:
```bash
npm install
```
2. 启动开发服务器:
```bash
npm run dev
```

## 生产环境部署

使用Docker Compose进行生产环境部署:

```bash
docker-compose -f docker-compose.yml up -d web-prod
```

## 环境变量

项目使用.env文件进行配置，可以设置以下变量:

- `NEXT_PUBLIC_SITE_NAME`: 网站名称
- `NEXT_PUBLIC_SITE_DESCRIPTION`: 网站描述
- `NEXT_PUBLIC_ADMIN_URL`: 管理控制台URL
- `PORT`: 服务器端口
- `HOST`: 服务器主机

## PDF文档

项目支持在文档中心展示PDF文件。要添加新的PDF文档:

1. 将PDF文件放在 `public/pdfs/` 目录下
2. 在 `app/docs/page.tsx` 文件中的documents数组中添加新文档信息 
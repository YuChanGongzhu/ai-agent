# AI-Agent 项目

基于React的前端项目，使用Docker进行开发和部署。

## Docker快速启动

### 环境准备

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 根据需要修改`.env`文件中的配置

### 启动项目

```bash
# 启动项目（前台运行）
docker-compose up

# 后台运行
docker-compose up -d
```

访问地址：http://localhost:3000

### 停止项目

```bash
docker-compose down
```

## 代码更新方式

### 方式一：手动更新

```bash
# 停止容器
docker-compose down

# 拉取最新代码
git pull

# 重新启动
docker-compose up -d
```

### 方式二：自动更新（Webhook）

项目包含GitHub Webhook服务，配置后可自动更新代码：

1. GitHub仓库设置中添加Webhook：
   - URL: `http://你的服务器IP:5001/update`
   - 类型: `application/json`
   - 事件: 仅推送事件

2. 每次推送代码到仓库时，服务器会自动更新

## 常用命令

```bash
# 进入容器
docker-compose exec web_ui sh

# 安装依赖
docker-compose exec web_ui yarn add 包名

# 构建生产版本
docker-compose exec web_ui yarn build

# 查看日志
docker-compose logs
docker-compose logs -f  # 实时查看
```

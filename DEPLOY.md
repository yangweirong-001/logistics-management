# Docker 部署指南

## 快速开始

### 方式一：使用 Docker Compose（推荐）

1. **复制环境变量文件**
   ```bash
   cp .env.example .env
   ```

2. **编辑 .env 文件，填入你的 Supabase 配置**
   ```bash
   COZE_SUPABASE_URL=https://your-project.supabase.co
   COZE_SUPABASE_ANON_KEY=your-anon-key
   COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **启动服务**
   ```bash
   docker-compose up -d --build
   ```

4. **访问应用**
   - 打开浏览器访问：http://localhost:5000/logistics

### 方式二：使用 Docker 命令

1. **构建镜像**
   ```bash
   docker build \
     --build-arg COZE_SUPABASE_URL=https://your-project.supabase.co \
     --build-arg COZE_SUPABASE_ANON_KEY=your-anon-key \
     --build-arg COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
     -t logistics-app .
   ```

2. **运行容器**
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e COZE_SUPABASE_URL=https://your-project.supabase.co \
     -e COZE_SUPABASE_ANON_KEY=your-anon-key \
     -e COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
     --name logistics-management \
     logistics-app
   ```

## 部署到云平台

### 阿里云容器服务（ACK）

1. 推送镜像到阿里云容器镜像服务（ACR）
2. 在 ACK 中创建部署，配置环境变量
3. 配置负载均衡暴露服务

### 腾讯云容器服务（TKE）

流程类似阿里云

### Railway.app

1. 连接 GitHub 仓库
2. Railway 会自动检测 Dockerfile
3. 添加环境变量 `COZE_SUPABASE_URL` 等
4. 自动部署

### Zeabur

1. 导入 GitHub 仓库
2. 选择 Docker 部署
3. 配置环境变量
4. 一键部署

## 常用命令

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新部署
docker-compose up -d --build
```

## 端口说明

- 应用运行在 5000 端口
- 可在 docker-compose.yml 中修改映射端口

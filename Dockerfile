# 构建阶段
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 设置构建时环境变量（占位符，实际运行时通过 -e 传入）
ARG COZE_SUPABASE_URL
ARG COZE_SUPABASE_ANON_KEY
ARG COZE_SUPABASE_SERVICE_ROLE_KEY

ENV COZE_SUPABASE_URL=$COZE_SUPABASE_URL
ENV COZE_SUPABASE_ANON_KEY=$COZE_SUPABASE_ANON_KEY
ENV COZE_SUPABASE_SERVICE_ROLE_KEY=$COZE_SUPABASE_SERVICE_ROLE_KEY

# 构建应用
RUN pnpm run build

# 运行阶段
FROM node:20-alpine AS runner

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV PORT=5000

# 复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.coze ./
COPY --from=builder /app/src/server.ts ./src/server.ts
COPY --from=builder /app/tsconfig.json ./

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["pnpm", "run", "start"]

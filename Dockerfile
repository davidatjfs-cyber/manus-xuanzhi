# 使用 Node.js 官方镜像作为基础镜像
FROM node:22-slim AS base

# 安装 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
FROM base AS deps
RUN --mount=type=cache,id=s/manus-xuanzhi-pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# 构建项目
FROM deps AS build
ARG OAUTH_SERVER_URL
ENV OAUTH_SERVER_URL=$OAUTH_SERVER_URL
COPY . .
RUN pnpm run build

# 运行环境
FROM base AS runner
WORKDIR /app

# 复制构建产物和必要的运行文件
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/client ./client

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]

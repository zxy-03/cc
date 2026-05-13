# AI 圆桌会议系统 - 多模型协作对话平台

## 项目概述

AI圆桌会议系统是一个支持多模型协作的AI对话平台，具备以下核心功能：

### 核心功能

1. **圆桌会议模式**：多个AI模型同时回答相同问题，便于对比分析

2. **分工协作模式**：支持从提示词解析任务分工，各模型各司其职
   - 支持格式：`任务A、任务B、任务C`
   - 自动解析并分配任务给不同模型

3. **SaaS架构**：完整的多租户SaaS服务
   - 用户认证与授权
   - 订阅计划管理
   - API密钥管理
   - 使用统计与限流

## 技术架构

### 前端
- React 18 + TypeScript
- Vite 构建工具
- TailwindCSS 样式框架
- React Router 路由管理

### 后端
- Node.js + Express + TypeScript
- JWT 认证
- 文件存储（多租户数据隔离）

### AI模型支持
- Claude（Anthropic）
- DeepSeek

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 1. 安装依赖

**后端**：
```bash
cd cc/backend
npm install
```

**前端**：
```bash
cd cc/frontend
npm install
npm install react-router-dom
```

### 2. 配置环境变量

在 `cc/backend/.env` 文件中配置：

```env
# 服务端口
PORT=3001

# JWT密钥（生产环境请使用安全的随机字符串）
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Claude API配置
ANTHROPIC_API_KEY=your-anthropic-api-key

# DeepSeek API配置
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 3. 启动服务

**启动后端**（终端1）：
```bash
cd cc/backend
npm run dev
```

后端服务运行在：`http://localhost:3001`

**启动前端**（终端2）：
```bash
cd cc/frontend
npm run dev
```

前端服务运行在：`http://localhost:5173`

### 4. 访问应用

打开浏览器访问：`http://localhost:5173`

## 使用指南

### 首次使用

1. 点击「Sign up」注册新账号
2. 填写邮箱、密码、姓名等信息
3. 注册成功后自动登录进入主界面

### 圆桌会议模式

1. 选择「圆桌会议」模式
2. 从左侧模型列表中选择一个或多个模型
3. 在输入框中输入问题
4. 点击「开始会议」，所有模型将同时回答

### 分工协作模式

1. 选择「分工协作」模式
2. 选择多个模型（数量建议与任务数一致）
3. 输入包含任务分工的提示词，例如：
   ```
   请帮我分析这个市场调研项目，有以下任务：
   任务A：分析市场趋势和竞争格局
   任务B：提供创意营销策略建议
   任务C：总结关键发现和建议
   ```
4. 系统自动解析任务并分配给各模型

## API接口

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 对话接口（需认证）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/models` | 获取可用模型列表 |
| POST | `/api/chat` | 单模型对话 |
| POST | `/api/roundtable` | 圆桌会议（多模型并行） |
| POST | `/api/collaboration` | 分工协作（自定义任务） |

### 订阅接口（需认证）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/subscription/plans` | 获取订阅计划列表 |
| GET | `/api/subscription/current` | 获取当前订阅信息 |
| POST | `/api/subscription/upgrade` | 升级订阅计划 |
| GET | `/api/subscription/usage` | 获取使用统计 |

### API密钥接口（需认证）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/api-keys` | 获取API密钥列表 |
| POST | `/api/api-keys` | 创建新API密钥 |
| DELETE | `/api/api-keys/:id` | 删除API密钥 |

## 订阅计划

| 计划 | 价格/月 | API密钥数 | 请求限制 | Token限制 |
|------|---------|----------|----------|-----------|
| Free | $0 | 1 | 10 req/min | 100K |
| Pro | $99 | 5 | 60 req/min | 1M |
| Enterprise | $399 | 无限制 | 300 req/min | 无限制 |

## 项目结构

```
cc/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── adapters/           # AI模型适配器
│   │   ├── config/            # 配置文件
│   │   ├── routes/            # API路由
│   │   ├── scheduler/         # 调度器（协作逻辑）
│   │   ├── middleware/        # 中间件
│   │   ├── store/             # 数据存储
│   │   ├── types/             # 类型定义
│   │   ├── utils/             # 工具函数
│   │   └── server.ts          # 入口文件
│   └── .env                   # 环境变量配置
│
└── frontend/                  # 前端应用
    ├── src/
    │   ├── api/               # API客户端
    │   ├── components/        # UI组件
    │   ├── contexts/          # React上下文
    │   ├── pages/             # 页面组件
    │   ├── types/             # 类型定义
    │   ├── App.tsx            # 主应用组件
    │   └── main.tsx           # 入口文件
    └── package.json
```

## 开发命令

### 后端

```bash
npm run dev       # 开发模式（热重载）
npm run build     # 构建生产版本
npm start         # 启动生产版本
```

### 前端

```bash
npm run dev       # 开发模式
npm run build     # 构建生产版本
npm run lint      # ESLint检查
npm run preview   # 预览构建结果
```

## 安全注意事项

1. **环境变量**：生产环境务必使用安全的JWT_SECRET
2. **API密钥**：妥善保管AI服务商的API密钥
3. **密码存储**：用户密码使用SHA-256哈希存储
4. **HTTPS**：生产环境请配置HTTPS

## License

MIT License
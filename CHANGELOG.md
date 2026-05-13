# 变更日志 (Changelog)

## [v2.1.0] - 2026-05-13

### 🐛 Bug修复

#### 任务解析器Bug - 分工协作模式任务丢失
**问题描述**：
当用户使用分工协作模式并输入包含多个任务的提示词时（如"任务A：xxx 任务B：xxx 任务C：xxx"），系统只能识别并分配第一个任务（任务A），其余任务被忽略。

**影响范围**：
- `src/utils/TaskParser.ts` - 任务解析核心逻辑
- `src/scheduler/CollaborationScheduler.ts` - 任务调度器
- 前端分工协作功能

**根本原因**：
1. `extractTaskSection` 方法的正则表达式无法正确匹配 `任务A：xxx 任务B：xxx` 格式
2. 解析逻辑在处理中文冒号（：）分隔的任务描述时出现问题
3. 边界确定逻辑错误，导致后续任务内容被截断或丢失

**修复方案**：
- 完全重写 `extractAllTasks` 方法，采用直接标签查找策略
- 按标签长度排序（任务AA > 任务A）确保正确匹配
- 智能确定任务边界：向前查找当前任务开始位置，向后查找下一个任务确定结束位置
- 增加多重回退机制（fallbackParse）提高解析成功率

**修复文件**：
- `cc/backend/src/utils/TaskParser.ts`
- `cc/frontend/src/types/auth.ts` (附带修复前端类型错误)
- `cc/frontend/src/pages/DashboardPages.tsx` (附带移除未使用变量)

**测试验证**：
- ✅ 后端 TypeScript 编译通过
- ✅ 前端 TypeScript 编译通过

---

## [v2.0.0] - 2026-05-13

### ✨ 新功能

#### 1. 分工协作自定义任务 (Collaboration Mode)
**功能描述**：
支持从提示词中自动解析和提取任务分工，各AI模型各司其职。

**使用示例**：
```
提示词：请帮我分析这个项目，有以下任务：
任务A：进行市场分析
任务B：提供创意方案
任务C：总结结论
```

**技术实现**：
- `src/utils/TaskParser.ts` - 任务解析工具
- `src/types/coordination.ts` - 类型定义
- `src/scheduler/CollaborationScheduler.ts` - 协作调度器
- `src/routes/collaboration.ts` - API路由
- 前端 `CollaborationBoard.tsx` - 可视化组件

#### 2. SaaS多租户服务架构
**功能描述**：
完整的SaaS服务架构，支持多租户、用户认证、订阅管理和API密钥管理。

**核心组件**：

| 模块 | 文件 | 功能 |
|------|------|------|
| 类型定义 | `src/types/saas.ts` | 租户、用户、订阅、API密钥类型 |
| 数据存储 | `src/store/SaasStore.ts` | 多租户数据存储 |
| JWT工具 | `src/utils/JwtUtils.ts` | 令牌生成和验证 |
| 认证中间件 | `src/middleware/auth.ts` | JWT验证、限流、租户隔离 |
| 认证路由 | `src/routes/auth.ts` | 注册/登录/刷新令牌 |
| 订阅路由 | `src/routes/subscription.ts` | 订阅管理 |
| API密钥路由 | `src/routes/apiKeys.ts` | API密钥CRUD |

**订阅计划**：
| 计划 | 价格 | API密钥 | 请求限制 | Token限制 |
|------|------|---------|----------|-----------|
| Free | $0 | 1 | 10 req/min | 100K/月 |
| Pro | $99 | 5 | 60 req/min | 1M/月 |
| Enterprise | $399 | 无限制 | 300 req/min | 无限制 |

**前端页面**：
| 页面 | 文件 | 功能 |
|------|------|------|
| 认证上下文 | `src/contexts/AuthContext.tsx` | 全局认证状态 |
| 登录/注册 | `src/pages/AuthPages.tsx` | 用户认证 |
| 订阅管理 | `src/pages/DashboardPages.tsx` | 订阅和API密钥 |

### 🔧 改进

- JWT访问令牌有效期：15分钟
- 刷新令牌有效期：7天
- 密码存储：SHA-256哈希
- API密钥：一次性显示（安全设计）

---

## [v1.0.0] - 2026-05-13

### ✨ 初始版本

#### 核心功能
- **圆桌会议模式**：多个AI模型同时回答相同问题
- **单模型对话**：与单个AI模型进行对话
- **模型支持**：Claude (Anthropic)、DeepSeek

#### 技术栈
- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：Node.js + Express + TypeScript
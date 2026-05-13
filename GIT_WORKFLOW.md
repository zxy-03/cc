# Git 版本控制流程

## 分支策略

### 主分支 (Main Branch)
- **`main`**: 生产环境稳定代码，所有版本标签从这里创建
- **保护规则**: 禁止直接push，必须通过Pull Request合并

### 开发分支 (Development Branch)
- **`develop`**: 开发环境集成分支
- 所有功能开发完成后合并到此分支进行测试

### 功能分支 (Feature Branches)
- **命名格式**: `feature/xxx`
- 从 `develop` 分支创建
- 完成后合并回 `develop`

### Bug修复分支 (Bugfix Branches)
- **命名格式**: `bugfix/xxx`
- 从 `develop` 或 `main` 创建
- 紧急修复直接合并到 `main` 和 `develop`

## 版本号规则

### 格式
```
v<major>.<minor>.<patch>
```

### 规则
- **Major (主版本)**: 不兼容的API变更，重大架构变更
- **Minor (次版本)**: 新功能添加，向后兼容
- **Patch (补丁)**: Bug修复，向后兼容

### 示例
- `v1.0.0`: 初始版本
- `v1.1.0`: 添加新功能
- `v1.1.1`: 修复Bug
- `v2.0.0`: 重大重构/不兼容变更

## 标签管理

### 创建标签
```bash
# 创建带注释的标签
git tag -a v1.0.0 -m "v1.0.0: 初始版本"

# 推送到远程仓库
git push origin v1.0.0
```

### 查看标签
```bash
# 列出所有标签
git tag

# 查看标签详情
git show v1.0.0
```

### 切换到指定版本
```bash
git checkout v1.0.0
```

## 提交规范

### 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug修复 |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 代码重构 |
| test | 测试相关 |
| chore | 构建/工具 |

### Scope 范围
- backend: 后端代码
- frontend: 前端代码
- config: 配置文件
- docs: 文档

### 示例
```
feat(backend): 实现分工协作任务解析器

- 支持从提示词解析任务结构
- 支持任务A、任务B、任务C格式
- 添加调试日志

Closes #123
```

## 工作流程

### 1. 创建功能分支
```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-feature
```

### 2. 开发和提交
```bash
# 开发代码
git add .
git commit -m "feat(backend): 添加新功能"
```

### 3. 推送到远程
```bash
git push origin feature/new-feature
```

### 4. 创建Pull Request
- 从 `feature/new-feature` 合并到 `develop`
- 等待代码审查

### 5. 合并和删除分支
```bash
git checkout develop
git merge --no-ff feature/new-feature
git push origin develop
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### 6. 发布版本
```bash
git checkout main
git merge --no-ff develop
git tag -a v1.0.0 -m "v1.0.0: 发布说明"
git push origin main
git push origin v1.0.0
```

## 版本追溯

### 查看历史
```bash
# 查看提交历史
git log

# 查看带图形的历史
git log --oneline --graph --all

# 查看指定文件的变更历史
git log --follow -- path/to/file
```

### 回滚操作
```bash
# 撤销最后一次提交（保留更改）
git reset HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1

# 恢复已删除的提交
git reflog
git checkout <commit-hash>
```

### 对比版本
```bash
# 对比两个版本
git diff v1.0.0 v2.0.0

# 对比某个文件的版本差异
git diff v1.0.0 v2.0.0 -- path/to/file
```

## 远程仓库同步

### 添加远程仓库
```bash
git remote add origin <repository-url>
```

### 推送所有内容
```bash
# 推送分支
git push origin main

# 推送所有标签
git push origin --tags
```

### 拉取更新
```bash
git pull origin main
```

## 注意事项

1. **定期拉取**: 每天开始工作前执行 `git pull`
2. **小提交**: 每次提交只包含一个逻辑单元的变更
3. **写好注释**: 提交信息清晰描述变更内容
4. **代码审查**: 重要变更必须经过代码审查
5. **标签发布**: 每个正式版本必须创建标签
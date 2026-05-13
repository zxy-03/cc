# Git 自动化配置指南

## 概述

本指南介绍如何配置 SSH 密钥和 Git Hooks，实现代码提交后自动推送到远程仓库。

---

## 一、SSH 密钥配置

### 1.1 生成 SSH 密钥

```bash
# 生成 Ed25519 密钥（推荐）
ssh-keygen -t ed25519 -C "your-email@example.com"

# 或使用 RSA（兼容性更好）
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

**提示**：按 Enter 键使用默认路径，设置空密码（方便自动推送）。

### 1.2 密钥文件位置

```
# 私钥（保密！）
C:\Users\YourUser\.ssh\id_ed25519

# 公钥（需要添加到 GitHub）
C:\Users\YourUser\.ssh\id_ed25519.pub
```

### 1.3 添加公钥到 GitHub

1. 查看公钥内容：
```bash
type "%USERPROFILE%\.ssh\id_ed25519.pub"
```

2. 登录 GitHub → **Settings** → **SSH and GPG keys** → **New SSH key**

3. 粘贴公钥内容并保存

### 1.4 测试连接

```bash
ssh -T git@github.com

# 预期输出：
# Hi your-username! You've successfully authenticated...
```

---

## 二、Git Hooks 自动推送

### 2.1 创建 post-commit Hook

在项目目录的 `.git/hooks/` 下创建 `post-commit` 文件：

```bash
#!/bin/bash
# Git post-commit hook - 自动推送代码到远程仓库

echo "========================================"
echo "  🚀 自动推送代码到远程仓库..."
echo "========================================"

# 推送主分支
echo ""
echo "📤 推送 main 分支..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ main 分支推送成功"
else
    echo "❌ main 分支推送失败"
    exit 1
fi

# 推送所有标签
echo ""
echo "🏷️  推送标签..."
git push origin --tags

if [ $? -eq 0 ]; then
    echo "✅ 标签推送成功"
else
    echo "❌ 标签推送失败"
    exit 1
fi

echo ""
echo "========================================"
echo "  🎉 推送完成！"
echo "========================================"
```

### 2.2 配置远程仓库

```bash
# 添加远程仓库
git remote add origin git@github.com:your-username/your-repo.git

# 验证配置
git remote -v

# 首次推送（需要设置上游分支）
git push -u origin main
git push origin --tags
```

---

## 三、使用效果

### 3.1 日常开发流程

```bash
# 修改代码后
git add .
git commit -m "feat: 描述你的变更"

# 自动执行以下操作：
# 🚀 自动推送代码到远程仓库...
# 📤 推送 main 分支...
# ✅ main 分支推送成功
# 🏷️  推送标签...
# ✅ 标签推送成功
# 🎉 推送完成！
```

### 3.2 创建版本标签

```bash
# 创建标签
git tag -a v1.0.0 -m "v1.0.0: 发布说明"

# 提交后自动推送标签
git add .
git commit -m "chore: 发布 v1.0.0"
```

---

## 四、故障排除

### 4.1 SSH 连接失败

**问题**：`ssh: connect to host github.com port 22: Connection refused`

**解决方案**：
```bash
# 使用 HTTPS 端口（部分网络环境屏蔽 22 端口）
# 在 ~/.ssh/config 中添加：
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  Port 443
```

### 4.2 Hook 不执行

**问题**：提交后没有自动推送

**解决方案**：
```bash
# 检查 Hook 文件权限（Linux/Mac）
chmod +x .git/hooks/post-commit

# Windows 用户确保脚本编码为 UTF-8（无 BOM）
```

### 4.3 密钥被拒绝

**问题**：`Permission denied (publickey)`

**解决方案**：
```bash
# 检查密钥是否正确添加到 ssh-agent
ssh-add -l

# 如果没有，添加密钥
ssh-add ~/.ssh/id_ed25519
```

---

## 五、安全建议

1. **保护私钥**：不要分享或提交 `.ssh/id_ed25519` 文件
2. **定期轮换密钥**：建议每 6-12 个月重新生成密钥
3. **使用密钥密码**：对于敏感仓库，设置密码保护密钥
4. **限制密钥权限**：在 GitHub 上可以限制密钥仅用于特定仓库

---

## 六、配置文件清单

| 文件 | 说明 |
|------|------|
| `~/.ssh/id_ed25519` | SSH 私钥 |
| `~/.ssh/id_ed25519.pub` | SSH 公钥 |
| `~/.ssh/config` | SSH 配置（可选） |
| `.git/hooks/post-commit` | 自动推送脚本 |

---

## 七、常用命令

```bash
# 查看远程仓库配置
git remote -v

# 修改远程仓库地址
git remote set-url origin git@github.com:username/repo.git

# 查看已添加的密钥
ssh-add -l

# 删除已添加的密钥
ssh-add -d ~/.ssh/id_ed25519

# 查看标签列表
git tag -l

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin :v1.0.0
```
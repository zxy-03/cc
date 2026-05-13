@echo off
chcp 65001 >nul
echo ========================================
echo          SSH 配置辅助工具
echo ========================================
echo.

echo 1. 显示 SSH 公钥内容：
echo ----------------------------------------
type "%USERPROFILE%\.ssh\id_ed25519.pub"
echo.

echo 2. 复制公钥到剪贴板：
echo ----------------------------------------
clip < "%USERPROFILE%\.ssh\id_ed25519.pub"
echo 公钥已复制到剪贴板！
echo.

echo 3. 下一步操作：
echo ----------------------------------------
echo 1. 登录 GitHub
echo 2. 进入 Settings - SSH and GPG keys
echo 3. 点击 New SSH key
echo 4. 粘贴公钥内容
echo 5. 测试连接：ssh -T git@github.com
echo.

echo ========================================
pause
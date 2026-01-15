@echo off
chcp 65001 >nul
echo ================================================
echo   东山国际旅游管理系统 - 一键部署脚本
echo   East Mount Luxury Travel - Auto Deploy
echo ================================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version
echo.

REM 检查 npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 npm
    pause
    exit /b 1
)

echo ✅ npm 已安装
npm --version
echo.

REM 检查 Vercel CLI
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 正在安装 Vercel CLI...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Vercel CLI 安装失败
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI 安装成功
) else (
    echo ✅ Vercel CLI 已安装
)
echo.

REM 安装项目依赖
echo 📦 安装项目依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成
echo.

REM 运行部署
echo 🚀 开始部署到 Vercel...
echo.
call vercel --prod

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   🎉 部署成功！
    echo ================================================
    echo.
    echo 你的网站已经上线！
    echo Vercel 已经显示了你的网址。
    echo.
    echo 下一步：
    echo 1. 使用测试账号登录: admin / admin123
    echo 2. 修改默认密码（参考 README.md）
    echo 3. 将网址分享给你的员工
    echo.
) else (
    echo.
    echo ❌ 部署失败，请查看错误信息
    echo 常见问题解决方案请参考 DEPLOYMENT_GUIDE.md
)

pause

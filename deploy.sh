#!/bin/bash

echo "================================================"
echo "  东山国际旅游管理系统 - 一键部署脚本"
echo "  East Mount Luxury Travel - Auto Deploy"
echo "================================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未检测到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装 Vercel CLI
echo "📦 检查 Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Vercel CLI 安装失败"
        exit 1
    fi
    echo "✅ Vercel CLI 安装成功"
else
    echo "✅ Vercel CLI 已安装"
fi
echo ""

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装完成"
echo ""

# 运行部署
echo "🚀 开始部署到 Vercel..."
echo ""
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "  🎉 部署成功！"
    echo "================================================"
    echo ""
    echo "你的网站已经上线！"
    echo "Vercel 已经显示了你的网址。"
    echo ""
    echo "下一步："
    echo "1. 使用测试账号登录: admin / admin123"
    echo "2. 修改默认密码（参考 README.md）"
    echo "3. 将网址分享给你的员工"
    echo ""
else
    echo ""
    echo "❌ 部署失败，请查看错误信息"
    echo "常见问题解决方案请参考 DEPLOYMENT_GUIDE.md"
fi

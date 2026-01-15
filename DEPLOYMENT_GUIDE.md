# 🚀 东山国际旅游系统 - 超详细部署指南

## 📋 部署前准备

你需要：
1. 一个邮箱（用于注册Vercel账号）
2. 这个项目文件夹（已经包含所有必要文件）

---

## 🎯 方案A：使用 Vercel 网页部署（最简单，推荐新手）

### 第一步：注册 Vercel 账号

1. 打开浏览器，访问：**https://vercel.com**
2. 点击右上角 **"Sign Up"（注册）**
3. 选择注册方式（推荐使用邮箱）：
   - 使用 GitHub 账号（如果有）
   - 使用 GitLab 账号（如果有）
   - 使用 Email（最简单）

### 第二步：准备项目文件

**重要：你需要先把项目上传到 GitHub**

#### 选项1：使用 GitHub Desktop（最简单）

1. 下载并安装 GitHub Desktop: https://desktop.github.com
2. 登录你的 GitHub 账号（没有的话先注册一个）
3. 点击 "File" → "Add Local Repository"
4. 选择 `east-mount-deploy` 文件夹
5. 点击 "Publish repository"
6. 输入仓库名称（如：east-mount-travel）
7. 取消勾选 "Keep this code private"（或者保持私有也可以）
8. 点击 "Publish repository"

#### 选项2：使用命令行（适合有经验的用户）

```bash
# 进入项目目录
cd east-mount-deploy

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 在 GitHub 网站上创建一个新仓库，然后：
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 第三步：在 Vercel 部署

1. 登录 Vercel 后，点击右上角 **"Add New..."**
2. 选择 **"Project"**
3. 点击 **"Import Git Repository"**
4. 找到你刚才上传的 `east-mount-travel` 仓库
5. 点击 **"Import"**
6. 配置项目（通常会自动识别，无需修改）：
   - Framework Preset: **Vite**（应该自动选择）
   - Root Directory: **./（保持默认）**
   - Build Command: **npm run build**（自动填充）
   - Output Directory: **dist**（自动填充）
7. 点击 **"Deploy"**
8. 等待 1-2 分钟，部署完成！

### 第四步：获取网址

部署完成后，Vercel 会显示：
- ✅ 绿色的勾表示部署成功
- 🌐 会显示你的网站地址，格式如：
  - `https://east-mount-travel.vercel.app`
  - `https://east-mount-travel-xxxx.vercel.app`

**这就是你的专属网址！可以分享给员工使用了！**

---

## 🎯 方案B：使用 Vercel CLI 部署（更快，但需要命令行）

### 第一步：安装 Node.js

1. 访问：https://nodejs.org
2. 下载并安装 LTS 版本（长期支持版）
3. 安装完成后，打开终端/命令提示符，输入：
   ```bash
   node --version
   ```
   如果显示版本号，说明安装成功

### 第二步：安装 Vercel CLI

在终端中输入：
```bash
npm install -g vercel
```

等待安装完成（可能需要几分钟）

### 第三步：部署项目

1. 打开终端，进入项目目录：
   ```bash
   cd path/to/east-mount-deploy
   ```

2. 运行部署命令：
   ```bash
   vercel
   ```

3. 按照提示操作：
   - 第一次使用会要求登录，选择登录方式（GitHub/Email等）
   - 选择 "Set up and deploy"
   - 选择 "Yes" 链接到你的 Vercel 账号
   - Project Name: 输入项目名称（如：east-mount-travel）
   - Directory: 按回车（使用当前目录）
   - 其他选项按回车使用默认值

4. 等待部署完成，终端会显示你的网址！

### 第四步：生产环境部署

开发环境部署成功后，运行：
```bash
vercel --prod
```

这会部署到正式的生产环境，并给你一个固定的网址。

---

## 🎨 自定义域名（可选）

如果你想使用自己的域名（如：travel.yourcompany.com）：

1. 在 Vercel 项目页面，点击 **"Settings"**
2. 选择 **"Domains"**
3. 输入你的域名
4. 按照提示在你的域名注册商处添加 DNS 记录
5. 等待 DNS 生效（通常需要几分钟到几小时）

---

## ✅ 部署后检查清单

部署完成后，请检查：

1. **访问网站** - 打开你的网址，看看是否正常显示
2. **测试登录** - 使用测试账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. **创建订单** - 尝试创建一个测试订单
4. **检查权限** - 用 `staff/staff123` 登录，确认只能查看
5. **测试导出** - 尝试导出数据功能

---

## 🔧 常见问题

### Q1: 部署失败怎么办？
**A:** 检查以下几点：
- 确保所有文件都已上传到 GitHub
- 检查 package.json 是否存在
- 查看 Vercel 的错误日志，通常会提示具体问题

### Q2: 网站打开很慢？
**A:** Vercel 的服务器在国外，国内访问可能较慢。可以考虑：
- 使用国内的部署服务（如 Netlify）
- 使用 CDN 加速
- 部署到阿里云/腾讯云

### Q3: 如何修改密码？
**A:** 
1. 打开 `src/App.jsx` 文件
2. 找到 `users` 对象
3. 修改密码
4. 提交修改到 GitHub
5. Vercel 会自动重新部署

### Q4: 如何添加新用户？
**A:** 
在 `src/App.jsx` 的 `users` 对象中添加：
```javascript
newuser: { password: 'password123', role: 'admin', name: '新用户' }
```

### Q5: 数据会丢失吗？
**A:** 数据存储在浏览器的云端存储中，除非手动清除，否则不会丢失。但建议定期导出备份。

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel 的官方文档：https://vercel.com/docs
2. 检查本项目的 README.md 文件
3. 联系系统开发者

---

## 🎉 部署成功！

恭喜！你已经成功部署了东山国际旅游管理系统！

**下一步：**
1. 📧 把网址发给你的员工
2. 👥 为每个员工创建账号
3. 🔐 修改默认密码
4. 📊 开始使用系统管理订单

享受高效的订单管理体验吧！🚀

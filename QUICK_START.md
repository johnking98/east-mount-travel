# 🚀 快速开始 - 3分钟部署指南

## 📥 第一步：下载项目

你已经下载了 `east-mount-deploy.tar.gz` 文件。

**解压文件：**
- **Windows**: 右键 → 解压到当前文件夹（需要安装7-Zip或WinRAR）
- **Mac/Linux**: 双击文件或运行 `tar -xzf east-mount-deploy.tar.gz`

解压后会得到一个 `east-mount-deploy` 文件夹。

---

## 🎯 第二步：选择部署方式

### 方式一：使用一键部署脚本（推荐）⭐

**Windows 用户：**
1. 进入 `east-mount-deploy` 文件夹
2. 双击运行 `deploy.bat`
3. 按照提示操作
4. 完成！

**Mac/Linux 用户：**
1. 打开终端
2. 进入项目目录：`cd east-mount-deploy`
3. 运行脚本：`./deploy.sh`
4. 按照提示操作
5. 完成！

**注意：** 首次运行需要安装 Vercel CLI，脚本会自动处理。

### 方式二：手动部署（更多控制）

1. **安装 Node.js**（如果还没有）
   - 访问：https://nodejs.org
   - 下载并安装 LTS 版本

2. **打开终端/命令提示符**

3. **进入项目目录**
   ```bash
   cd east-mount-deploy
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

6. **部署**
   ```bash
   vercel --prod
   ```

7. **按照提示操作**
   - 首次使用需要登录 Vercel
   - 选择登录方式（推荐使用 Email）
   - 按回车使用默认设置
   - 等待部署完成

---

## 🌐 第三步：获取网址

部署完成后，终端会显示你的网站地址：
```
✅ Production: https://east-mount-travel-xxxxx.vercel.app
```

**这就是你的网址！** 复制它，分享给你的员工。

---

## 🔑 第四步：登录测试

1. 打开浏览器，访问你的网址
2. 使用测试账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. 尝试创建一个订单

---

## ✅ 完成！

恭喜！你的系统已经上线了！

**下一步：**
1. 📧 把网址发给员工
2. 👥 为员工分配账号（参考 README.md）
3. 🔐 修改默认密码
4. 📊 开始使用

**需要帮助？**
- 查看 `DEPLOYMENT_GUIDE.md` 获取详细说明
- 查看 `README.md` 了解系统功能

---

## 🆘 常见问题

**Q: 脚本运行失败？**
A: 确保已安装 Node.js，然后重新运行脚本。

**Q: Vercel 要求登录？**
A: 这是正常的，选择 Email 方式最简单。

**Q: 部署很慢？**
A: 首次部署需要下载依赖，请耐心等待。

**Q: 如何修改公司名称？**
A: 编辑 `src/App.jsx` 文件，搜索"东山国际旅游"进行修改。

---

祝你使用愉快！🎉

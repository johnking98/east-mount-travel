# 东山国际旅游管理系统
## East Mount Luxury Travel Management System

专业的包车接送机服务管理系统，支持多人协作和权限管理。

---

## 🚀 快速部署指南（3分钟完成）

### 方法一：使用 Vercel 部署（推荐，最简单）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub、GitLab 或 Email 注册/登录

2. **创建新项目**
   - 点击 "Add New..." → "Project"
   - 选择 "Import Git Repository"（如果没有GitHub账号可以选择其他方式）

3. **上传项目**
   - 如果使用GitHub：先把项目上传到GitHub，然后导入
   - 如果直接上传：使用 Vercel CLI（见下方）

4. **配置设置**
   - Framework Preset: 选择 "Vite"
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **点击 Deploy**
   - 等待1-2分钟
   - 部署完成后会得到一个网址，如: `https://your-project-name.vercel.app`

### 方法二：使用 Vercel CLI（更快）

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **在项目目录运行**
   ```bash
   cd east-mount-deploy
   vercel
   ```

3. **按照提示操作**
   - 登录 Vercel 账号
   - 选择项目设置
   - 自动部署

4. **获取网址**
   - 部署完成后会显示网址

---

## 📱 系统功能

### 用户权限
- **管理员**: 可以新建、编辑、删除订单
  - 测试账号: `admin` / `admin123`
  - 测试账号: `manager` / `manager123`

- **查看者**: 只能查看和搜索订单
  - 测试账号: `staff` / `staff123`
  - 测试账号: `viewer` / `viewer123`

### 核心功能
- ✅ 订单管理（新建、编辑、删除）
- ✅ 智能搜索和筛选
- ✅ 日程视图
- ✅ 数据导出（CSV格式）
- ✅ 多人实时协作
- ✅ 权限控制
- ✅ 响应式设计（支持手机/平板/电脑）

---

## 🔐 安全建议

**重要：实际使用前请修改密码！**

在 `src/App.jsx` 文件中找到以下代码并修改密码：

```javascript
const users = {
  admin: { password: 'admin123', role: 'admin', name: '管理员' },
  manager: { password: 'manager123', role: 'admin', name: '经理' },
  staff: { password: 'staff123', role: 'viewer', name: '员工' },
  viewer: { password: 'viewer123', role: 'viewer', name: '查看者' }
};
```

修改后重新部署即可。

---

## 💾 数据存储

系统使用云端共享存储，所有用户看到相同的数据。数据会永久保存，除非手动清除。

**数据备份建议：**
- 定期使用"导出数据"功能备份
- 导出的CSV文件可以用Excel打开

---

## 🎨 自定义品牌

如需修改公司名称或logo，编辑 `src/App.jsx` 文件中的相关文本即可。

---

## 📞 技术支持

如有问题，请联系系统开发者。

---

## 📄 许可证

版权所有 © 2025 东山国际旅游

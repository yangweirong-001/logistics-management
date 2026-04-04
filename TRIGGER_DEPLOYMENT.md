# 🚀 如何在网页上触发自动部署

由于沙箱环境无法直接推送代码到 GitHub，请使用以下任一方法在网页上触发自动部署：

## 方法 1：修改 README 文件（最简单）

1. 访问：https://github.com/yangweirong-001/logistics-management/blob/main/README.md
2. 点击右上角的铅笔图标 ✏️（Edit this file）
3. 在文件开头加一行：
   ```markdown
   # 物流管理系统
   <!-- 自动触发部署 -->
   ```
4. 滚动到页面底部
5. 填写：
   - Commit message: `chore: 触发自动部署测试`
6. 点击绿色的 **`Commit changes`** 按钮

提交后，GitHub Actions 会自动运行，2-4 分钟完成部署。

---

## 方法 2：修改任意文件

你也可以修改任意文件来触发部署：

1. 访问：https://github.com/yangweirong-001/logistics-management/tree/main
2. 点击任意文件（如 `.github/workflows/deploy-simple.yml`）
3. 点击编辑 ✏️
4. 随便改一个空格
5. 提交更改

---

## 方法 3：使用 Vercel Deploy Hook（无需修改文件）

1. 访问 Vercel Dashboard
2. 进入 `projects` 项目
3. 点击 **Settings** → **Git**
4. 找到 **Deploy Hooks** 区域
5. 点击 **Create Hook**
6. 填写：
   - Name: `manual-trigger`
   - Branch: `main`
7. 点击 **Create Hook**
8. **复制生成的 Hook URL**
9. 在浏览器地址栏粘贴 Hook URL 并访问

---

## 📊 部署完成后

1. 访问 GitHub Actions：https://github.com/yangweirong-001/logistics-management/actions
2. 可以看到 workflow 运行记录
3. 访问 Vercel Dashboard 查看部署状态

---

**推荐使用方法 1，最简单快速！** 🚀

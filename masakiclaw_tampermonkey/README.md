# MasakiClaw for Tampermonkey

这是 MasakiClaw 的跨浏览器 userscript 版本。它复用 Chrome 版的知乎评论区采集器，并用 Tampermonkey 的共享存储和前台标签页实现当前页、指定 URL 和串行批量采集。

## 安装

1. 安装并打开 Tampermonkey。
2. 进入“实用工具”。
3. 在“从文件导入”中选择 `masakiclaw.user.js`，确认导入并安装。
4. 打开任意 `www.zhihu.com` 或 `zhuanlan.zhihu.com` 页面。
5. 点击右下角的 MasakiClaw 图标；也可以从 Tampermonkey 菜单选择“打开 MasakiClaw”。

## 浏览器差异

- Chrome、Edge、Opera 等支持 File System Access API 的浏览器会让用户选择文件夹，并追加 `images.json`。
- Firefox、Safari 等不支持目录写入的浏览器会为每个 Collection Job 下载自包含 ZIP；超过约 250 MiB 时按图片文件边界拆成多个独立 ZIP。每个 ZIP 都携带索引；仅在发现视觉相似图片时附带相似报告。单张图片本身超过阈值时，该卷会相应超过阈值。
- 批量采集会依次将目标标签页切换到前台，采集结束后关闭目标页并尝试回到控制页。
- 刷新或误关控制页后，再打开知乎会提示恢复。系统不会未经确认自动继续。

## 权限与隐私

脚本声明 `@connect *`，用于下载知乎图片以及访问用户主动配置的 OpenAI-compatible HTTPS 接口。AI 默认关闭；图片、索引、相似报告和 API Key 不会发送给开发者服务器。

API Key 可以不保存、使用 6 位 ASCII 密码加密保存，或在明确勾选后明文保存。该加密只防止随手查看本地脚本存储，不抵御已经控制浏览器配置或本机账户的攻击者。

## 构建与测试

需要 Node.js：

```bash
cd masakiclaw_tampermonkey
npm test
npm run build
npm run check
```

构建脚本将模块化源码、Chrome 版 `content-script.js` 采集器和 userscript 元数据拼装为 `masakiclaw.user.js`。最终脚本不在运行时加载 CDN 代码。

## 已知限制

- Safari/Firefox 的 ZIP 模式每次任务生成新归档，不修改旧 ZIP；跨任务查重历史保存在 Tampermonkey 存储中。
- 文件夹模式恢复时必须重新选择原文件夹。
- 移动浏览器为尽力兼容，不承诺大型 ZIP 或批量标签页编排。

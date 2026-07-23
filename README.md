# MasakiClaw

MasakiClaw 用于采集[東雲正树（Masaki.Ryuu）](https://www.zhihu.com/people/Masaki.Ryuu)
在知乎回答、文章和想法评论区中的图片，并保存图片、`images.json` 索引和可选的
相似图片报告。

项目提供 Chrome、Microsoft Edge 和 Tampermonkey 三种发行形式。采集结果只保存在
本地，不会发送给开发者服务器；AI 视觉理解默认关闭。

## 选择版本

| 版本 | 适用环境 | 保存方式 | 详细说明 |
| --- | --- | --- | --- |
| Chrome 扩展 | 当前稳定版 Chrome | 选择本地文件夹 | [Chrome README](./masakiclaw_chrome/README.md) |
| Edge 扩展 | 当前稳定版 Edge | 选择本地文件夹 | [Edge README](./masakiclaw_edge/README.md) |
| Tampermonkey 脚本 | Chrome、Edge、Firefox 等安装了 Tampermonkey 的浏览器 | 支持目录写入时选择文件夹，否则生成 ZIP | [Tampermonkey README](./masakiclaw_tampermonkey/README.md) |

Safari、Opera 和移动浏览器目前按实验性环境处理。实际兼容性还取决于浏览器版本、
Tampermonkey 版本和知乎页面结构。

## 安装

### Chrome

1. 打开 `chrome://extensions`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择仓库中的 `masakiclaw_chrome` 目录。

### Microsoft Edge

1. 打开 `edge://extensions`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择仓库中的 `masakiclaw_edge` 目录。

### Tampermonkey

1. 安装并打开 Tampermonkey。
2. 进入“实用工具”。
3. 点击“从文件导入”，选择
   [`masakiclaw.user.js`](./masakiclaw_tampermonkey/masakiclaw.user.js)。
4. 确认导入并安装，然后打开知乎页面。
5. 点击页面右下角的 MasakiClaw 图标，或从 Tampermonkey 菜单选择
   “打开 MasakiClaw”。

Tampermonkey 必须拥有 `www.zhihu.com` 和 `zhuanlan.zhihu.com` 的网站访问权限。

## 采集模式

- **当前页**：采集当前知乎回答、文章或想法的评论区图片。
- **指定 URL**：打开用户输入的知乎 URL，采集完成后关闭临时目标页。
- **批量**：按时间从近到远扫描 Masaki.Ryuu 自 2021-12-30 起的回答、文章和
  想法，并串行采集评论区图片。

批量模式可以选择回答、文章和想法来源。指定 URL 输入框和批量来源选项只会在选择
对应模式后显示。

## 主要功能

- 自动识别内嵌评论区和评论弹窗，并滚动加载评论。
- 可选采集次级评论、限制图片数量或滚动到底。
- 优先下载知乎原图候选，过滤 sticker、emoji、reaction 等表情资源。
- 始终按规范化 URL 去重；开启精细查重后增加内容哈希和感知哈希。
- URL 或内容确认重复时跳过保存，但仍在 `images.json` 中记录。
- 视觉相似图片仍会保存，并在报告中列出，留给用户确认。
- 可选调用用户配置的 OpenAI-compatible 视觉模型，为图片生成候选文件名和描述。
- AI 调用失败时回退到原文件名，不会中止整个采集任务。
- 支持停止批量任务和从已保存的检查点恢复。

## 输出

图片目录沿用 Chromium 扩展的命名规则：

```text
年-月-日_pin
年-月-日_post
年-月-日_answer
```

所有版本都会生成或更新 `images.json`，记录任务、图片、下载状态和去重关系。

- Chrome/Edge 扩展会把结果写入用户选择的文件夹，并保留任务日志。
- Tampermonkey 不输出任务日志。
- Tampermonkey 只有发现视觉相似图片时才生成 Markdown 报告，文件名为
  `similar-完成时间-任务ID.md`。
- 不支持 File System Access API 的 Tampermonkey 环境会生成自包含 ZIP；大型任务
  会按约 250 MiB 分卷。

## AI 与隐私

- AI 默认关闭。只有用户主动启用后，图片才会发送到用户配置的 HTTPS
  OpenAI-compatible API。
- API Key 可以不保存、使用 6 位 ASCII 密码加密保存在本地，或在用户明确选择后
  明文保存在本地。
- 该密码只用于防止随手查看本地存储，不能抵御已经控制浏览器配置或系统账户的
  攻击者。
- API Key 不会写入 `images.json`、相似报告或发布包。

完整说明见 [PRIVACY.md](./PRIVACY.md)。

## 构建与验证

打包 Chrome 和 Edge：

```bash
./scripts/package-chrome.sh
./scripts/package-edge.sh
```

构建并测试 Tampermonkey：

```bash
cd masakiclaw_tampermonkey
npm test
npm run build
npm run check
```

Tampermonkey 构建会把模块源码、Chromium 采集器、图标和界面背景合并到单个
`masakiclaw.user.js`，运行时不加载 CDN 代码。

## 已知限制

- 知乎页面结构变化可能导致评论入口、发布时间或图片提取失效。
- 次级评论采集仍是实验功能。
- Tampermonkey 批量模式需要依次打开前台目标页。
- Firefox 等 ZIP 环境恢复任务时会重新获取已确认图片。
- 选择文件夹模式恢复时需要重新选择原文件夹。
- 移动浏览器不承诺大型 ZIP 或批量标签页编排能力。

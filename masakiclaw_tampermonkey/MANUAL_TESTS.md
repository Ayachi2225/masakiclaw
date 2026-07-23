# Manual browser acceptance

记录格式：`PASS / FAIL / PENDING`，并写明浏览器完整版本。

## Firefox desktop

- PENDING — 安装生成的 userscript，知乎页出现悬浮按钮，Tampermonkey 菜单入口可用。
- PENDING — 当前页采集生成 ZIP，包含图片和 `images.json`，不生成日志；仅在发现视觉相似图片时生成相似报告。
- PENDING — 指定 URL 打开前台目标页，完成后关闭并返回控制页。
- PENDING — 批量来源串行扫描；停止在当前目标结束后生效。
- PENDING — 刷新控制页后显示恢复提示，确认后继续。
- PENDING — AI、自定义 HTTPS Base URL、加密/明文/不保存 Key 三种路径。

## Safari desktop（实验性）

- PENDING — 重复 Firefox desktop 的六项验收。
- PENDING — 大型任务不会因单个 ZIP 超过约 250 MiB 而失败，必要时产生分卷。

## Chromium desktop

- PENDING — 安装、当前页、指定 URL、批量、停止与恢复。
- PENDING — 选择文件夹后追加已有 `images.json`，并让已有记录参与查重。
- PENDING — 拒绝或取消文件夹授权时显示错误且不启动采集。

## Compatibility details

- PENDING — 当前稳定版 Firefox、Chrome 和 Edge。
- PENDING — 实验性 Safari、Opera、前一个主要版本及移动浏览器；通过并记录完整验收后再升级支持等级。
- PENDING — 知乎回答、文章和想法页面；内嵌评论与评论弹窗。
- PENDING — 默认不启用 AI；AI 失败不终止采集。
- PENDING — URL/内容重复不保存但写入索引，视觉相似图片保存并写入报告。

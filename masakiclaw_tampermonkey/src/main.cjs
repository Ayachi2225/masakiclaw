(async function startMasakiClawUserscript(root) {
  const core = root.MasakiClaw;
  if (await core.handleWorkerRequest()) return;

  let ui;
  let coordinator;
  let activeArchive;
  let activeOptions;
  const controllerId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const taskStore = core.createGMTaskStore();

  ui = core.createControlPanel({ onStart: startCollection, onStop: stopCollection, onResume: resumeCollection });
  GM.registerMenuCommand("打开 MasakiClaw", () => ui.open());
  const savedSettings = await GM.getValue(core.SETTINGS_KEY, {});
  ui.loadSettings({
    mode: savedSettings.mode, targetUrl: savedSettings.targetUrl, batchSources: savedSettings.batchSources, maxImages: savedSettings.maxImages, unlimitedImages: savedSettings.unlimitedImages,
    autoScroll: savedSettings.autoScroll, allowSecondaryReplies: savedSettings.allowSecondaryReplies, dedupeEnabled: savedSettings.dedupeEnabled,
    scrollSteps: savedSettings.scrollSteps, scrollUntilBottom: savedSettings.scrollUntilBottom, aiEnabled: savedSettings.aiEnabled,
    baseUrl: savedSettings.visionBaseUrl, model: savedSettings.visionModel, saveKey: savedSettings.saveKey, plainSave: savedSettings.plainSave
  });
  const existingJob = await taskStore.load();
  ui.offerResume(existingJob && ["running", "stopping"].includes(existingJob.status));

  async function startCollection(options) {
    ui.setStopAvailable(false);
    validateOptions(options);
    await saveSettings(options);
    activeOptions = await prepareRuntimeOptions(options);
    activeArchive = await chooseArchive(activeOptions);
    let targets;
    if (options.mode === "batch") {
      ui.log("正在顺序扫描 Masaki 的回答、文章和想法……");
      targets = await discoverBatchTargets(options);
    } else if (options.mode === "url") targets = [core.normalizeTargetUrl(options.targetUrl)];
    else targets = [core.normalizeTargetUrl(location.href)];
    if (!targets.length) throw new Error("没有发现符合截止日期的批量目标。");
    coordinator = makeCoordinator();
    ui.setStopAvailable(true);
    ui.log(`开始 ${options.mode} Collection Job，共 ${targets.length} 个目标。`);
    const job = await coordinator.start({ id: makeId(), mode: options.mode, targets, options: publicOptions(activeOptions) });
    await finishCollection(job);
  }

  async function resumeCollection(options) {
    ui.setStopAvailable(false);
    const job = await taskStore.load();
    if (!job || !["running", "stopping"].includes(job.status)) throw new Error("没有可恢复的任务。");
    activeOptions = await prepareRuntimeOptions({ ...job.options, apiKey: options.apiKey, visionPassword: options.visionPassword });
    activeArchive = await chooseArchive(activeOptions);
    if (!activeArchive.directory) {
      ui.log(`正在重建 ZIP 断点：${job.results.length} 个已完成目标。`);
      for (let index = 0; index < job.results.length; index += 1) {
        const result = job.results[index];
        if (result.archiveTask) await activeArchive.restoreTask(result.archiveTask);
        else await activeArchive.writeTarget(result, { ...job, cursor: index });
      }
    }
    coordinator = makeCoordinator();
    ui.setStopAvailable(true);
    ui.log(`从 ${job.cursor}/${job.targets.length} 恢复任务。`);
    const completed = await coordinator.resume();
    await finishCollection(completed);
  }

  async function stopCollection() {
    if (!coordinator) return;
    await coordinator.stop();
    ui.log("已请求停止；当前目标完成后不会打开下一个目标。 ");
  }

  function makeCoordinator() {
    return core.createCollectionCoordinator({
      taskStore,
      targetRunner: async (target, _persistedOptions, job) => {
        const remaining = activeOptions.unlimitedImages ? null : Math.max(0, activeOptions.maxImages - job.imageCount);
        if (remaining === 0) return { status: "complete", images: [], stopJob: true, stopReason: "image_limit" };
        const targetOptions = { ...activeOptions, maxImages: remaining || activeOptions.maxImages };
        ui.log(`采集 ${job.cursor + 1}/${job.targets.length}：${target.url}`);
        const result = job.mode === "current" && sameTarget(target.url, location.href)
          ? await core.collectTarget({ url: target.url, options: targetOptions })
          : await runRemote({ kind: "collect", url: target.url, options: targetOptions });
        const archiveTask = await activeArchive.writeTarget(result, job);
        result.archiveTask = archiveTask;
        if (!activeOptions.unlimitedImages && job.imageCount + result.images.length >= activeOptions.maxImages) result.stopJob = true;
        return result;
      },
      onProgress: (job) => { ui.progress(job.cursor, job.targets.length); ui.log(`进度 ${job.cursor}/${job.targets.length}，候选图片 ${job.imageCount}`); }
    });
  }

  async function finishCollection(job) {
    const archiveResult = await activeArchive.complete(job);
    ui.log(job.status === "stopped" ? "批量任务已停止，已保存当前结果。" : `完成：${archiveResult.kind === "zip" ? `${archiveResult.volumes} 个 ZIP` : "文件夹归档"}。`);
    await taskStore.clear(); ui.offerResume(false); ui.setStopAvailable(false); coordinator = null;
  }

  async function discoverBatchTargets(options) {
    const sources = {
      answer: "https://www.zhihu.com/people/Masaki.Ryuu/answers",
      post: "https://www.zhihu.com/people/Masaki.Ryuu/posts",
      pin: "https://www.zhihu.com/people/Masaki.Ryuu/pins"
    };
    const items = [];
    for (const type of options.batchSources) {
      const result = await runRemote({ kind: "discover", url: sources[type], sourceType: type, cutoff: "2021-12-30T00:00:00+08:00" });
      items.push(...result); ui.log(`${type}：发现 ${result.length} 个目标。`);
    }
    return Array.from(new Set(items.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt))).map((item) => item.url)));
  }

  async function runRemote(request) {
    const payload = { ...request, nonce: `${controllerId}:${Date.now()}:${Math.random().toString(16).slice(2)}` };
    let tab;
    try {
      return await core.waitForWorker(payload, request.kind === "discover" ? 240000 : 180000, () => { tab = GM_openInTab(request.url, { active: true, setParent: true }); });
    } finally {
      try { tab?.close(); } catch {}
      try { window.focus(); } catch {}
    }
  }

  async function chooseArchive(options) {
    let directoryHandle = null;
    if (typeof window.showDirectoryPicker === "function") {
      ui.log("请选择本地归档文件夹。");
      directoryHandle = await window.showDirectoryPicker({ mode: "readwrite", id: "masakiclaw-archive" });
    } else ui.log("当前浏览器不支持目录写入，将生成自包含 ZIP。");
    const writer = await core.createArchiveWriter({ directoryHandle, options, onLog: ui.log });
    return { ...writer, directory: Boolean(directoryHandle) };
  }

  async function prepareRuntimeOptions(options) {
    const runtime = { ...options };
    if (runtime.aiEnabled) {
      runtime.apiKey = await core.resolveCredential({ apiKey: runtime.apiKey, password: runtime.visionPassword, saveKey: runtime.saveKey, plainSave: runtime.plainSave, baseUrl: runtime.visionBaseUrl, model: runtime.visionModel });
      if (!runtime.apiKey) throw new Error("启用 AI 时需要输入 API Key 或解锁已保存的 Key。");
    }
    return runtime;
  }
  async function saveSettings(options) { const value = publicOptions(options); await GM.setValue(core.SETTINGS_KEY, value); }
  function publicOptions(options) { const value = { ...options }; delete value.apiKey; delete value.visionPassword; return value; }
  function validateOptions(options) { if (options.mode === "url" && !core.isSupportedZhihuUrl(options.targetUrl)) throw new Error("指定 URL 只支持知乎 HTTPS 页面。"); if (options.mode === "batch" && !options.batchSources.length) throw new Error("至少选择一个批量来源。"); }
  function sameTarget(left, right) { try { const a = new URL(left); const b = new URL(right); return a.origin === b.origin && a.pathname.replace(/\/$/, "") === b.pathname.replace(/\/$/, ""); } catch { return false; } }
  function makeId() { return `${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${Math.random().toString(16).slice(2, 8)}`; }
})(typeof globalThis === "object" ? globalThis : this);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CLAIM_PENDING_TASK") {
    claimPendingTask(message)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "RELEASE_PENDING_TASK_CLAIM") {
    releasePendingTaskClaim(message)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "STOP_BATCH") {
    requestBatchStop()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "START_CAPTURE") {
    queueCapture(message)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "BEGIN_CAPTURE") {
    beginQueuedCapture()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

let taskClaimQueue = Promise.resolve();

function withTaskClaimLock(action) {
  const next = taskClaimQueue.then(action, action);
  taskClaimQueue = next.catch(() => {});
  return next;
}

async function queueCapture(options) {
  await validateCaptureOptions(options);
  await chrome.storage.local.remove("pendingTask");
  await chrome.storage.local.remove("batchState");
  await chrome.storage.local.remove("batchStopRequested");
  await chrome.storage.session.remove("pendingTaskClaim");
  await chrome.storage.local.set({
    captureRequestState: {
      status: "waiting_folder",
      mode: options.mode,
      createdAt: new Date().toISOString()
    }
  });
  await chrome.storage.session.set({ pendingCaptureRequest: options });
  await chrome.tabs.create({ url: chrome.runtime.getURL("download.html") });
  return { queued: true, mode: options.mode };
}

async function validateCaptureOptions(options) {
  if (options.mode === "url" && !isSupportedZhihuUrl(options.targetUrl || "")) {
    throw new Error("指定 URL 只支持 www.zhihu.com 或 zhuanlan.zhihu.com 的 HTTPS 地址。");
  }
  if (options.mode === "current" && options.sourceTabId) {
    const tab = await chrome.tabs.get(Number(options.sourceTabId));
    if (!isSupportedZhihuUrl(tab.url || "")) {
      throw new Error("当前页模式只支持 www.zhihu.com 或 zhuanlan.zhihu.com 页面。");
    }
  }
}

function isSupportedZhihuUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      /^www\.zhihu\.com$/i.test(url.hostname) ||
      /^zhuanlan\.zhihu\.com$/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

async function beginQueuedCapture() {
  const result = await chrome.storage.session.get("pendingCaptureRequest");
  const options = result.pendingCaptureRequest;
  if (!options) {
    throw new Error("没有找到待开始的采集任务。请从插件弹窗重新开始。");
  }
  await chrome.storage.session.remove("pendingCaptureRequest");

  await chrome.storage.local.set({
    captureRequestState: {
      status: "running",
      mode: options.mode,
      startedAt: new Date().toISOString()
    }
  });

  runCapture(options)
    .then(async () => {
      await chrome.storage.local.remove("captureRequestState");
    })
    .catch((error) => handleCaptureFailure(error, options));
  return { started: true, batch: options.mode === "batch" };
}

async function claimPendingTask(message) {
  return withTaskClaimLock(async () => {
    const taskId = String(message.taskId || "");
    const ownerId = String(message.ownerId || "");
    if (!taskId || !ownerId) {
      throw new Error("任务领取参数缺失。");
    }

    const pending = await chrome.storage.local.get("pendingTask");
    if (!pending.pendingTask) {
      return { claimed: false, reason: "任务已经被处理。" };
    }
    if (pending.pendingTask.taskId !== taskId) {
      return { claimed: false, reason: "当前待处理任务已经变化。" };
    }

    const result = await chrome.storage.session.get("pendingTaskClaim");
    const claim = result.pendingTaskClaim;
    if (claim?.taskId === taskId && claim?.ownerId && claim.ownerId !== ownerId && !isStaleTaskClaim(claim)) {
      return { claimed: false, reason: "任务已由另一个下载页处理。" };
    }

    await chrome.storage.session.set({
      pendingTaskClaim: {
        taskId,
        ownerId,
        claimedAt: new Date().toISOString()
      }
    });
    return { claimed: true };
  });
}

function isStaleTaskClaim(claim) {
  const claimedAt = Date.parse(claim?.claimedAt || "");
  return !Number.isFinite(claimedAt) || Date.now() - claimedAt > 10 * 60 * 1000;
}

async function releasePendingTaskClaim(message) {
  return withTaskClaimLock(async () => {
    const taskId = String(message.taskId || "");
    const ownerId = String(message.ownerId || "");
    const result = await chrome.storage.session.get("pendingTaskClaim");
    const claim = result.pendingTaskClaim;
    if (claim?.taskId === taskId && claim?.ownerId === ownerId) {
      await chrome.storage.session.remove("pendingTaskClaim");
      return { released: true };
    }
    return { released: false };
  });
}

async function handleCaptureFailure(error, options) {
  await chrome.storage.session.remove("pendingCaptureRequest");
  await chrome.storage.local.set({
    captureRequestState: {
      status: "failed",
      mode: options.mode,
      error: error.message,
      failedAt: new Date().toISOString()
    }
  });

  if (options.mode !== "batch") {
    return;
  }

  const transientTabError = isTransientFrameError(error);
  const current = await chrome.storage.local.get("batchState");
  await chrome.storage.local.set({
    batchState: {
      ...(current.batchState || {}),
      status: transientTabError ? "complete" : "failed",
      error: transientTabError ? "" : error.message,
      lastError: transientTabError ? error.message : "",
      stopReason: transientTabError ? "transient_tab_removed" : "",
      failedAt: transientTabError ? "" : new Date().toISOString(),
      completedAt: transientTabError ? new Date().toISOString() : ""
    }
  });
}

async function requestBatchStop() {
  const current = await chrome.storage.local.get("batchState");
  await chrome.storage.local.set({
    batchStopRequested: true,
    batchState: {
      ...(current.batchState || {}),
      status: "stopping",
      requestedAt: new Date().toISOString()
    }
  });
}

async function runCapture(options) {
  if (options.mode === "batch") {
    return runBatchCapture(options);
  }

  const sourceTab = await getSourceTab(options);
  const capture = await collectFromTab(sourceTab.id, options);
  const task = buildTask(capture, options);
  await protectTaskSecrets(task);

  if (options.mode === "url" && sourceTab.createdByMasakiClaw) {
    removeTabBestEffort(sourceTab.id);
  }

  await chrome.storage.local.set({ pendingTask: task });
  return { count: task.images.length };
}

async function runBatchCapture(options) {
  const items = await discoverBatchItems(options);
  const maxImages = normalizeImageLimit(options);
  const maxImagesLabel = formatImageLimit(maxImages);
  await chrome.storage.local.set({
    batchState: {
      status: "running",
      total: items.length,
      completed: 0,
      skipped: 0,
      maxImages: maxImagesLabel,
      startedAt: new Date().toISOString()
    }
  });

  let imageCount = 0;
  let completed = 0;
  let skipped = 0;
  for (const item of items) {
    if (hasReachedImageLimit(imageCount, maxImages) || await isBatchStopRequested()) {
      break;
    }
    let tab = null;
    try {
      tab = await chrome.tabs.create({ url: item.url, active: true });
      await waitForTabComplete(tab.id);
      if (await isBatchStopRequested()) {
        break;
      }
      const remainingImages = getRemainingImageLimit(imageCount, maxImages);
      if (remainingImages !== null && remainingImages <= 0) {
        break;
      }
      const capture = await collectFromTab(tab.id, { ...options, maxImages: remainingImages });
      capture.pageUrl = capture.pageUrl || item.url;
      capture.publishedAt = capture.publishedAt || item.publishedAt;
      const task = buildTask(capture, { ...options, mode: "batch", targetUrl: item.url });
      task.batch = {
        enabled: true,
        itemType: item.type,
        listUrl: item.listUrl,
        discoveredTitle: item.title || "",
        discoveredAt: new Date().toISOString()
      };
      await protectTaskSecrets(task);
      if (!task.images.length) {
        completed += 1;
        continue;
      }
      if (!await waitForPendingTaskSlot()) {
        break;
      }
      await chrome.storage.local.set({ pendingTask: task });
      imageCount += task.images.length;
      completed += 1;
      await chrome.storage.local.set({
        batchState: {
          status: "running",
          total: items.length,
          completed,
          skipped,
          imageCount,
          maxImages: maxImagesLabel,
          currentUrl: item.url,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      skipped += 1;
      completed += 1;
      await chrome.storage.local.set({
        batchState: {
          status: "running",
          total: items.length,
          completed,
          skipped,
          imageCount,
          maxImages: maxImagesLabel,
          currentUrl: item.url,
          lastError: error.message,
          updatedAt: new Date().toISOString()
        }
      });
    } finally {
      if (tab?.id) {
        removeTabBestEffort(tab.id);
      }
    }
  }

  await waitForPendingTaskSlot();
  const stopped = await isBatchStopRequested();
  await chrome.storage.local.set({
    batchState: {
      status: stopped ? "stopped" : "complete",
      total: items.length,
      completed,
      skipped,
      imageCount,
      maxImages: maxImagesLabel,
      stopReason: stopped ? "user_requested" : hasReachedImageLimit(imageCount, maxImages) ? "max_images_reached" : "",
      completedAt: new Date().toISOString()
    }
  });
  return { count: imageCount, batchItems: items.length };
}

async function getSourceTab(options) {
  if (options.mode === "current") {
    const tab = options.sourceTabId
      ? await chrome.tabs.get(Number(options.sourceTabId))
      : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab?.id) {
      throw new Error("没有找到当前标签页。");
    }
    if (!isSupportedZhihuUrl(tab.url || "")) {
      throw new Error("当前页模式只支持 www.zhihu.com 或 zhuanlan.zhihu.com 页面。");
    }
    return tab;
  }

  const tab = await chrome.tabs.create({ url: options.targetUrl, active: false });
  await waitForTabComplete(tab.id);
  return { ...tab, createdByMasakiClaw: true };
}

async function discoverBatchItems(options) {
  const cutoff = normalizeDateLikeValue(options.batchCutoff || "2021-12-30T00:00:00+08:00");
  const sourceMap = [
    { type: "answer", url: "https://www.zhihu.com/people/Masaki.Ryuu/answers" },
    { type: "post", url: "https://www.zhihu.com/people/Masaki.Ryuu/posts" },
    { type: "pin", url: "https://www.zhihu.com/people/Masaki.Ryuu/pins" }
  ];
  const enabledTypes = new Set(Array.isArray(options.batchSources) && options.batchSources.length
    ? options.batchSources
    : sourceMap.map((source) => source.type));
  const sources = sourceMap.filter((source) => enabledTypes.has(source.type));
  const sourceResults = [];
  for (const source of sources) {
    sourceResults.push(await scanBatchSource(source, cutoff, "active_scan"));
  }
  const items = sourceResults.flat();

  const unique = new Map();
  items.forEach((item) => {
    if (!unique.has(item.url)) {
      unique.set(item.url, item);
    }
  });

  return Array.from(unique.values()).sort((a, b) => {
    const left = new Date(a.publishedAt || 0).getTime();
    const right = new Date(b.publishedAt || 0).getTime();
    return right - left;
  });
}

async function scanBatchSource(source, cutoff, reason = "") {
  let tab = null;
  try {
    await chrome.storage.local.set({
      batchState: {
        status: "running",
        source: source.type,
        sourceUrl: source.url,
        sourceScan: reason,
        updatedAt: new Date().toISOString()
      }
    });
    tab = await chrome.tabs.create({ url: source.url, active: true });
    await focusTabBestEffort(tab);
    await wait(500);
    await waitForTabComplete(tab.id);
    const sourceItems = await collectBatchItemsFromListTab(tab.id, source, cutoff);
    await chrome.storage.local.set({
      batchState: {
        status: "running",
        source: source.type,
        sourceCount: sourceItems.length,
        sourceUrl: source.url,
        sourceScan: reason,
        updatedAt: new Date().toISOString()
      }
    });
    return sourceItems;
  } catch (error) {
    await chrome.storage.local.set({
      batchState: {
        status: "running",
        source: source.type,
        sourceError: `${source.type}: ${error.message}`,
        sourceScan: reason,
        updatedAt: new Date().toISOString()
      }
    });
    return [];
  } finally {
    if (tab?.id) {
      removeTabBestEffort(tab.id);
    }
  }
}

async function collectBatchItemsFromListTab(tabId, source, cutoff) {
  const [result] = await executeScriptWithRetry({
    target: { tabId },
    func: async (sourceArg, cutoffArg) => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const cutoffTime = new Date(cutoffArg).getTime();
      const itemType = sourceArg.type === "post" ? "article" : sourceArg.type;
      const itemSelector = `.ContentItem[data-zop*='"type":"${itemType}"'], [data-zop*='"type":"${itemType}"']`;
      await waitForListItems(itemSelector);

      let lastCount = 0;
      let staleRounds = 0;
      for (let index = 0; index < 180; index += 1) {
        window.scrollTo({ top: document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0, behavior: "auto" });
        await wait(850);
        const height = document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0;
        window.scrollBy({ top: Math.max(600, window.innerHeight), behavior: "auto" });
        await wait(350);

        const stats = getCandidateStats(itemSelector);
        if (stats.oldestTime && stats.oldestTime < cutoffTime) {
          break;
        }

        if (stats.count > lastCount) {
          lastCount = stats.count;
          staleRounds = 0;
          continue;
        }

        staleRounds += 1;
        if (stats.count > 0 && staleRounds >= 18 && isNearPageBottom(height)) {
          break;
        }
      }

      const contentItems = Array.from(document.querySelectorAll(itemSelector));
      const candidates = contentItems
        .map((root) => {
          const itemData = parseZop(root.getAttribute("data-zop") || "");
          const url = findContentItemUrl(root, sourceArg.type, itemData);
          if (!url) {
            return null;
          }
          const text = normalizeText(root.innerText || "");
          const date = findContentItemDate(root) || findDateInText(text);
          if (!date || new Date(date).getTime() < cutoffTime) {
            return {
              type: sourceArg.type,
              listUrl: sourceArg.url,
              url,
              title: normalizeText(itemData.title || findTitle(root) || text || "").slice(0, 120),
              publishedAt: "",
              dateMissing: !date,
              beforeCutoff: Boolean(date)
            };
          }
          return {
            type: sourceArg.type,
            listUrl: sourceArg.url,
            url,
            title: normalizeText(itemData.title || findTitle(root) || "").slice(0, 120),
            publishedAt: date
          };
        })
        .filter(Boolean);
      const dated = candidates.filter((item) => item.publishedAt && !item.beforeCutoff);
      if (dated.length) {
        return dated;
      }
      return candidates.filter((item) => item.dateMissing);

      async function waitForListItems(selector) {
        for (let index = 0; index < 24; index += 1) {
          if (document.querySelector(selector)) {
            return true;
          }
          window.scrollBy({ top: Math.max(240, window.innerHeight * 0.45), behavior: "auto" });
          await wait(500);
        }
        return false;
      }

      function getCandidateStats(selector) {
        let oldestTime = 0;
        const roots = Array.from(document.querySelectorAll(selector));
        roots.forEach((root) => {
          const date = findContentItemDate(root) || findDateInText(normalizeText(root.innerText || ""));
          const time = date ? new Date(date).getTime() : 0;
          if (time && (!oldestTime || time < oldestTime)) {
            oldestTime = time;
          }
        });
        return { count: roots.length, oldestTime };
      }

      function isNearPageBottom(height) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const viewport = window.innerHeight || document.documentElement.clientHeight || 0;
        return scrollTop + viewport >= height - 16;
      }

      function findContentItemUrl(root, type, itemData) {
        const anchor = root.querySelector("a[href*='/answer/'], a[href*='zhuanlan.zhihu.com/p/'], a[href^='//zhuanlan.zhihu.com/p/'], a[href*='/pin/']");
        if (anchor?.href) {
          const normalized = normalizeItemUrl(anchor.href, type);
          if (normalized) {
            return normalized;
          }
        }

        if (type === "answer") {
          const answerId = itemData.itemId || itemData.token;
          const extra = parseZop(root.getAttribute("data-za-extra-module") || "");
          const questionId = extra?.card?.content?.parent_token || "";
          if (questionId && answerId) {
            return `https://www.zhihu.com/question/${questionId}/answer/${answerId}`;
          }
        }

        if (type === "post") {
          const postId = itemData.itemId || itemData.token;
          if (postId) {
            return `https://zhuanlan.zhihu.com/p/${postId}`;
          }
        }

        if (type === "pin") {
          const pinId = itemData.itemId || itemData.token;
          if (pinId) {
            return `https://www.zhihu.com/pin/${pinId}`;
          }
        }

        return "";
      }

      function findContentItemDate(root) {
        const publishedMeta = root.querySelector('meta[itemprop="dateCreated"], meta[itemprop="datePublished"]');
        const publishedMetaValue = publishedMeta?.getAttribute("content") || "";
        const normalizedPublishedMeta = normalizeDateValue(publishedMetaValue);
        if (normalizedPublishedMeta) {
          return normalizedPublishedMeta;
        }

        const extra = parseZop(root.getAttribute("data-za-extra-module") || "");
        const timestamp = extra?.card?.content?.publish_timestamp;
        const normalizedTimestamp = normalizeTimestamp(timestamp);
        if (normalizedTimestamp) {
          return normalizedTimestamp;
        }

        const modifiedMeta = root.querySelector('meta[itemprop="dateModified"]');
        const modifiedMetaValue = modifiedMeta?.getAttribute("content") || "";
        const normalizedModifiedMeta = normalizeDateValue(modifiedMetaValue);
        if (normalizedModifiedMeta) {
          return normalizedModifiedMeta;
        }

        const timeElement = root.querySelector("[data-tooltip*='发布于'], [aria-label*='发布于'], [data-tooltip*='编辑于'], [aria-label*='编辑于']");
        const value = timeElement?.getAttribute("data-tooltip") || timeElement?.getAttribute("aria-label") || timeElement?.textContent || "";
        return findDateInText(value);
      }

      function findTitle(root) {
        const titleElement = root.querySelector(".ContentItem-title a, .ContentItem-title, h2 a, h2");
        return normalizeText(titleElement?.textContent || "");
      }

      function parseZop(value) {
        try {
          return JSON.parse(value || "{}") || {};
        } catch {
          return {};
        }
      }

      function normalizeDateValue(value) {
        if (!value) {
          return "";
        }
        const date = new Date(String(value));
        return Number.isNaN(date.getTime()) ? "" : date.toISOString();
      }

      function normalizeTimestamp(value) {
        const number = Number(value);
        if (!Number.isFinite(number) || number <= 0) {
          return "";
        }
        const milliseconds = number > 100000000000 ? number : number * 1000;
        const date = new Date(milliseconds);
        return Number.isNaN(date.getTime()) ? "" : date.toISOString();
      }

      function normalizeItemUrl(value, type) {
        try {
          const url = new URL(value, location.href);
          url.hash = "";
          url.search = "";
          if (type === "answer" && /\/question\/\d+\/answer\/\d+/.test(url.pathname)) {
            return url.href;
          }
          if (type === "post" && /^\/p\/\d+/.test(url.pathname)) {
            return `https://zhuanlan.zhihu.com${url.pathname}`;
          }
          if (type === "pin" && /^\/pin\/\d+/.test(url.pathname)) {
            return `https://www.zhihu.com${url.pathname}`;
          }
        } catch {
          return "";
        }
        return "";
      }

      function findDateInText(text) {
        const normalized = normalizeText(text);
        const patterns = [
          /(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/,
          /编辑于\s*(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/,
          /发布于\s*(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?/
        ];
        for (const pattern of patterns) {
          const match = normalized.match(pattern);
          if (match) {
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            if (!Number.isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        }
        return "";
      }

      function normalizeText(text) {
        return String(text || "").replace(/[\u200B-\u200F\uFEFF]/g, "").replace(/\s+/g, " ").trim();
      }
    },
    args: [source, cutoff]
  });
  return result?.result || [];
}

function waitForPendingTaskSlot() {
  return new Promise((resolve) => {
    const check = async () => {
      if (await isBatchStopRequested()) {
        resolve(false);
        return;
      }
      const result = await chrome.storage.local.get("pendingTask");
      if (!result.pendingTask) {
        resolve(true);
        return;
      }
      setTimeout(check, 1000);
    };
    check();
  });
}

async function isBatchStopRequested() {
  const result = await chrome.storage.local.get("batchStopRequested");
  return result.batchStopRequested === true;
}

function waitForTabComplete(tabId) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      finish(() => reject(new Error("目标页面加载超时。")));
    }, 30000);

    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.onRemoved.addListener(removedListener);

    chrome.tabs.get(tabId)
      .then((tab) => {
        if (settled) {
          return;
        }
        if (tab.status === "complete") {
          finish(() => setTimeout(resolve, 600));
        }
      })
      .catch(() => {
        finish(() => reject(new Error(`目标标签页已关闭：${tabId}`)));
      });

    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        finish(() => setTimeout(resolve, 600));
      }
    }

    function removedListener(removedTabId) {
      if (removedTabId === tabId) {
        finish(() => reject(new Error(`目标标签页已关闭：${tabId}`)));
      }
    }

    function finish(callback) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.onRemoved.removeListener(removedListener);
      callback();
    }
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeTabBestEffort(tabId) {
  chrome.tabs.remove(tabId).catch(() => {});
}

async function focusTabBestEffort(tab) {
  try {
    if (tab?.windowId) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
    if (tab?.id) {
      await chrome.tabs.update(tab.id, { active: true });
    }
  } catch {
    // Some browser/window states reject focus changes; active tab creation still gives us a usable fallback.
  }
}

async function collectFromTab(tabId, options) {
  await executeScriptWithRetry({
    target: { tabId },
    files: ["content-script.js"]
  });

  let prepareStats = null;
  if (options.autoScroll !== false) {
    const [prepareResult] = await executeScriptWithRetry({
      target: { tabId },
      func: (prepareOptions) => window.masakiClawPreparePage(prepareOptions),
      args: [{
        maxScrolls: options.scrollUntilBottom === true ? null : Number(options.scrollSteps) || 24,
        scrollUntilBottom: options.scrollUntilBottom === true,
        delayMs: 350,
        allowSecondaryReplies: options.allowSecondaryReplies === true,
        targetUrl: options.targetUrl || ""
      }]
    });
    prepareStats = prepareResult?.result || null;
  }

  const [result] = await executeScriptWithRetry({
    target: { tabId },
    func: (limit, prepareStats, targetUrl) => window.masakiClawCollectCommentImages({ maxImages: limit, prepareStats, targetUrl }),
    args: [normalizeImageLimit(options), prepareStats, options.targetUrl || ""]
  });

  return result?.result || { images: [] };
}

function normalizeImageLimit(options) {
  if (options?.maxImagesUnlimited === true || options?.maxImages === null || options?.maxImages === "") {
    return null;
  }
  return Math.max(1, Number(options?.maxImages) || 80);
}

function formatImageLimit(limit) {
  return limit === null ? "无限制" : limit;
}

function hasReachedImageLimit(count, limit) {
  return limit !== null && count >= limit;
}

function getRemainingImageLimit(count, limit) {
  return limit === null ? null : Math.max(0, limit - count);
}

async function executeScriptWithRetry(details, attempts = 4) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      if (index > 0) {
        await wait(400 + index * 300);
        if (details.target?.tabId) {
          await waitForTabCompleteBestEffort(details.target.tabId);
        }
      }
      return await chrome.scripting.executeScript(details);
    } catch (error) {
      lastError = error;
      if (!isTransientFrameError(error)) {
        throw error;
      }
    }
  }
  throw lastError;
}

function isTransientFrameError(error) {
  return /Frame with ID 0 was removed|No frame with id|No tab with id|Cannot access contents of url|The tab was closed|Receiving end does not exist|目标标签页已关闭/i.test(error?.message || "");
}

async function waitForTabCompleteBestEffort(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") {
      return;
    }
    await waitForTabComplete(tabId);
  } catch {
    // The caller's execute retry will surface the final failure if the tab is gone.
  }
}

function buildTask(capture, options) {
  const capturedAt = new Date().toISOString();
  const taskId = `${capturedAt}_${options.mode}_${shortHash(capture.pageUrl || options.targetUrl || "")}`;
  const usedNames = new Set();
  const publishedAt = normalizeDateLikeValue(capture.publishedAt) || capturedAt;

  const images = (capture.images || []).map((image, index) => {
    const hash = shortHash(image.originalUrl);
    const savedName = makeUniqueName(makeSafeImageName(image.originalName, hash), usedNames);
    return buildImageTaskRecord({
      image,
      index,
      hash,
      savedName,
      status: "pending"
    });
  });

  return {
    taskId,
    sourcePage: capture.pageUrl || options.targetUrl || "",
    pageTitle: capture.pageTitle || "",
    capturedAt,
    publishedAt,
    publishedDateFolder: formatDateFolder(publishedAt),
    mode: options.mode,
    scope: capture.scope || "comments",
    dedupe: {
      enabled: options.dedupeEnabled === true
    },
    ai: buildAiTaskOptions(options),
    prepareStats: capture.prepareStats || null,
    images
  };
}

function buildAiTaskOptions(options) {
  const enabled = options.aiEnabled === true && Boolean(options.visionApiKey) && Boolean(options.visionModel);
  return {
    enabled,
    baseUrl: enabled ? normalizeBaseUrl(options.visionBaseUrl) : "",
    model: enabled ? String(options.visionModel || "").trim() : "",
    apiKey: enabled ? String(options.visionApiKey || "").trim() : ""
  };
}

async function protectTaskSecrets(task) {
  if (!task.ai?.enabled || !task.ai.apiKey) {
    return;
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(task.ai.apiKey);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const exportedKey = await crypto.subtle.exportKey("raw", key);
  const sessionKeyName = getAiSessionKeyName(task.taskId);

  await chrome.storage.session.set({
    [sessionKeyName]: arrayBufferToBase64(exportedKey)
  });

  task.ai.encryptedApiKey = {
    algorithm: "AES-GCM",
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext)
  };
  delete task.ai.apiKey;
}

function getAiSessionKeyName(taskId) {
  return `masakiClawAiKey:${taskId}`;
}

function buildImageTaskRecord({ image, index, hash, savedName, status }) {
  const record = {
    index,
    savedName,
    originalName: image.originalName || "image",
    description: image.weakDescription || image.alt || image.title || "",
    aiEnabled: false,
    status,
    originalUrl: image.originalUrl || "",
    thumbnailUrl: image.thumbnailUrl || "",
    fallbackUrls: image.fallbackUrls || [],
    width: Number(image.width) || 0,
    height: Number(image.height) || 0,
    alt: image.alt || "",
    title: image.title || "",
    weakDescription: image.weakDescription || "",
    hash
  };

  appendIfPresent(record, "source", image.source);
  appendIfPresent(record, "commentId", image.commentId);
  appendIfPresent(record, "authorName", image.authorName);
  appendIfPresent(record, "createdTime", image.createdTime);
  appendIfPresent(record, "commentTime", image.commentTime);
  return record;
}

function appendIfPresent(record, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    record[key] = value;
  }
}

function normalizeBaseUrl(value) {
  return normalizeVisionBaseUrl(value || "https://api.openai.com/v1");
}

function normalizeDateLikeValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatDateFolder(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDateFolder(new Date().toISOString());
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function normalizeVisionBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/i, "");
}

function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function makeSafeImageName(originalName, hash) {
  const parsed = splitName(originalName);
  const base = sanitizeFilename(parsed.base || "image").slice(0, 70) || "image";
  const ext = sanitizeExtension(parsed.ext) || ".jpg";
  return `${base}_${hash}${ext}`;
}

function makeUniqueName(name, usedNames) {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const parsed = splitName(name);
  let counter = 2;
  let next = `${parsed.base}_${counter}${parsed.ext}`;
  while (usedNames.has(next)) {
    counter += 1;
    next = `${parsed.base}_${counter}${parsed.ext}`;
  }
  usedNames.add(next);
  return next;
}

function splitName(value) {
  const clean = String(value || "image").split(/[?#]/)[0];
  const match = clean.match(/^(.*?)(\.[a-zA-Z0-9]{2,5})$/);
  if (!match) {
    return { base: clean, ext: ".jpg" };
  }
  return { base: match[1] || "image", ext: match[2].toLowerCase() };
}

function sanitizeFilename(value) {
  return String(value || "image")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function sanitizeExtension(value) {
  const ext = String(value || "").toLowerCase();
  return /^\.[a-z0-9]{2,5}$/.test(ext) ? ext : ".jpg";
}

function shortHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

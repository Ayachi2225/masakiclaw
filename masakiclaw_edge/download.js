const chooseButton = document.querySelector("#choose");
const stopBatchButton = document.querySelector("#stopBatch");
const summary = document.querySelector("#summary");
const progress = document.querySelector("#progress");
const log = document.querySelector("#log");

const AI_IMAGE_CONCURRENCY = 2;
const DOWNLOAD_ONLY_CONCURRENCY = 4;
const DHASH_HIGHLY_SIMILAR_MAX_DISTANCE = 5;
const DHASH_POSSIBLY_SIMILAR_MAX_DISTANCE = 10;
const downloadPageInstanceId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

let task;
let selectedDirHandle = null;
let isWriting = false;
let existingIndexCache = null;
let captureStarted = false;

init();

chooseButton.addEventListener("click", async () => {
  chooseButton.disabled = true;

  try {
    if (!window.showDirectoryPicker) {
      throw new Error("当前浏览器不支持 File System Access API。");
    }

    selectedDirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    appendLog("已选择文件夹。");
    await beginCaptureIfQueued();
    await maybeWriteTask();
  } catch (error) {
    appendLog(`失败：${error.message}`);
    if (!isWriting) {
      chooseButton.disabled = false;
    }
  }
});

stopBatchButton.addEventListener("click", async () => {
  stopBatchButton.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "STOP_BATCH" });
    if (!response?.ok) {
      throw new Error(response?.error || "停止失败。");
    }
    appendLog("已请求停止批量采集。当前页面处理结束后会停止。");
  } catch (error) {
    appendLog(`停止失败：${error.message}`);
    stopBatchButton.disabled = false;
  }
});

async function init() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes.pendingTask?.newValue) {
      if (areaName === "local" && changes.batchState?.newValue) {
        appendBatchState(changes.batchState.newValue);
      }
      if (areaName === "local" && changes.captureRequestState?.newValue) {
        appendCaptureRequestState(changes.captureRequestState.newValue);
      }
      return;
    }
    setTask(changes.pendingTask.newValue);
    maybeWriteTask();
  });

  const result = await chrome.storage.local.get(["pendingTask", "captureRequestState"]);
  if (result.pendingTask) {
    setTask(result.pendingTask);
    return;
  }
  if (result.captureRequestState) {
    appendCaptureRequestState(result.captureRequestState);
  }

  summary.textContent = "请选择保存文件夹，选择后才会开始打开网页并采集。";
  progress.max = 1;
  appendLog("等待选择保存文件夹。");
}

function setTask(nextTask) {
  task = nextTask;
  summary.textContent = `待写入 ${task.images.length} 张评论图片：${task.sourcePage}`;
  progress.max = task.images.length + 1;
  appendLog(`任务：${task.taskId}`);
}

function appendBatchState(state) {
  if (!state?.status) {
    return;
  }
  if (state.status === "running") {
    stopBatchButton.hidden = false;
    stopBatchButton.disabled = false;
    if (state.source && !state.total) {
      const countText = Number.isFinite(Number(state.sourceCount)) ? `，发现 ${state.sourceCount} 个条目` : "";
      const scanText = state.sourceScan === "active_scan" ? "（激活扫描）" : "";
      appendLog(`正在扫描批量来源：${state.source}${scanText}${countText}`);
    } else {
      appendLog(`批量进度：${state.completed || 0}/${state.total || 0}，跳过 ${state.skipped || 0}，图片 ${state.imageCount || 0}/${state.maxImages || "?"}`);
    }
    if (state.lastError || state.sourceError) {
      appendLog(`批量警告：${state.lastError || state.sourceError}`);
    }
  } else if (state.status === "complete") {
    stopBatchButton.hidden = true;
    appendLog(`批量完成：${state.completed || 0}/${state.total || 0}，跳过 ${state.skipped || 0}，图片 ${state.imageCount || 0}/${state.maxImages || "?"}`);
    if (state.lastError || state.sourceError) {
      appendLog(`批量警告：${state.lastError || state.sourceError}`);
    }
  } else if (state.status === "stopping") {
    stopBatchButton.hidden = false;
    stopBatchButton.disabled = true;
    appendLog("批量停止中。");
  } else if (state.status === "stopped") {
    stopBatchButton.hidden = true;
    appendLog(`批量已停止：${state.completed || 0}/${state.total || 0}，跳过 ${state.skipped || 0}，图片 ${state.imageCount || 0}/${state.maxImages || "?"}`);
  } else if (state.status === "failed") {
    stopBatchButton.hidden = true;
    appendLog(`批量失败：${state.error || "未知错误"}`);
  }
}

function appendCaptureRequestState(state) {
  if (!state?.status) {
    return;
  }
  if (state.status === "waiting_folder") {
    summary.textContent = "请选择保存文件夹，选择后才会开始采集。";
    appendLog(`采集任务已就绪：${state.mode}`);
  } else if (state.status === "running") {
    appendLog("已开始采集。");
  } else if (state.status === "failed") {
    appendLog(`采集失败：${state.error || "未知错误"}`);
    chooseButton.disabled = false;
  }
}

async function beginCaptureIfQueued() {
  if (captureStarted) {
    return;
  }
  const result = await chrome.storage.session.get("pendingCaptureRequest");
  if (!result.pendingCaptureRequest) {
    return;
  }
  captureStarted = true;
  const response = await chrome.runtime.sendMessage({ type: "BEGIN_CAPTURE" });
  if (!response?.ok) {
    captureStarted = false;
    throw new Error(response?.error || "启动采集失败。");
  }
  appendLog("已开始后台采集。");
}

async function maybeWriteTask() {
  if (isWriting || !selectedDirHandle) {
    return;
  }
  if (!task) {
    summary.textContent = "已选择文件夹，等待采集任务完成。";
    appendLog("文件夹已就绪，等待图片列表。");
    chooseButton.disabled = true;
    return;
  }

  isWriting = true;
  chooseButton.disabled = true;
  try {
    const claim = await claimCurrentTask(task);
    if (!claim.claimed) {
      appendLog(claim.reason || "任务已由其他下载页处理。");
      summary.textContent = "任务已由其他下载页处理。";
      task = null;
      isWriting = false;
      return;
    }
    existingIndexCache = await readExistingIndex(selectedDirHandle);
    await writeTaskToDirectory(selectedDirHandle, task);
    await chrome.storage.local.remove("pendingTask");
    await clearTaskSecrets(task);
    await releaseCurrentTaskClaim(task);
    appendLog("完成。images.json 已写入或追加。");
    task = null;
    isWriting = false;
  } catch (error) {
    await releaseCurrentTaskClaim(task).catch(() => {});
    appendLog(`失败：${error.message}`);
    chooseButton.disabled = false;
    isWriting = false;
  }
}

async function claimCurrentTask(currentTask) {
  const response = await chrome.runtime.sendMessage({
    type: "CLAIM_PENDING_TASK",
    taskId: currentTask?.taskId || "",
    ownerId: downloadPageInstanceId
  });
  if (!response?.ok) {
    throw new Error(response?.error || "领取待写入任务失败。");
  }
  return response;
}

async function releaseCurrentTaskClaim(currentTask) {
  if (!currentTask?.taskId) {
    return;
  }
  await chrome.runtime.sendMessage({
    type: "RELEASE_PENDING_TASK_CLAIM",
    taskId: currentTask.taskId,
    ownerId: downloadPageInstanceId
  });
}

async function writeTaskToDirectory(dirHandle, currentTask) {
  const skipResult = await getExistingTaskSkipResult(dirHandle, currentTask);
  if (skipResult.shouldSkip) {
    appendLog(`跳过已完成任务：${currentTask.sourcePage}（历史 ${skipResult.matchedImageCount} 张覆盖本次 ${skipResult.currentImageCount} 张）`);
    return;
  }

  let completed = 0;
  const usedNames = new Set();
  const aiOptions = await normalizeAiOptions(currentTask);
  const dedupeOptions = normalizeDedupeOptions(currentTask);
  const dedupeIndex = buildDedupeIndex(existingIndexCache?.index);
  const imageDirName = getTaskImageFolderName(currentTask);
  const imageDirHandle = await dirHandle.getDirectoryHandle(imageDirName, { create: true });
  const concurrency = aiOptions.enabled ? AI_IMAGE_CONCURRENCY : DOWNLOAD_ONLY_CONCURRENCY;
  appendLog(`图片目录：${imageDirName}`);
  appendLog(`并发数：${concurrency}`);
  appendLog("同源 URL 去重：已开启");
  if (dedupeOptions.enabled) {
    appendLog("查重：已开启（内容哈希/视觉哈希）");
  } else {
    appendLog("查重：未开启（仅跳过同源 URL）");
  }

  const imageRecords = await runWithConcurrency(currentTask.images, concurrency, async (image) => {
    const record = await processImageRecord({ image, imageDirHandle, imageDirName, aiOptions, dedupeOptions, dedupeIndex, usedNames, task: currentTask });
    completed += 1;
    progress.value = completed;
    return formatImageRecord(record);
  });
  const duplicateSummary = buildDuplicateSummary(imageRecords);
  const hasDuplicateSummary = hasDuplicateFindings(duplicateSummary);

  const mergedTask = {
    ...currentTask,
    ai: buildPublicAiTaskOptions(aiOptions),
    imageFolder: imageDirName,
    completedAt: new Date().toISOString(),
    images: imageRecords
  };
  if (hasDuplicateSummary) {
    mergedTask.duplicateSummary = duplicateSummary;
  }
  delete mergedTask.prepareStats;

  const updatedIndex = await appendImagesJson(dirHandle, mergedTask);
  appendLog(`images.json 写入确认：任务 ${mergedTask.taskId}，图片 ${imageRecords.length} 张。`);
  if (hasDuplicateSummary) {
    appendDuplicateSummaryLog(duplicateSummary);
    const reportName = await maybeWriteDuplicateMarkdownReport(dirHandle, updatedIndex, mergedTask.taskId);
    if (reportName) {
      appendLog(`相似图片报告：${reportName}`);
    }
  }
  progress.value = progress.max;
}

async function processImageRecord({ image, imageDirHandle, imageDirName, aiOptions, dedupeOptions, dedupeIndex, usedNames, task }) {
  const record = { ...image };
  record.normalizedOriginalUrl = normalizeOriginalUrl(image.originalUrl);
  let urlClaim = null;
  let contentClaim = null;
  try {
    if (record.normalizedOriginalUrl) {
      const urlMatch = await claimDedupeValue(dedupeIndex.normalizedOriginalUrl, record.normalizedOriginalUrl);
      if (urlMatch.matched) {
        const match = await urlMatch.match;
        if (match) {
          appendLog(`跳过 URL 重复 ${image.savedName}`);
          return buildDuplicateRecord(record, "normalized_original_url", match);
        }
      } else {
        urlClaim = urlMatch.claim;
      }
    }

    appendLog(`检查并下载 ${image.savedName}`);
    const downloaded = await fetchFirstAvailable([image.originalUrl, ...(image.fallbackUrls || [])]);
    const blob = downloaded.blob;
    record.contentHash = dedupeOptions.enabled ? await calculateContentHash(blob) : "";
    if (dedupeOptions.enabled && record.contentHash) {
      const contentMatch = await claimDedupeValue(dedupeIndex.contentHash, record.contentHash);
      if (contentMatch.matched) {
        const match = await contentMatch.match;
        if (match) {
          if (!record.dHash && !match.dHash) {
            record.dHash = await calculateDHash(blob);
          }
          resolveDedupeClaim(urlClaim, match);
          appendLog(`跳过内容重复 ${image.savedName}`);
          return buildDuplicateRecord(record, "content_hash", match, downloaded.url, blob);
        }
      } else {
        contentClaim = contentMatch.claim;
      }
    }

    if (dedupeOptions.enabled) {
      record.dHash = await calculateDHash(blob);
      const similar = findBestDHashMatch(dedupeIndex.dHashEntries, record.dHash);
      if (similar) {
        record.duplicate = buildVisualDuplicateInfo(similar);
      }
    }

    if (aiOptions.enabled) {
      await applyVisionResult(record, blob, aiOptions, usedNames);
    } else {
      record.aiEnabled = false;
      record.savedName = makeUniqueName(record.savedName || image.savedName, usedNames);
    }
    await writeBlob(imageDirHandle, record.savedName, blob);
    appendLog(`保存 ${record.savedName}`);
    record.relativePath = `${imageDirName}/${record.savedName}`;
    record.status = "downloaded";
    record.downloadedUrl = downloaded.url;
    record.mime = blob.type || "";
    record.bytes = blob.size;
    const matchInfo = buildDedupeMatchInfo(record, task, "current_task");
    addDedupeMatch(dedupeIndex, matchInfo);
    resolveDedupeClaim(urlClaim, matchInfo);
    resolveDedupeClaim(contentClaim, matchInfo);
  } catch (error) {
    resolveDedupeClaim(urlClaim, null);
    resolveDedupeClaim(contentClaim, null);
    record.status = "failed";
    record.error = error.message;
    appendLog(`失败 ${image.savedName}: ${error.message}`);
  }
  return record;
}

function normalizeDedupeOptions(currentTask) {
  return {
    enabled: currentTask?.dedupe?.enabled === true
  };
}

function hasDuplicateFindings(summaryData) {
  return Boolean(
    Number(summaryData?.confirmedCount) ||
    Number(summaryData?.highlySimilarCount) ||
    Number(summaryData?.possiblySimilarCount)
  );
}

function buildDedupeIndex(index) {
  const dedupeIndex = {
    normalizedOriginalUrl: new Map(),
    contentHash: new Map(),
    dHashEntries: []
  };
  const tasks = Array.isArray(index?.tasks) ? index.tasks : [];
  const imageByRelativePath = buildImageByRelativePath(tasks);
  tasks.forEach((taskItem) => {
    const images = Array.isArray(taskItem?.images) ? taskItem.images : [];
    images.forEach((image) => {
      const fallbackImage = getDuplicateFallbackImage(image, imageByRelativePath);
      const match = buildDedupeMatchInfo(image, taskItem, "archive", fallbackImage);
      addDedupeMatch(dedupeIndex, match);
    });
  });
  return dedupeIndex;
}

function buildImageByRelativePath(tasks) {
  const imageByRelativePath = new Map();
  tasks.forEach((taskItem) => {
    const images = Array.isArray(taskItem?.images) ? taskItem.images : [];
    images.forEach((image) => {
      if (image?.relativePath && !imageByRelativePath.has(image.relativePath)) {
        imageByRelativePath.set(image.relativePath, image);
      }
    });
  });
  return imageByRelativePath;
}

function getDuplicateFallbackImage(image, imageByRelativePath) {
  const matchedPath = image?.duplicate?.matchedRelativePath || "";
  if (!matchedPath) {
    return null;
  }
  return imageByRelativePath.get(matchedPath) || null;
}

function addDedupeMatch(dedupeIndex, match) {
  if (!match) {
    return;
  }
  if (match.normalizedOriginalUrl && !dedupeIndex.normalizedOriginalUrl.has(match.normalizedOriginalUrl)) {
    dedupeIndex.normalizedOriginalUrl.set(match.normalizedOriginalUrl, Promise.resolve(match));
  }
  if (match.contentHash && !dedupeIndex.contentHash.has(match.contentHash)) {
    dedupeIndex.contentHash.set(match.contentHash, Promise.resolve(match));
  }
  if (match.dHash) {
    dedupeIndex.dHashEntries.push(match);
  }
}

function buildDedupeMatchInfo(image, taskItem, matchedScope, fallbackImage = null) {
  const normalizedOriginalUrl = image.normalizedOriginalUrl || normalizeOriginalUrl(image.originalUrl);
  const duplicate = image.duplicate || {};
  const relativePath = image.relativePath || duplicate.matchedRelativePath || "";
  const savedName = image.savedName || duplicate.matchedSavedName || "";
  const contentHash = image.contentHash || fallbackImage?.contentHash || "";
  const dHash = image.dHash || fallbackImage?.dHash || "";
  if (!normalizedOriginalUrl && !contentHash && !dHash && !relativePath) {
    return null;
  }
  return {
    taskId: taskItem?.taskId || "",
    sourcePage: taskItem?.sourcePage || "",
    publishedAt: taskItem?.publishedAt || "",
    imageFolder: taskItem?.imageFolder || "",
    matchedScope,
    relativePath,
    savedName,
    originalUrl: image.originalUrl || "",
    normalizedOriginalUrl,
    contentHash,
    dHash,
    commentTime: image.commentTime || image.createdTime || "",
    authorName: image.authorName || ""
  };
}

function claimDedupeValue(map, value) {
  const existing = map.get(value);
  if (existing) {
    return { matched: true, match: existing };
  }

  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  const claim = { value, resolve };
  map.set(value, promise);
  return { matched: false, claim };
}

function resolveDedupeClaim(claim, match) {
  if (claim?.resolve) {
    claim.resolve(match);
  }
}

function buildDuplicateRecord(record, matchedBy, match, downloadedUrl = "", blob = null) {
  const duplicate = {
    status: "confirmed",
    matchedBy,
    matchedScope: match?.matchedScope || "",
    matchedTaskId: match?.taskId || "",
    matchedRelativePath: match?.relativePath || "",
    matchedSavedName: match?.savedName || "",
    matchedCommentTime: match?.commentTime || "",
    matchedAuthorName: match?.authorName || "",
    matchedOriginalUrl: match?.originalUrl || "",
    matchedSourcePage: match?.sourcePage || ""
  };
  return {
    ...record,
    savedName: "",
    relativePath: "",
    downloadedUrl,
    contentHash: record.contentHash || match?.contentHash || "",
    dHash: record.dHash || match?.dHash || "",
    mime: blob?.type || record.mime || "",
    bytes: blob?.size || record.bytes || "",
    aiEnabled: false,
    status: "duplicate",
    duplicate
  };
}

async function calculateContentHash(blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return `sha256:${arrayBufferToHex(digest)}`;
}

async function calculateDHash(blob) {
  let bitmap = null;
  try {
    bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, 9, 8);
    const pixels = context.getImageData(0, 0, 9, 8).data;
    let bits = "";
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const left = getDHashLuma(pixels, y * 9 + x);
        const right = getDHashLuma(pixels, y * 9 + x + 1);
        bits += left > right ? "1" : "0";
      }
    }
    let hex = "";
    for (let index = 0; index < bits.length; index += 4) {
      hex += Number.parseInt(bits.slice(index, index + 4), 2).toString(16);
    }
    return hex.padStart(16, "0");
  } catch {
    return "";
  } finally {
    bitmap?.close?.();
  }
}

function getDHashLuma(pixels, pixelIndex) {
  const offset = pixelIndex * 4;
  return pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
}

function findBestDHashMatch(entries, dHash) {
  if (!dHash) {
    return null;
  }
  let best = null;
  entries.forEach((entry) => {
    if (!entry.dHash) {
      return;
    }
    const distance = hammingDistanceHex(dHash, entry.dHash);
    if (distance > DHASH_POSSIBLY_SIMILAR_MAX_DISTANCE) {
      return;
    }
    if (!best || distance < best.distance) {
      best = { match: entry, distance };
    }
  });
  return best;
}

function buildVisualDuplicateInfo(similar) {
  const status = similar.distance <= DHASH_HIGHLY_SIMILAR_MAX_DISTANCE ? "highly_similar" : "possibly_similar";
  return {
    status,
    matchedBy: "dhash",
    distance: similar.distance,
    similarityPercent: hashDistanceToPercent(similar.distance),
    matchedScope: similar.match.matchedScope || "",
    matchedTaskId: similar.match.taskId || "",
    matchedRelativePath: similar.match.relativePath || "",
    matchedSavedName: similar.match.savedName || "",
    matchedCommentTime: similar.match.commentTime || "",
    matchedAuthorName: similar.match.authorName || "",
    matchedOriginalUrl: similar.match.originalUrl || "",
    matchedSourcePage: similar.match.sourcePage || ""
  };
}

function hammingDistanceHex(left, right) {
  const maxLength = Math.max(String(left).length, String(right).length);
  const a = String(left).padStart(maxLength, "0");
  const b = String(right).padStart(maxLength, "0");
  let distance = 0;
  for (let index = 0; index < maxLength; index += 1) {
    const xor = Number.parseInt(a[index], 16) ^ Number.parseInt(b[index], 16);
    distance += countNibbleBits(xor);
  }
  return distance;
}

function countNibbleBits(value) {
  return ((value >> 3) & 1) + ((value >> 2) & 1) + ((value >> 1) & 1) + (value & 1);
}

function hashDistanceToPercent(distance) {
  return Math.round(((64 - Number(distance || 0)) / 64) * 100);
}

function arrayBufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeOriginalUrl(value) {
  if (!value) {
    return "";
  }
  try {
    const url = new URL(value);
    url.protocol = "https:";
    url.hash = "";
    if (/(^|\.)zhimg\.com$/i.test(url.hostname)) {
      url.search = "";
      url.pathname = url.pathname
        .replace(/\/(?:50|70|80)\//, "/")
        .replace(/_(?:\d{2,4}w|hd|b|r|l|xl|xld)(\.(?:jpe?g|png|webp|gif|image))$/i, "$1");
    } else {
      ["source", "utm_source", "utm_medium", "utm_campaign"].forEach((key) => url.searchParams.delete(key));
    }
    return url.href;
  } catch {
    return String(value).split("#")[0];
  }
}

function buildDuplicateSummary(imageRecords) {
  const confirmed = imageRecords.filter((image) => image.status === "duplicate" && image.duplicate?.status === "confirmed");
  const highlySimilar = imageRecords.filter((image) => image.duplicate?.status === "highly_similar");
  const possiblySimilar = imageRecords.filter((image) => image.duplicate?.status === "possibly_similar");
  const groupMap = new Map();

  [...confirmed, ...highlySimilar].forEach((image) => {
    const duplicate = image.duplicate || {};
    const key = `${duplicate.status}:${duplicate.matchedBy}:${duplicate.matchedTaskId}:${duplicate.matchedRelativePath}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        status: duplicate.status,
        matchedBy: duplicate.matchedBy || "",
        matchedScope: duplicate.matchedScope || "",
        matchedTaskId: duplicate.matchedTaskId || "",
        matchedRelativePath: duplicate.matchedRelativePath || "",
        matchedSavedName: duplicate.matchedSavedName || "",
        matchedCommentTime: duplicate.matchedCommentTime || "",
        matchedAuthorName: duplicate.matchedAuthorName || "",
        matchedOriginalUrl: duplicate.matchedOriginalUrl || "",
        count: 0,
        items: []
      });
    }
    const group = groupMap.get(key);
    group.count += 1;
    group.items.push({
      index: image.index,
      status: image.status,
      savedName: image.savedName || "",
      relativePath: image.relativePath || "",
      originalUrl: image.originalUrl || "",
      commentTime: image.commentTime || "",
      authorName: image.authorName || "",
      matchedBy: duplicate.matchedBy || "",
      distance: duplicate.distance,
      similarityPercent: duplicate.similarityPercent
    });
  });

  const groups = Array.from(groupMap.values()).map((group) => ({
    ...group,
    items: sortDuplicateItemsByCommentTime(group.items)
  }));

  return {
    confirmedCount: confirmed.length,
    highlySimilarCount: highlySimilar.length,
    possiblySimilarCount: possiblySimilar.length,
    groups
  };
}

function appendDuplicateSummaryLog(summaryData) {
  if (!summaryData.confirmedCount && !summaryData.highlySimilarCount && !summaryData.possiblySimilarCount) {
    appendLog("查重总结：未发现重复图片。");
    return;
  }

  appendLog(`查重总结：确认重复 ${summaryData.confirmedCount} 张已跳过；高度相似 ${summaryData.highlySimilarCount} 张已保存；可能相似 ${summaryData.possiblySimilarCount} 张已写入 JSON。`);
  const visibleGroups = summaryData.groups
    .filter((group) => group.status === "confirmed" || group.status === "highly_similar")
    .slice(0, 8);
  visibleGroups.forEach((group, index) => {
    const scopeText = group.matchedScope === "current_task" ? "本次任务图片" : "历史图片";
    const commentText = group.matchedCommentTime ? `评论 ${group.matchedCommentTime}` : "评论时间未记录";
    appendLog(`${index + 1}. ${scopeText} ${group.matchedRelativePath || group.matchedSavedName || "未知图片"}（${commentText}）：${group.count} 张`);
    if (group.status !== "confirmed" && group.matchedOriginalUrl) {
      appendLog(`   匹配源 URL：${group.matchedOriginalUrl}`);
    }
    group.items.slice(0, 5).forEach((item) => {
      const itemTime = item.commentTime ? `评论 ${item.commentTime}` : "评论时间未记录";
      const similarity = Number.isFinite(Number(item.similarityPercent)) ? `，相似度 ${item.similarityPercent}%` : "";
      const path = item.relativePath || item.savedName || item.originalUrl || "未保存图片";
      appendLog(`   - ${path}（${itemTime}${similarity}）`);
      if (group.status !== "confirmed" && item.originalUrl) {
        appendLog(`     本次图片 URL：${item.originalUrl}`);
      }
    });
    if (group.items.length > 5) {
      appendLog(`   - 另有 ${group.items.length - 5} 张`);
    }
  });
  if (summaryData.groups.length > visibleGroups.length) {
    appendLog(`另有 ${summaryData.groups.length - visibleGroups.length} 组详见 images.json。`);
  }
}

function sortDuplicateItemsByCommentTime(items) {
  return items.slice().sort((a, b) => {
    const left = parseCommentTimeForSort(a.commentTime);
    const right = parseCommentTimeForSort(b.commentTime);
    if (left === null && right === null) {
      return Number(a.index) - Number(b.index);
    }
    if (left === null) return 1;
    if (right === null) return -1;
    return left - right;
  });
}

function parseCommentTimeForSort(value) {
  const text = String(value || "");
  const match = text.match(/(\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 1000000 + Number(match[2]) * 10000 + Number(match[3] || 0) * 100 + Number(match[4] || 0);
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(Number(limit) || 1, items.length || 1));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    })
  );

  return results;
}

async function appendImagesJson(dirHandle, newTask) {
  const existing = existingIndexCache || await readExistingIndex(dirHandle);
  const now = new Date().toISOString();

  if (existing.status === "invalid") {
    const backupName = `images_invalid_${compactTimestamp(new Date())}.json`;
    const index = buildFreshIndex(newTask, now);
    if (existing.text) {
      await writeText(dirHandle, backupName, existing.text);
      appendLog(`原 images.json 不是合法结构，已备份为 ${backupName}`);
    } else {
      appendLog("原 images.json 不是合法结构，已重新生成。");
    }
    await writeText(dirHandle, "images.json", JSON.stringify(index, null, 2));
    existingIndexCache = { status: "ok", index };
    await verifyImagesJsonContainsTask(dirHandle, newTask);
    return index;
  }

  const index = existing.index || buildFreshIndex(null, now);
  delete index.version;
  index.updatedAt = now;
  if (!Array.isArray(index.tasks)) {
    index.tasks = [];
  }
  index.tasks.push(newTask);

  await writeText(dirHandle, "images.json", JSON.stringify(index, null, 2));
  existingIndexCache = { status: "ok", index };
  await verifyImagesJsonContainsTask(dirHandle, newTask);
  return index;
}

async function verifyImagesJsonContainsTask(dirHandle, expectedTask) {
  const verified = await readExistingIndex(dirHandle);
  if (verified.status !== "ok") {
    throw new Error("images.json 写入后无法重新读取。");
  }
  const tasks = Array.isArray(verified.index?.tasks) ? verified.index.tasks : [];
  const savedTask = tasks.find((taskItem) => taskItem?.taskId === expectedTask?.taskId);
  if (!savedTask) {
    throw new Error(`images.json 写入校验失败：找不到任务 ${expectedTask?.taskId || ""}。`);
  }
  const expectedImages = Array.isArray(expectedTask?.images) ? expectedTask.images.length : 0;
  const actualImages = Array.isArray(savedTask.images) ? savedTask.images.length : 0;
  if (actualImages !== expectedImages) {
    throw new Error(`images.json 写入校验失败：任务图片数 ${actualImages}/${expectedImages}。`);
  }
  existingIndexCache = verified;
}

async function maybeWriteDuplicateMarkdownReport(dirHandle, index, taskId) {
  const report = buildDuplicateMarkdownReport(index, taskId);
  if (!report) {
    return "";
  }
  const filename = `duplicate_report_${compactTimestamp(new Date())}.md`;
  await writeText(dirHandle, filename, report);
  return filename;
}

function buildDuplicateMarkdownReport(index, taskId) {
  const tasks = Array.isArray(index?.tasks) ? index.tasks : [];
  const task = tasks.find((item) => item?.taskId === taskId);
  if (!task) {
    return "";
  }

  const pairs = getHighlySimilarPairsFromTask(task, tasks);
  if (!pairs.length) {
    return "";
  }

  const lines = [
    "# 相似图片报告",
    "",
    `任务：${task.taskId || ""}`,
    `来源页面：${task.sourcePage || ""}`,
    `生成时间：${new Date().toISOString()}`,
    "",
    "## 汇总",
    "",
    `- 确认重复：${Number(task.duplicateSummary?.confirmedCount) || 0} 张，已跳过保存`,
    `- 高度相似：${Number(task.duplicateSummary?.highlySimilarCount) || 0} 张，已保存`,
    `- 可能相似：${Number(task.duplicateSummary?.possiblySimilarCount) || 0} 张，仅写入 JSON`,
    "",
    "## 高度相似图片",
    ""
  ];

  pairs.forEach((pair, index) => {
    const current = pair.current;
    const matched = pair.matched;
    const duplicate = current.duplicate || {};
    lines.push(`### ${index + 1}. 相似度 ${duplicate.similarityPercent || ""}%`);
    lines.push("");
    lines.push("历史/匹配图片：");
    if (matched.relativePath) {
      lines.push(`![历史/匹配图片](${encodeMarkdownImagePath(matched.relativePath)})`);
    } else {
      lines.push("（没有可显示的本地路径）");
    }
    lines.push("");
    lines.push("本次图片：");
    if (current.relativePath) {
      lines.push(`![本次图片](${encodeMarkdownImagePath(current.relativePath)})`);
    } else {
      lines.push("（没有可显示的本地路径）");
    }
    lines.push("");
    lines.push("| 字段 | 历史/匹配图片 | 本次图片 |");
    lines.push("|---|---|---|");
    lines.push(`| 路径 | ${mdCode(matched.relativePath)} | ${mdCode(current.relativePath)} |`);
    lines.push(`| 评论时间 | ${mdText(matched.commentTime)} | ${mdText(current.commentTime)} |`);
    lines.push(`| 评论发布人 | ${mdText(matched.authorName)} | ${mdText(current.authorName)} |`);
    lines.push(`| 图片 URL | ${mdCode(matched.originalUrl)} | ${mdCode(current.originalUrl)} |`);
    lines.push(`| 所属任务 | ${mdCode(matched.taskId)} | ${mdCode(task.taskId)} |`);
    lines.push(`| 匹配方式 | ${mdText(duplicate.matchedBy)} | ${mdText(duplicate.status)} |`);
    lines.push(`| dHash 距离 | ${mdText(duplicate.distance)} | ${mdText(duplicate.distance)} |`);
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}

function getHighlySimilarPairsFromTask(task, tasks) {
  const images = Array.isArray(task?.images) ? task.images : [];
  return images
    .filter((image) => image?.duplicate?.status === "highly_similar")
    .map((image) => ({
      current: image,
      matched: findMatchedImageForDuplicate(image.duplicate, tasks)
    }))
    .filter((pair) => pair.matched);
}

function findMatchedImageForDuplicate(duplicate, tasks) {
  const task = tasks.find((item) => item?.taskId === duplicate?.matchedTaskId);
  const images = Array.isArray(task?.images) ? task.images : [];
  const image = images.find((item) =>
    item?.relativePath === duplicate?.matchedRelativePath ||
    item?.savedName === duplicate?.matchedSavedName ||
    item?.originalUrl === duplicate?.matchedOriginalUrl
  );
  if (!image) {
    return {
      taskId: duplicate?.matchedTaskId || "",
      relativePath: duplicate?.matchedRelativePath || "",
      savedName: duplicate?.matchedSavedName || "",
      originalUrl: duplicate?.matchedOriginalUrl || "",
      commentTime: duplicate?.matchedCommentTime || "",
      authorName: duplicate?.matchedAuthorName || ""
    };
  }
  return {
    ...image,
    taskId: task?.taskId || "",
    commentTime: image.commentTime || duplicate?.matchedCommentTime || "",
    authorName: image.authorName || duplicate?.matchedAuthorName || ""
  };
}

function encodeMarkdownImagePath(value) {
  return String(value || "").split("/").map(encodeURIComponent).join("/");
}

function mdText(value) {
  return escapeMarkdownTable(String(value || ""));
}

function mdCode(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  return `\`${text.replace(/`/g, "\\`")}\``;
}

function escapeMarkdownTable(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

async function getExistingTaskSkipResult(dirHandle, currentTask) {
  const emptyResult = {
    shouldSkip: false,
    matchedImageCount: 0,
    currentImageCount: Array.isArray(currentTask?.images) ? currentTask.images.length : 0
  };
  if (currentTask?.mode !== "batch") {
    return emptyResult;
  }

  const existing = existingIndexCache || await readExistingIndex(dirHandle);
  existingIndexCache = existing.status === "ok" ? existing : existingIndexCache;
  const tasks = existing.index?.tasks;
  if (!Array.isArray(tasks)) {
    return emptyResult;
  }
  const currentSnapshot = buildTaskImageSnapshot(currentTask);
  if (!currentSnapshot.keys.size) {
    return emptyResult;
  }

  for (const taskItem of tasks) {
    if (!isCompatibleCompletedBatchTask(taskItem, currentTask)) {
      continue;
    }
    const existingSnapshot = buildTaskImageSnapshot(taskItem);
    if (
      existingSnapshot.keys.size >= currentSnapshot.keys.size &&
      setContainsEvery(existingSnapshot.keys, currentSnapshot.keys)
    ) {
      return {
        shouldSkip: true,
        matchedImageCount: existingSnapshot.keys.size,
        currentImageCount: currentSnapshot.keys.size
      };
    }
  }
  return emptyResult;
}

function isCompatibleCompletedBatchTask(taskItem, currentTask) {
  if (taskItem?.mode !== "batch") {
    return false;
  }
  if (normalizeTaskSourcePage(taskItem?.sourcePage) !== normalizeTaskSourcePage(currentTask?.sourcePage)) {
    return false;
  }
  if (getTaskSourceType(taskItem) !== getTaskSourceType(currentTask)) {
    return false;
  }
  const images = Array.isArray(taskItem?.images) ? taskItem.images : [];
  return images.length > 0 && images.every(isCompletedImageRecord);
}

function isCompletedImageRecord(image) {
  return image?.status === "downloaded" || image?.status === "skipped" || image?.status === "duplicate";
}

function buildTaskImageSnapshot(taskItem) {
  const keys = new Set();
  const images = Array.isArray(taskItem?.images) ? taskItem.images : [];
  images.forEach((image) => {
    const key = getImageIdentityKey(image);
    if (key) {
      keys.add(key);
    }
  });
  return { keys };
}

function getImageIdentityKey(image) {
  const normalizedUrl = image?.normalizedOriginalUrl || normalizeOriginalUrl(image?.originalUrl || image?.downloadedUrl || "");
  if (normalizedUrl) {
    return `url:${normalizedUrl}`;
  }
  if (image?.contentHash) {
    return `content:${image.contentHash}`;
  }
  return "";
}

function setContainsEvery(container, values) {
  for (const value of values) {
    if (!container.has(value)) {
      return false;
    }
  }
  return true;
}

function normalizeTaskSourcePage(sourcePage) {
  try {
    const url = new URL(String(sourcePage || ""));
    url.hash = "";
    return url.toString();
  } catch {
    return String(sourcePage || "").replace(/#.*$/, "");
  }
}

async function fetchFirstAvailable(urls) {
  const uniqueUrls = Array.from(new Set(urls)).filter(Boolean);
  let lastError = new Error("没有可下载的图片 URL。");

  for (const url of uniqueUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { url, blob: await response.blob() };
    } catch (error) {
      lastError = error;
      appendLog(`候选失败：${url} (${error.message})`);
    }
  }

  throw lastError;
}

async function readExistingIndex(dirHandle) {
  let text = "";
  try {
    const fileHandle = await dirHandle.getFileHandle("images.json");
    const file = await fileHandle.getFile();
    text = await file.text();
    const index = JSON.parse(text);
    if (!index || typeof index !== "object" || (index.tasks && !Array.isArray(index.tasks))) {
      return { status: "invalid", text };
    }
    return { status: "ok", index };
  } catch (error) {
    if (error.name === "NotFoundError") {
      return { status: "missing" };
    }
    if (error instanceof SyntaxError) {
      return { status: "invalid", text };
    }
    throw error;
  }
}

function buildFreshIndex(taskToAdd, updatedAt) {
  return {
    updatedAt,
    tasks: taskToAdd ? [taskToAdd] : []
  };
}

function formatImageRecord(image) {
  const record = {
    index: Number(image.index) || 0,
    savedName: image.savedName || "",
    originalName: image.originalName || "image",
    description: image.description || image.weakDescription || image.alt || image.title || "",
    aiEnabled: image.aiEnabled === true,
    status: image.status || "pending",
    originalUrl: image.originalUrl || ""
  };

  appendIfPresent(record, "normalizedOriginalUrl", image.normalizedOriginalUrl);
  appendIfPresent(record, "contentHash", image.contentHash);
  appendIfPresent(record, "dHash", image.dHash);
  appendIfPresent(record, "downloadedUrl", image.downloadedUrl);
  appendIfPresent(record, "relativePath", image.relativePath);
  record.thumbnailUrl = image.thumbnailUrl || "";
  record.fallbackUrls = image.fallbackUrls || [];
  appendIfPresent(record, "mime", image.mime);
  appendIfPresent(record, "bytes", image.bytes);
  record.width = Number(image.width) || 0;
  record.height = Number(image.height) || 0;
  record.alt = image.alt || "";
  record.title = image.title || "";
  record.weakDescription = image.weakDescription || "";
  record.hash = image.hash || "";
  appendIfPresent(record, "aiFilename", image.aiFilename);
  appendIfPresent(record, "aiModel", image.aiModel);
  appendIfPresent(record, "aiError", image.aiError);
  appendIfPresent(record, "source", image.source);
  appendIfPresent(record, "commentId", image.commentId);
  appendIfPresent(record, "authorName", image.authorName);
  appendIfPresent(record, "createdTime", image.createdTime);
  appendIfPresent(record, "commentTime", image.commentTime);
  appendIfPresent(record, "duplicate", image.duplicate);
  appendIfPresent(record, "error", image.error);
  return record;
}

function appendIfPresent(record, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    record[key] = value;
  }
}

async function writeBlob(dirHandle, filename, blob) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function writeText(dirHandle, filename, text) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

function getTaskImageFolderName(taskToSave) {
  const datePart = taskToSave?.publishedDateFolder || formatDateFolder(taskToSave?.publishedAt || taskToSave?.capturedAt || new Date().toISOString());
  const typePart = getTaskSourceType(taskToSave);
  return sanitizeFolderName(typePart ? `${datePart}_${typePart}` : datePart);
}

function getTaskSourceType(taskToSave) {
  const batchType = normalizeSourceType(taskToSave?.batch?.itemType);
  if (batchType) {
    return batchType;
  }

  const sourcePage = String(taskToSave?.sourcePage || "");
  if (/\/pin\/\d+/i.test(sourcePage)) {
    return "pin";
  }
  if (/\/answer\/\d+/i.test(sourcePage)) {
    return "answer";
  }
  if (/zhuanlan\.zhihu\.com\/p\/\d+|\/p\/\d+/i.test(sourcePage)) {
    return "post";
  }
  return "";
}

function normalizeSourceType(value) {
  const type = String(value || "").toLowerCase();
  if (type === "pin" || type === "answer" || type === "post") {
    return type;
  }
  if (type === "article") {
    return "post";
  }
  return "";
}

function formatDateFolder(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDateFolder(new Date().toISOString());
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function sanitizeFolderName(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || formatDateFolder(new Date().toISOString());
}

async function applyVisionResult(record, blob, aiOptions, usedNames) {
  try {
    appendLog(`AI 识别 ${record.savedName}`);
    const dataUrl = await blobToDataUrl(blob);
    const result = await callVisionModelApi({
      apiKey: aiOptions.apiKey,
      baseUrl: aiOptions.baseUrl,
      model: aiOptions.model,
      imageDataUrl: dataUrl,
      mime: blob.type || "image/jpeg"
    });
    const ext = getFinalExtension(record.savedName, blob.type);
    const filenameBase = sanitizeAiFilename(result.filename || "");
    if (!filenameBase) {
      throw new Error("模型没有返回可用 filename。");
    }
    record.savedName = makeUniqueName(`${filenameBase}_${record.hash || compactNameHash(record.originalUrl)}${ext}`, usedNames);
    record.description = String(result.description || "").trim() || record.description || record.weakDescription || "";
    record.aiFilename = filenameBase;
    record.aiEnabled = true;
    record.aiModel = aiOptions.model;
  } catch (error) {
    record.aiEnabled = false;
    record.aiError = error.message;
    record.savedName = makeUniqueName(record.savedName || record.originalName || "image.jpg", usedNames);
    appendLog(`AI 回退 ${record.savedName}: ${error.message}`);
  }
}

// Vision provider integration point. Replace this function when switching away from an OpenAI-compatible API.
async function callVisionModelApi({ apiKey, baseUrl, model, imageDataUrl }) {
  const endpoint = `${normalizeVisionBaseUrl(baseUrl)}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: [
            "You are a meme image renaming and semantic description assistant.",
            "Use the provided function to return structured data only.",
            "Do not guess uncertain names, titles, characters, or sources."
          ].join(" ")
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Analyze this meme image and return filename and description.",
                "Filename rules: use lowercase English only; allowed characters are a-z, 0-9, and underscores; no spaces, Chinese, emoji, punctuation, or special characters; no file extension; keep it short and no more than 8 English words.",
                "The filename should reflect the main subject, emotion, action, visible text meaning, or chat usage context.",
                "If it is suitable as a chat reaction image, prioritize usage keywords such as shocked, confused, angry, awkward, sad, smug, speechless, crying, laughing, sus, nope, agree, help.",
                "Recommended filename pattern: main_subject_emotion_usage_context.",
                "Description rules: write natural Chinese text between 80 and 180 Chinese characters; include main subject, action, expression, scene, visible text meaning, and overall emotion; explain suitable chat usage context; if text is unclear, mention that the text is unclear; briefly describe the humor mechanism when possible, such as contrast, exaggerated expression, sarcasm, absurd comparison, awkward silence, or emotional breakdown."
              ].join(" ")
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "set_image_metadata",
            description: "Return a safe local filename candidate and a Chinese semantic description for a meme image.",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                filename: {
                  type: "string",
                  description: "A concise meme filename using only lowercase English letters, digits, and underscores. No extension. No more than 8 English words. Prefer subject, emotion, action, visible text meaning, or chat reaction usage, for example cat_shocked_confused_reaction."
                },
                description: {
                  type: "string",
                  description: "A natural Chinese description, 80-180 Chinese characters, covering subject, action, expression, scene, visible text meaning, overall emotion, suitable chat usage, and humor mechanism when clear. Do not guess uncertain names or sources."
                }
              },
              required: ["filename", "description"]
            }
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: {
          name: "set_image_metadata"
        }
      },
      thinking: {
        type: "disabled"
      }
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`视觉模型 HTTP ${response.status}${text ? `: ${text.slice(0, 180)}` : ""}`);
  }

  const payload = await response.json();
  const message = payload?.choices?.[0]?.message;
  const parsed = parseVisionResult(message);
  return {
    filename: String(parsed.filename || "").trim(),
    description: String(parsed.description || "").trim()
  };
}

function parseVisionResult(message) {
  const toolArguments = message?.tool_calls?.[0]?.function?.arguments;
  if (toolArguments) {
    return parseVisionJson(toolArguments);
  }
  return parseVisionJson(message?.content);
}

function parseVisionJson(content) {
  if (!content || typeof content !== "string") {
    throw new Error("视觉模型响应缺少结构化参数。");
  }
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("视觉模型响应不是 JSON。");
    }
    return JSON.parse(match[0]);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("图片转 data URL 失败。"));
    reader.readAsDataURL(blob);
  });
}

async function normalizeAiOptions(currentTask) {
  const ai = currentTask?.ai || {};
  const apiKey = await resolveAiApiKey(currentTask);
  const enabled = ai?.enabled === true && Boolean(apiKey) && Boolean(ai.model);
  return {
    enabled,
    apiKey: enabled ? apiKey : "",
    baseUrl: enabled ? normalizeVisionBaseUrl(ai.baseUrl || "https://api.openai.com/v1") : "",
    model: enabled ? String(ai.model || "").trim() : ""
  };
}

async function resolveAiApiKey(currentTask) {
  const ai = currentTask?.ai || {};
  if (ai.apiKey) {
    return String(ai.apiKey || "").trim();
  }
  if (!ai.encryptedApiKey || !currentTask?.taskId) {
    return "";
  }

  const sessionKeyName = getAiSessionKeyName(currentTask.taskId);
  const result = await chrome.storage.session.get(sessionKeyName);
  const rawKey = result[sessionKeyName];
  if (!rawKey) {
    throw new Error("AI API Key 解密密钥已过期，请重新开始采集任务。");
  }

  const key = await crypto.subtle.importKey("raw", base64ToArrayBuffer(rawKey), { name: "AES-GCM" }, false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToArrayBuffer(ai.encryptedApiKey.iv) },
    key,
    base64ToArrayBuffer(ai.encryptedApiKey.ciphertext)
  );
  return new TextDecoder().decode(decrypted).trim();
}

async function clearTaskSecrets(currentTask) {
  if (!currentTask?.taskId || !chrome.storage?.session) {
    return;
  }
  await chrome.storage.session.remove(getAiSessionKeyName(currentTask.taskId));
}

function getAiSessionKeyName(taskId) {
  return `masakiClawAiKey:${taskId}`;
}

function base64ToArrayBuffer(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function normalizeVisionBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/i, "");
}

function buildPublicAiTaskOptions(aiOptions) {
  return {
    enabled: aiOptions.enabled,
    baseUrl: aiOptions.enabled ? aiOptions.baseUrl : "",
    model: aiOptions.enabled ? aiOptions.model : ""
  };
}

function sanitizeAiFilename(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, 70);
}

function getFinalExtension(savedName, mime) {
  const parsed = splitName(savedName);
  if (parsed.ext) {
    return parsed.ext;
  }
  if (/png/i.test(mime)) return ".png";
  if (/webp/i.test(mime)) return ".webp";
  if (/gif/i.test(mime)) return ".gif";
  return ".jpg";
}

function makeUniqueName(name, usedNames) {
  const parsed = splitName(name);
  const base = sanitizeAiFilename(parsed.base) || "image";
  const ext = sanitizeExtension(parsed.ext);
  let candidate = `${base}${ext}`;
  let counter = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base}_${counter}${ext}`;
    counter += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

function splitName(value) {
  const clean = String(value || "image.jpg").split(/[?#]/)[0];
  const match = clean.match(/^(.*?)(\.[a-zA-Z0-9]{2,5})$/);
  if (!match) {
    return { base: clean, ext: ".jpg" };
  }
  return { base: match[1] || "image", ext: match[2].toLowerCase() };
}

function sanitizeExtension(value) {
  const ext = String(value || "").toLowerCase();
  return /^\.[a-z0-9]{2,5}$/.test(ext) ? ext : ".jpg";
}

function compactNameHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

function appendLog(message) {
  log.textContent += `${message}\n`;
  log.scrollTop = log.scrollHeight;
}

function compactTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// ==UserScript==
// @name         MasakiClaw
// @namespace    https://github.com/Ayachi2225/masakiclaw
// @version      0.1.0
// @description  Collect Zhihu comment images into a structured local archive.
// @match        https://www.zhihu.com/*
// @match        https://zhuanlan.zhihu.com/*
// @run-at       document-idle
// @connect      *
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @grant        window.focus
// ==/UserScript==


(function registerJobModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createJobModule() {
  function createCollectionJob({ id, mode, targets, options = {}, now = new Date().toISOString() }) {
    if (!id || !Array.isArray(targets) || targets.length === 0) throw new Error("Collection Job requires at least one target.");
    return {
      schemaVersion: 1,
      id,
      mode,
      status: "running",
      cursor: 0,
      targets: targets.map((url) => ({ url, status: "pending" })),
      results: [],
      imageCount: 0,
      stopRequested: false,
      options,
      createdAt: now,
      updatedAt: now
    };
  }

  function requestStop(job, now = new Date().toISOString()) {
    return { ...job, status: "stopping", stopRequested: true, updatedAt: now };
  }

  function finishTarget(job, result, now = new Date().toISOString()) {
    if (job.cursor >= job.targets.length) return job;
    const targets = job.targets.slice();
    targets[job.cursor] = { ...targets[job.cursor], status: result.status, error: result.error || "" };
    const results = job.results.concat({ ...result, targetUrl: targets[job.cursor].url });
    const cursor = job.cursor + 1;
    const status = job.stopRequested ? "stopped" : result.stopJob || cursor >= targets.length ? "complete" : "running";
    return {
      ...job,
      targets,
      results,
      cursor,
      status,
      imageCount: job.imageCount + (Array.isArray(result.images) ? result.images.length : 0),
      updatedAt: now
    };
  }

  return { createCollectionJob, finishTarget, requestStop };
});


(function registerDomainModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createDomainModule() {
  const EXCLUDED_IMAGE_RE = /(?:sticker|emoji|reaction|emoticon|expression|表情|贴纸)/i;

  function isSupportedZhihuUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && /^(?:www\.zhihu\.com|zhuanlan\.zhihu\.com)$/i.test(url.hostname);
    } catch {
      return false;
    }
  }

  function normalizeTargetUrl(value) {
    if (!isSupportedZhihuUrl(value)) throw new Error("只支持知乎 HTTPS 地址。");
    const url = new URL(value);
    url.hash = "";
    return url.href;
  }

  function normalizeSourceUrl(value) {
    try {
      const url = new URL(value);
      url.hash = "";
      if (/\.zhimg\.com$/i.test(url.hostname)) {
        url.search = "";
        url.pathname = url.pathname.replace(/_(?:r|b|hd|xs|s|m|l|xl)(?=\.[a-z0-9]+$)/i, "");
      }
      return url.href;
    } catch {
      return String(value || "");
    }
  }

  function isExcludedImage(image) {
    const text = [image?.originalUrl, image?.thumbnailUrl, image?.alt, image?.title].filter(Boolean).join(" ");
    return EXCLUDED_IMAGE_RE.test(text);
  }

  function uniqueImageCandidates(images) {
    const seen = new Set();
    return (images || []).filter((image) => {
      if (!image?.originalUrl || isExcludedImage(image)) return false;
      const key = normalizeSourceUrl(image.originalUrl);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return { isSupportedZhihuUrl, normalizeTargetUrl, normalizeSourceUrl, isExcludedImage, uniqueImageCandidates };
});


(function registerDedupeModule(root, factory) {
  const domain = typeof require === "function" ? require("./domain.cjs") : root.MasakiClaw;
  const api = factory(domain);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createDedupeModule(domain) {
  function createDedupeIndex(records = []) {
    const urls = new Map();
    const contents = new Map();
    const visuals = [];
    records.forEach(add);

    function add(record) {
      if (record.originalUrl) urls.set(domain.normalizeSourceUrl(record.originalUrl), record);
      if (record.contentHash) contents.set(record.contentHash, record);
      if (record.perceptualHash || record.dHash) visuals.push(record);
    }

    function claim(record, visualThreshold = 10) {
      const sourceMatch = urls.get(domain.normalizeSourceUrl(record.originalUrl));
      if (sourceMatch) return { save: false, kind: "source_url", matched: sourceMatch };
      const contentMatch = record.contentHash && contents.get(record.contentHash);
      if (contentMatch) return { save: false, kind: "content_hash", matched: contentMatch };
      let closest = null;
      const visualHash = record.perceptualHash || record.dHash;
      if (visualHash) {
        for (const candidate of visuals) {
          const distance = hammingDistance(visualHash, candidate.perceptualHash || candidate.dHash);
          if (distance <= visualThreshold && (!closest || distance < closest.distance)) closest = { record: candidate, distance };
        }
      }
      add(record);
      return closest
        ? { save: true, kind: "visual_similarity", matched: closest.record, distance: closest.distance, similarity: Math.round((64 - closest.distance) / 64 * 100) }
        : { save: true, kind: "unique" };
    }

    return { claim, records: () => Array.from(urls.values()) };
  }

  function hammingDistance(left, right) {
    const a = String(left || "").padStart(16, "0");
    const b = String(right || "").padStart(16, "0");
    let distance = 0;
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      let value = parseInt(a[index] || "0", 16) ^ parseInt(b[index] || "0", 16);
      while (value) { distance += value & 1; value >>>= 1; }
    }
    return distance;
  }

  return { createDedupeIndex, hammingDistance };
});


(function registerZipModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createZipModule() {
  const encoder = new TextEncoder();
  const crcTable = buildCrcTable();

  function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    for (const file of files) {
      const name = encoder.encode(String(file.name).replace(/^\/+/, ""));
      const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data || ""));
      const crc = crc32(data);
      const local = header(30 + name.length);
      write32(local, 0, 0x04034b50); write16(local, 4, 20); write16(local, 6, 0x0800);
      write16(local, 8, 0); write32(local, 14, crc); write32(local, 18, data.length); write32(local, 22, data.length);
      write16(local, 26, name.length); local.set(name, 30);
      localParts.push(local, data);

      const central = header(46 + name.length);
      write32(central, 0, 0x02014b50); write16(central, 4, 20); write16(central, 6, 20); write16(central, 8, 0x0800);
      write16(central, 10, 0); write32(central, 16, crc); write32(central, 20, data.length); write32(central, 24, data.length);
      write16(central, 28, name.length); write32(central, 42, offset); central.set(name, 46);
      centralParts.push(central);
      offset += local.length + data.length;
    }
    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = header(22);
    write32(end, 0, 0x06054b50); write16(end, 8, files.length); write16(end, 10, files.length);
    write32(end, 12, centralSize); write32(end, 16, centralOffset);
    return concat(localParts.concat(centralParts, end));
  }

  function header(size) { return new Uint8Array(size); }
  function write16(bytes, offset, value) { new DataView(bytes.buffer).setUint16(offset, value, true); }
  function write32(bytes, offset, value) { new DataView(bytes.buffer).setUint32(offset, value >>> 0, true); }
  function concat(parts) {
    const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  }
  function buildCrcTable() {
    return Array.from({ length: 256 }, (_, index) => {
      let crc = index;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
      return crc >>> 0;
    });
  }
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  return { createZip };
});


(function registerCoordinatorModule(root, factory) {
  const jobApi = typeof require === "function" ? require("./job.cjs") : root.MasakiClaw;
  const api = factory(jobApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createCoordinatorModule(jobApi) {
  function createCollectionCoordinator({ taskStore, targetRunner, onProgress = () => {} }) {
    async function run(job) {
      let current = job;
      while (current.status === "running" && current.cursor < current.targets.length) {
        const target = current.targets[current.cursor];
        let result;
        try {
          result = await targetRunner(target, current.options, current);
        } catch (error) {
          result = { status: "failed", error: error?.message || String(error), images: [] };
        }
        const latest = await taskStore.load();
        if (latest?.id === current.id && latest.cursor === current.cursor && latest.stopRequested) {
          current = { ...current, stopRequested: true, status: "stopping", updatedAt: latest.updatedAt };
        }
        current = jobApi.finishTarget(current, result);
        await taskStore.save(current);
        onProgress(current);
      }
      return current;
    }

    return {
      async start(input) {
        const job = jobApi.createCollectionJob(input);
        await taskStore.save(job);
        return run(job);
      },
      async resume() {
        const job = await taskStore.load();
        if (!job || !["running", "stopping"].includes(job.status)) throw new Error("没有可恢复的 Collection Job。");
        if (job.status === "stopping") {
          return run({ ...job, status: "running", stopRequested: true, updatedAt: new Date().toISOString() });
        }
        return run(job);
      },
      async stop() {
        const job = await taskStore.load();
        if (!job || job.status !== "running") return job;
        const stopping = jobApi.requestStop(job);
        await taskStore.save(stopping);
        return stopping;
      }
    };
  }

  return { createCollectionCoordinator };
});


(function registerStorageModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createStorageModule() {
  const JOB_KEY = "masakiclaw:collection-job";
  const WORK_KEY = "masakiclaw:worker-request";
  const RESPONSE_KEY = "masakiclaw:worker-response";
  const SETTINGS_KEY = "masakiclaw:settings";
  const DEDUPE_KEY = "masakiclaw:dedupe-history";

  function createTaskStore(storageAdapter) {
    return {
      load: () => storageAdapter.get(JOB_KEY, null),
      save: (job) => storageAdapter.set(JOB_KEY, job),
      clear: () => storageAdapter.delete(JOB_KEY)
    };
  }
  function createGMTaskStore() { return createTaskStore({ get: (key, fallback) => GM.getValue(key, fallback), set: (key, value) => GM.setValue(key, value), delete: (key) => GM.deleteValue(key) }); }

  async function waitForWorker(request, timeoutMs = 180000, onReady = () => {}) {
    await GM.deleteValue(RESPONSE_KEY);
    let resolveResult;
    let rejectResult;
    let settled = false;
    let timer;
    const result = new Promise((resolve, reject) => { resolveResult = resolve; rejectResult = reject; });
    const listener = GM_addValueChangeListener(RESPONSE_KEY, (_key, _old, value) => {
      if (value?.nonce !== request.nonce) return;
      finish(value.ok ? null : new Error(value.error || "目标页采集失败。"), value.result);
    });
    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      GM_removeValueChangeListener(listener);
      GM.deleteValue(WORK_KEY).catch(() => {});
      if (error) rejectResult(error); else resolveResult(value);
    }
    try {
      await GM.setValue(WORK_KEY, request);
      onReady();
      timer = setTimeout(() => finish(new Error("目标页采集超时。")), timeoutMs);
    } catch (error) {
      finish(error);
    }
    return result;
  }

  return { JOB_KEY, WORK_KEY, RESPONSE_KEY, SETTINGS_KEY, DEDUPE_KEY, createTaskStore, createGMTaskStore, waitForWorker };
});


(function registerCredentialModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createCredentialModule() {
  const CREDENTIAL_KEY = "masakiclaw:ai-credential";
  const ITERATIONS = 210000;
  const PEPPER = "MasakiClaw::local-ai-key::v1";

  function validatePassword(password) {
    if (!/^[\x20-\x7e]{6}$/.test(password || "")) throw new Error("AI Key 密码必须是 6 位 ASCII 字符。");
  }

  async function resolveCredential({ apiKey, password, saveKey, plainSave, baseUrl, model }) {
    const entered = String(apiKey || "").trim();
    if (entered) {
      if (saveKey) await saveCredential({ apiKey: entered, password, plainSave, baseUrl, model });
      return entered;
    }
    const saved = await GM.getValue(CREDENTIAL_KEY, null);
    if (!saved) return "";
    if (saved.mode === "plain") return String(saved.apiKey || "").trim();
    validatePassword(password);
    try {
      const key = await derive(password, fromBase64(saved.salt), ["decrypt"]);
      const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(saved.iv) }, key, fromBase64(saved.ciphertext));
      await GM.setValue(CREDENTIAL_KEY, { ...saved, attempts: 0, baseUrl, model });
      return new TextDecoder().decode(clear).trim();
    } catch {
      const attempts = Number(saved.attempts || 0) + 1;
      if (attempts >= 5) { await GM.deleteValue(CREDENTIAL_KEY); throw new Error("密码连续错误 5 次，已删除保存的 API Key。"); }
      await GM.setValue(CREDENTIAL_KEY, { ...saved, attempts });
      throw new Error(`AI Key 密码错误，还剩 ${5 - attempts} 次。`);
    }
  }

  async function saveCredential({ apiKey, password, plainSave, baseUrl, model }) {
    if (plainSave) return GM.setValue(CREDENTIAL_KEY, { mode: "plain", apiKey, baseUrl, model, attempts: 0 });
    validatePassword(password);
    const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await derive(password, salt, ["encrypt"]);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(apiKey));
    return GM.setValue(CREDENTIAL_KEY, { mode: "encrypted", algorithm: "PBKDF2-SHA256+AES-GCM", iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(ciphertext), baseUrl, model, attempts: 0 });
  }
  async function derive(password, salt, usages) { const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${password}${PEPPER}`), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, usages); }
  function toBase64(value) { let binary = ""; for (const byte of new Uint8Array(value.buffer || value)) binary += String.fromCharCode(byte); return btoa(binary); }
  function fromBase64(value) { const binary = atob(value); return Uint8Array.from(binary, (char) => char.charCodeAt(0)); }
  return { resolveCredential, saveCredential, validatePassword };
});


(function registerArchiveModule(root, factory) {
  const dependencies = typeof require === "function"
    ? Object.assign({}, require("./domain.cjs"), require("./dedupe.cjs"), require("./zip.cjs"), require("./storage.cjs"))
    : root.MasakiClaw || {};
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createArchiveModule(core) {
  const encoder = new TextEncoder();
  const ZIP_VOLUME_LIMIT = 250 * 1024 * 1024;

  async function createArchiveWriter({ directoryHandle = null, options = {}, onLog = () => {}, volumeLimit = ZIP_VOLUME_LIMIT }) {
    let index = { schemaVersion: 1, updatedAt: "", tasks: [] };
    const zipFiles = [];
    const history = await GM.getValue(core.DEDUPE_KEY, []);
    if (directoryHandle) index = await readIndex(directoryHandle);
    const archiveRecords = index.tasks.flatMap((task) => task.images || []);
    const dedupe = core.createDedupeIndex(history.concat(archiveRecords));

    async function writeTarget(result, job) {
      const taskId = `${job.id}-${String(Number(job.cursor || 0) + 1).padStart(4, "0")}`;
      const existingTask = index.tasks.find((task) => task.taskId === taskId);
      if (existingTask) {
        onLog(`跳过已归档目标：${existingTask.sourcePage}`);
        return existingTask;
      }
      const folder = makeFolder(result, taskId);
      const records = [];
      for (const candidate of result.images || []) {
        if (!options.unlimitedImages && records.length >= Number(options.maxImages || 80)) break;
        let record;
        try {
          record = await processCandidate({ ...candidate, index: records.length + 1 }, folder, job);
        } catch (error) {
          record = { ...candidate, index: records.length + 1, status: "failed", saved: false, savedName: "", error: error?.message || String(error) };
        }
        records.push(record);
        onLog(record.saved === false ? `跳过重复：${candidate.originalUrl}` : `已处理：${record.savedName}`);
      }
      const task = {
        taskId,
        mode: job.mode,
        sourcePage: result.sourcePage,
        pageTitle: result.pageTitle || "",
        capturedAt: result.capturedAt || "",
        publishedAt: result.publishedAt || "",
        scope: result.scope || "comments",
        imageFolder: folder,
        createdAt: job.createdAt,
        completedAt: new Date().toISOString(),
        options: publicOptions(options),
        dedupe: { enabled: options.dedupeEnabled === true },
        ai: { enabled: options.aiEnabled === true, baseUrl: options.visionBaseUrl || "", model: options.visionModel || "" },
        images: records
      };
      index.tasks.push(task);
      index.updatedAt = new Date().toISOString();
      if (directoryHandle) await writeJson(directoryHandle, "images.json", index);
      if (directoryHandle) await GM.setValue(core.DEDUPE_KEY, dedupe.records().slice(-10000));
      return task;
    }

    async function restoreTask(task) {
      if (!task || index.tasks.some((item) => item.taskId === task.taskId)) return task;
      for (const record of task.images || []) {
        if (record.status !== "downloaded" || !record.relativePath) continue;
        const blob = await fetchImage(record);
        zipFiles.push({ name: record.relativePath, data: new Uint8Array(await blob.arrayBuffer()) });
      }
      index.tasks.push(task);
      for (const record of task.images || []) dedupe.claim({ originalUrl: record.originalUrl, contentHash: record.contentHash, dHash: record.dHash });
      return task;
    }

    async function processCandidate(candidate, folder, job) {
      const normalizedUrl = core.normalizeSourceUrl(candidate.originalUrl);
      const urlClaim = dedupe.claim({ originalUrl: normalizedUrl });
      if (!urlClaim.save) return duplicateRecord(candidate, urlClaim, normalizedUrl);
      const blob = await fetchImage(candidate);
      const contentHash = options.dedupeEnabled ? await sha256(blob) : "";
      const perceptualHash = options.dedupeEnabled ? await dHash(blob).catch(() => "") : "";
      const fingerprintClaim = options.dedupeEnabled
        ? dedupe.claim({ originalUrl: `${normalizedUrl}#content`, contentHash, perceptualHash })
        : { save: true, kind: "unique" };
      if (!fingerprintClaim.save) return duplicateRecord({ ...candidate, contentHash, perceptualHash }, fingerprintClaim, normalizedUrl);
      let savedName = safeName(candidate.originalName || new URL(normalizedUrl).pathname.split("/").pop() || "image.jpg");
      let description = "";
      let aiError = "";
      if (options.aiEnabled && options.apiKey) {
        try {
          const vision = await callVision(blob, options);
          savedName = safeName(`${vision.filename || stripExtension(savedName)}.${extension(savedName, blob.type)}`);
          description = vision.description || "";
        } catch (error) { aiError = String(error?.message || error).slice(0, 240); }
      }
      savedName = `${compactHash(normalizedUrl)}_${savedName}`;
      const relativePath = `${folder}/${savedName}`;
      if (directoryHandle) await writeBlobPath(directoryHandle, relativePath, blob);
      else zipFiles.push({ name: relativePath, data: new Uint8Array(await blob.arrayBuffer()) });
      const record = {
        ...candidate,
        originalUrl: normalizedUrl,
        normalizedOriginalUrl: normalizedUrl,
        downloadedUrl: normalizedUrl,
        saved: true,
        status: "downloaded",
        savedName,
        relativePath,
        contentHash,
        dHash: perceptualHash,
        mime: blob.type || "",
        bytes: blob.size,
        aiEnabled: options.aiEnabled === true,
        description: description || candidate.weakDescription || candidate.alt || candidate.title || "",
        aiError
      };
      if (fingerprintClaim.kind === "visual_similarity") record.duplicate = duplicateInfo(fingerprintClaim);
      return record;
    }

    async function complete(job) {
      index.updatedAt = new Date().toISOString();
      await GM.setValue(core.DEDUPE_KEY, dedupe.records().slice(-10000));
      if (directoryHandle) {
        await writeJson(directoryHandle, "images.json", index);
        await writeText(directoryHandle, `task-${job.id}.log`, buildLog(index));
        await writeText(directoryHandle, `similar-${job.id}.md`, buildSimilarityReport(index));
        return { kind: "directory", taskCount: index.tasks.length };
      }
      const contentVolumes = splitVolumes(zipFiles, Math.max(1024, volumeLimit - 1024 * 1024));
      const volumes = (contentVolumes.length ? contentVolumes : [[]]).map((volume, volumeIndex) => {
        const localIndex = buildVolumeIndex(index, volume, volumeIndex === 0);
        return volume.concat([
          { name: "images.json", data: encoder.encode(JSON.stringify(localIndex, null, 2)) },
          { name: `task-${job.id}.log`, data: encoder.encode(buildLog(localIndex)) },
          { name: `similar-${job.id}.md`, data: encoder.encode(buildSimilarityReport(localIndex)) }
        ]);
      });
      for (let indexNumber = 0; indexNumber < volumes.length; indexNumber += 1) {
        const suffix = volumes.length > 1 ? `.part${String(indexNumber + 1).padStart(2, "0")}` : "";
        downloadBlob(new Blob([core.createZip(volumes[indexNumber])], { type: "application/zip" }), `masakiclaw-${job.id}${suffix}.zip`);
      }
      return { kind: "zip", volumes: volumes.length, taskCount: index.tasks.length };
    }

    return { writeTarget, restoreTask, complete };
  }

  async function fetchImage(candidate) {
    const urls = [candidate.originalUrl, ...(candidate.fallbackUrls || []), candidate.thumbnailUrl].filter(Boolean);
    let lastError;
    for (const url of urls) {
      try {
        const response = await gmRequest({ method: "GET", url, responseType: "arraybuffer" });
        if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
        return new Blob([response.response], { type: response.responseHeaders?.match(/content-type:\s*([^;\r\n]+)/i)?.[1] || "application/octet-stream" });
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error("图片下载失败。");
  }

  async function callVision(blob, options) {
    const endpoint = String(options.visionBaseUrl || "https://api.openai.com/v1").replace(/\/+$/, "").replace(/\/chat\/completions$/i, "") + "/chat/completions";
    if (!/^https:\/\//i.test(endpoint)) throw new Error("视觉模型 API 必须使用 HTTPS。");
    const dataUrl = await blobToDataUrl(blob);
    const response = await gmRequest({
      method: "POST", url: endpoint,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${options.apiKey}` },
      data: JSON.stringify({ model: options.visionModel || "gpt-4o-mini", temperature: 0.2, messages: [{ role: "user", content: [{ type: "text", text: "Return JSON only: {\"filename\":\"short-safe-name\",\"description\":\"one short Chinese description\"}." }, { type: "image_url", image_url: { url: dataUrl } }] }] }),
      responseType: "json"
    });
    if (response.status < 200 || response.status >= 300) throw new Error(`AI HTTP ${response.status}`);
    const content = response.response?.choices?.[0]?.message?.content || "";
    const match = String(content).match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI 未返回 JSON。");
    return JSON.parse(match[0]);
  }

  function gmRequest(details) {
    return new Promise((resolve, reject) => GM.xmlHttpRequest({ ...details, onload: resolve, onerror: () => reject(new Error("网络请求失败。")), ontimeout: () => reject(new Error("网络请求超时。")), timeout: 60000 }));
  }
  async function sha256(blob) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
  async function dHash(blob) {
    const bitmap = await createImageBitmap(blob); const canvas = document.createElement("canvas"); canvas.width = 9; canvas.height = 8;
    const context = canvas.getContext("2d", { willReadFrequently: true }); context.drawImage(bitmap, 0, 0, 9, 8); bitmap.close?.();
    const pixels = context.getImageData(0, 0, 9, 8).data; let bits = "";
    for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) { const a = (y * 9 + x) * 4; const b = a + 4; bits += pixels[a] + pixels[a + 1] + pixels[a + 2] > pixels[b] + pixels[b + 1] + pixels[b + 2] ? "1" : "0"; }
    return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
  }
  function duplicateRecord(candidate, claim, originalUrl) { return { ...candidate, originalUrl, normalizedOriginalUrl: originalUrl, saved: false, status: "skipped_duplicate", savedName: "", skippedReason: claim.kind, duplicate: duplicateInfo(claim) }; }
  function duplicateInfo(claim) { return { matchedBy: claim.kind === "source_url" ? "normalized_original_url" : claim.kind, matchedOriginalUrl: claim.matched?.originalUrl || "", distance: claim.distance, similarity: claim.similarity }; }
  function splitVolumes(files, maxBytes) { const result = []; let part = []; let size = 0; for (const file of files) { if (part.length && size + file.data.length > maxBytes) { result.push(part); part = []; size = 0; } part.push(file); size += file.data.length; } if (part.length) result.push(part); return result; }
  function buildVolumeIndex(sourceIndex, files, includeUnsaved) { const paths = new Set(files.map((file) => file.name)); return { ...sourceIndex, tasks: sourceIndex.tasks.map((task) => ({ ...task, images: (task.images || []).filter((image) => image.status === "downloaded" ? paths.has(image.relativePath) : includeUnsaved) })).filter((task) => task.images.length || includeUnsaved) }; }
  function makeFolder(result, id) { return `${new Date().toISOString().slice(0, 10)}_${safeName((result.pageTitle || "zhihu").slice(0, 48))}_${id.slice(-6)}`; }
  function safeName(value) { return String(value || "image").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 100) || "image"; }
  function compactHash(value) { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
  function stripExtension(value) { return value.replace(/\.[a-z0-9]{1,8}$/i, ""); }
  function extension(value, mime) { return value.match(/\.([a-z0-9]{1,8})$/i)?.[1] || mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg"; }
  function publicOptions(options) { const copy = { ...options }; delete copy.apiKey; delete copy.visionPassword; return copy; }
  function buildLog(index) { return index.tasks.map((task) => `${task.completedAt}\t${task.sourcePage}\t${task.images.length}`).join("\n") + "\n"; }
  function buildSimilarityReport(index) { const rows = index.tasks.flatMap((task) => task.images.filter((image) => image.duplicate?.matchedBy === "visual_similarity").map((image) => `- ${image.relativePath || image.originalUrl} ↔ ${image.duplicate.matchedOriginalUrl} (${image.duplicate.similarity || "?"}%)`)); return `# MasakiClaw 相似图片报告\n\n${rows.length ? rows.join("\n") : "未发现视觉相似图片。"}\n`; }
  async function readIndex(dir) { try { const file = await (await dir.getFileHandle("images.json")).getFile(); const value = JSON.parse(await file.text()); return Array.isArray(value.tasks) ? value : { schemaVersion: 1, updatedAt: "", tasks: [] }; } catch { return { schemaVersion: 1, updatedAt: "", tasks: [] }; } }
  async function writeBlobPath(root, path, blob) { const parts = path.split("/"); const name = parts.pop(); let dir = root; for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true }); const handle = await dir.getFileHandle(name, { create: true }); const writable = await handle.createWritable(); await writable.write(blob); await writable.close(); }
  async function writeText(root, name, value) { return writeBlobPath(root, name, new Blob([value], { type: "text/plain;charset=utf-8" })); }
  async function writeJson(root, name, value) { return writeText(root, name, JSON.stringify(value, null, 2)); }
  function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); const timer = setTimeout(() => URL.revokeObjectURL(url), 60000); timer?.unref?.(); }
  function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); }
  return { createArchiveWriter, buildVolumeIndex };
});


(function registerUiModule(root, factory) {
  const api = factory();
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createUiModule() {
  function createControlPanel({ onStart, onStop, onResume }) {
    const host = document.createElement("div"); host.id = "masakiclaw-userscript-host"; document.documentElement.append(host);
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `<style>${styles()}</style>
      <button id="claw" title="MasakiClaw">M</button>
      <section id="panel" hidden>
        <header><strong>MasakiClaw</strong><button id="close">×</button></header>
        <p class="hint">采集知乎评论区图片并生成结构化归档</p>
        <div id="resume" class="notice" hidden><span>发现未完成任务</span><button id="resumeButton">恢复</button></div>
        <label>采集模式<select id="mode"><option value="current">当前页</option><option value="url">指定 URL</option><option value="batch">批量</option></select></label>
        <label id="urlRow" hidden>目标 URL<textarea id="targetUrl" rows="2"></textarea></label>
        <fieldset id="batchRow" hidden><legend>批量来源</legend><label><input class="source" type="checkbox" value="answer" checked>回答</label><label><input class="source" type="checkbox" value="post" checked>文章</label><label><input class="source" type="checkbox" value="pin" checked>想法</label></fieldset>
        <div class="grid"><label>最大图片数<input id="maxImages" type="number" min="1" value="80"></label><label class="check"><input id="unlimitedImages" type="checkbox">不限制</label></div>
        <label class="check"><input id="autoScroll" type="checkbox" checked>自动滚动加载评论</label>
        <label class="check"><input id="allowSecondaryReplies" type="checkbox">尝试采集次级评论</label>
        <label class="check"><input id="dedupeEnabled" type="checkbox">开启内容/视觉查重</label>
        <div class="grid"><label>滚动次数<input id="scrollSteps" type="number" min="0" max="80" value="24"></label><label class="check"><input id="scrollUntilBottom" type="checkbox">滚动到底</label></div>
        <label class="check"><input id="aiEnabled" type="checkbox">启用 AI 视觉理解与重命名</label>
        <div id="aiRows" hidden>
          <label>API Key<input id="apiKey" type="password" autocomplete="off"></label>
          <label class="check"><input id="saveKey" type="checkbox" checked>保存 API Key</label>
          <label class="check"><input id="plainSave" type="checkbox">明文保存（显式选择）</label>
          <label>6 位 ASCII 密码<input id="password" type="password" maxlength="6" autocomplete="off"></label>
          <label>Base URL<input id="baseUrl" value="https://api.openai.com/v1"></label>
          <label>模型<input id="model" value="gpt-4o-mini"></label>
        </div>
        <div class="actions"><button id="start">开始采集</button><button id="stop" class="secondary" hidden>停止</button></div>
        <progress id="progress" max="1" value="0"></progress><pre id="log"></pre>
      </section>`;
    const $ = (selector) => shadow.querySelector(selector);
    const panel = $("#panel"); const logElement = $("#log");
    let operationRunning = false;
    let stopAvailable = false;
    $("#claw").onclick = () => { panel.hidden = !panel.hidden; };
    $("#close").onclick = () => { panel.hidden = true; };
    $("#mode").onchange = syncMode; $("#aiEnabled").onchange = () => { $("#aiRows").hidden = !$("#aiEnabled").checked; };
    $("#start").onclick = async () => runLongAction(onStart, getOptions());
    $("#stop").onclick = async () => { $("#stop").disabled = true; try { await onStop?.(); } catch (error) { log(`失败：${error?.message || error}`); $("#stop").disabled = false; } };
    $("#resumeButton").onclick = async () => runLongAction(onResume, getOptions());

    function syncMode() { $("#urlRow").hidden = $("#mode").value !== "url"; $("#batchRow").hidden = $("#mode").value !== "batch"; }
    function getOptions() {
      return {
        mode: $("#mode").value, targetUrl: $("#targetUrl").value.trim(), batchSources: Array.from(shadow.querySelectorAll(".source:checked"), (item) => item.value),
        maxImages: Number($("#maxImages").value || 80), unlimitedImages: $("#unlimitedImages").checked, autoScroll: $("#autoScroll").checked,
        allowSecondaryReplies: $("#allowSecondaryReplies").checked, dedupeEnabled: $("#dedupeEnabled").checked,
        scrollSteps: Number($("#scrollSteps").value || 24), scrollUntilBottom: $("#scrollUntilBottom").checked,
        aiEnabled: $("#aiEnabled").checked, apiKey: $("#apiKey").value.trim(), saveKey: $("#saveKey").checked,
        plainSave: $("#plainSave").checked, visionPassword: $("#password").value, visionBaseUrl: $("#baseUrl").value.trim(), visionModel: $("#model").value.trim()
      };
    }
    async function runLongAction(action, value) { if (!action || operationRunning) return; operationRunning = true; setBusy(true); try { await action(value); } catch (error) { log(`失败：${error?.message || error}`); } finally { operationRunning = false; setBusy(false); } }
    function setBusy(busy) { $("#start").disabled = busy; $("#resumeButton").disabled = busy; $("#stop").hidden = !busy || !stopAvailable; $("#stop").disabled = false; }
    function setStopAvailable(available) { stopAvailable = available; $("#stop").hidden = !operationRunning || !stopAvailable; $("#stop").disabled = false; }
    function log(message) { logElement.textContent += `[${new Date().toLocaleTimeString()}] ${message}\n`; logElement.scrollTop = logElement.scrollHeight; }
    function progress(done, total) { $("#progress").max = Math.max(1, total || 1); $("#progress").value = done || 0; }
    function offerResume(show) { $("#resume").hidden = !show; }
    function open() { panel.hidden = false; }
    function loadSettings(settings = {}) { for (const [id, value] of Object.entries(settings)) { if (id === "batchSources" && Array.isArray(value)) { for (const node of shadow.querySelectorAll(".source")) node.checked = value.includes(node.value); continue; } const node = $(`#${id}`); if (!node || value === undefined) continue; if (node.type === "checkbox") node.checked = Boolean(value); else node.value = value; } syncMode(); $("#aiRows").hidden = !$("#aiEnabled").checked; }
    return { open, log, progress, offerResume, getOptions, loadSettings, setBusy, setStopAvailable };
  }

  function styles() { return `:host{all:initial}*{box-sizing:border-box}#claw{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:44px;height:44px;border:0;border-radius:50%;background:#111827;color:#fff;font:bold 20px system-ui;box-shadow:0 8px 28px #0004;cursor:pointer}#panel{position:fixed;right:18px;bottom:72px;z-index:2147483647;width:min(390px,calc(100vw - 24px));max-height:calc(100vh - 92px);overflow:auto;padding:16px;border:1px solid #d1d5db;border-radius:14px;background:#fff;color:#111827;font:14px/1.4 system-ui;box-shadow:0 16px 48px #0005}header{display:flex;justify-content:space-between;align-items:center;font-size:18px}header button{border:0;background:none;font-size:24px;cursor:pointer}.hint{margin:3px 0 12px;color:#6b7280}label,fieldset{display:block;margin:9px 0}input,textarea,select{width:100%;margin-top:4px;padding:7px;border:1px solid #cbd5e1;border-radius:7px;font:inherit}.check{display:flex;align-items:center;gap:7px}.check input,fieldset input{width:auto;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}fieldset{border:1px solid #e5e7eb;border-radius:8px}fieldset label{display:inline-flex;margin:4px 10px 4px 0;gap:4px}.actions{display:flex;gap:8px;margin-top:12px}.actions button,.notice button{padding:8px 12px;border:0;border-radius:8px;background:#2563eb;color:white;cursor:pointer}.secondary{background:#64748b!important}.notice{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:#fef3c7}progress{width:100%;margin-top:10px}pre{min-height:50px;max-height:150px;overflow:auto;white-space:pre-wrap;background:#0f172a;color:#d1fae5;padding:8px;border-radius:8px;font:12px/1.35 ui-monospace}`; }
  return { createControlPanel };
});


(() => {
  const MIN_USEFUL_SIDE = 80;
  const MAX_ICON_AREA = 120 * 120;
  const MIN_SCROLL_RANGE = 240;
  const LAZY_ATTRS = ["data-original", "data-actualsrc", "data-src", "data-lazy-src", "data-url", "data-rawsrc"];
  const COMMENT_SELECTORS = [
    "div[data-id] .CommentContent",
    "div[data-id] [class*='CommentContent']",
    ".Comments-container",
    ".CommentsV2",
    ".CommentItem",
    ".CommentList-item",
    ".CommentContent",
    ".CommentList",
    ".CommentListV2",
    ".CommentTopbar",
    "[class*='CommentList']",
    "[class*='Comments-container']",
    "[class*='CommentsContainer']",
    "[class*='CommentsV2']",
    "[class*='CommentItem']",
    "[class*='CommentContent']",
    "[class*='commentItem']",
    "[class*='comment-content']",
    "[aria-label*='评论']"
  ];
  const COMMENT_DIALOG_SELECTORS = [
    "[role='dialog']",
    ".Modal",
    "[class*='Modal']"
  ];
  const EXCLUDE_ANCESTOR_RE = /(avatar|author|userlink|badge|icon|toolbar|button|vote|reaction|popover|header|footer|commentauthor)/i;
  let activeCommentView = "auto";
  let activeSecondaryReplyRoot = null;
  let activeContentRoot = null;
  const secondaryReplyImages = [];
  const processedSecondaryReplyButtons = new Set();

  window.masakiClawPreparePage = async function masakiClawPreparePage(options = {}) {
    const scrollUntilBottom = options.scrollUntilBottom === true || options.maxScrolls === null;
    const maxScrolls = scrollUntilBottom ? 500 : Math.max(0, Math.min(Number(options.maxScrolls) || 24, 80));
    const delayMs = Math.max(250, Math.min(Number(options.delayMs) || 900, 3000));
    const allowSecondaryReplies = options.allowSecondaryReplies === true;
    activeCommentView = "auto";
    activeSecondaryReplyRoot = null;
    activeContentRoot = findTargetContentRoot(options);
    const targetAnswerId = getAnswerIdFromUrl(options.targetUrl || location.href);
    const initialY = window.scrollY;
    const stats = {
      scriptVersion: "2026-06-28-secondary-reply-persistent-root",
      commentView: "auto",
      allowSecondaryReplies,
      scrollUntilBottom,
      maxScrolls,
      delayMs,
      scrolls: 0,
      clicks: 0,
      initialY,
      finalY: initialY,
      finalHeight: document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0,
      targetAnswerId,
      targetContentRoot: activeContentRoot ? getElementSignature(activeContentRoot) : ""
    };
    const expectedBeforeOpen = getExpectedCommentCount();
    const commentScope = activeContentRoot || document;
    const loadedBeforeOpen = activeContentRoot ? getLoadedCommentContentNodes(commentScope).length : getLoadedCommentContentNodes(document).length;
    const alreadyHasModal = findCommentDialog();
    const hasRequiredAnswerRoot = !targetAnswerId || Boolean(activeContentRoot);
    const shouldOpenFullComments = hasRequiredAnswerRoot && !alreadyHasModal && (loadedBeforeOpen === 0 || (expectedBeforeOpen > 0 && loadedBeforeOpen < expectedBeforeOpen));
    stats.expectedCommentCountBeforeOpen = expectedBeforeOpen;
    stats.loadedCommentContentBeforeOpen = loadedBeforeOpen;
    stats.targetContentRootMissing = Boolean(targetAnswerId && !activeContentRoot);
    stats.openFullCommentsReason = shouldOpenFullComments
      ? loadedBeforeOpen === 0
        ? "no_loaded_comments"
        : "embedded_comments_incomplete"
      : "";
    if (shouldOpenFullComments) {
      const openerClickResult = await clickCommentOpeners();
      stats.clicks += openerClickResult.clicks;
      stats.commentOpener = openerClickResult;
    }
    stats.dialogFound = false;
    stats.dialogSelector = "";

    const initialDialog = await waitForCommentDialog(delayMs * 4);
    if (initialDialog) {
      stats.dialogFound = true;
      stats.dialogSelector = getElementSignature(initialDialog);
      activeCommentView = "modal";
    } else {
      activeCommentView = "embedded";
    }
    stats.commentView = activeCommentView;

    stats.commentLocatorBeforeScroll = locateComments();

    const commentAnchor = findCommentAnchor();
    if (commentAnchor) {
      scrollToCommentTop(commentAnchor);
      stats.commentAnchorSelector = getElementSignature(commentAnchor);
      await wait(delayMs);
    }
    stats.scanStartY = window.scrollY;
    const scanBottomY = getWindowScanBottom(commentAnchor);
    stats.scanBottomY = scanBottomY;

    let stableRounds = 0;
    let bottomRounds = 0;
    let scrollTarget = normalizeScrollTarget(getBestScrollTarget());
    let lastHeight = getScrollTargetHeight(scrollTarget);
    let lastImageCount = countPotentialCommentImages();
    let lastCommentCount = countLoadedCommentContents();
    const earlyStopMinScrolls = scrollUntilBottom
      ? activeCommentView === "modal" ? Math.min(maxScrolls, 12) : Math.min(maxScrolls, 8)
      : activeCommentView === "modal" ? Math.min(maxScrolls, 6) : Math.min(maxScrolls, 4);
    const bottomStopRounds = scrollUntilBottom
      ? activeCommentView === "modal" ? 8 : 4
      : activeCommentView === "modal" ? 4 : 2;
    const stableStopRounds = scrollUntilBottom
      ? activeCommentView === "modal" ? 12 : 8
      : activeCommentView === "modal" ? 5 : 3;
    stats.earlyStopMinScrolls = earlyStopMinScrolls;
    stats.bottomStopRounds = bottomStopRounds;
    stats.stableStopRounds = stableStopRounds;

    for (let index = 0; index < maxScrolls; index += 1) {
      if (isSecondaryReplyView()) {
        const returnStats = await ensureSecondaryReplyReturned(delayMs);
        stats.secondaryReplies = mergeSecondaryReplyStats(stats.secondaryReplies, returnStats);
        if (!returnStats.returned) {
          stats.stoppedInSecondaryReplyView = true;
          break;
        }
      }

      const beforeLoadMore = await clickLoadMoreButtons();
      stats.clicks += beforeLoadMore.clicks;

      scrollTarget = normalizeScrollTarget(getBestScrollTarget());
      if (scrollTarget !== window) {
        stats.dialogFound = true;
        stats.dialogSelector = getElementSignature(scrollTarget);
      }
      const beforeY = getScrollTargetTop(scrollTarget);
      const actualScrollTarget = scrollElementBy(scrollTarget, Math.max(760, window.innerHeight * 1.25), { restrictToDialog: activeCommentView === "modal" });
      const statsTarget = actualScrollTarget || scrollTarget;
      const settled = await waitForLazyContentSettled(statsTarget, delayMs);
      const afterLoadMore = await clickLoadMoreButtons();
      if (afterLoadMore.clicks) {
        stats.clicks += afterLoadMore.clicks;
        await waitForLazyContentSettled(statsTarget, delayMs);
      }
      if (allowSecondaryReplies) {
        const secondaryStats = await processSecondaryReplyButtons(delayMs);
        if (secondaryStats.visits || secondaryStats.skipped || secondaryStats.returnFailed) {
          stats.secondaryReplies = mergeSecondaryReplyStats(stats.secondaryReplies, secondaryStats);
        }
        if (secondaryStats.returnFailed) {
          stats.stoppedInSecondaryReplyView = true;
          break;
        }
      }

      const height = getScrollTargetHeight(statsTarget);
      const imageCount = countPotentialCommentImages();
      const commentCount = countLoadedCommentContents();
      const currentY = getScrollTargetTop(statsTarget);
      const viewportHeight = getScrollTargetViewportHeight(statsTarget);
      const scrollRange = statsTarget === window ? height - viewportHeight : getScrollableRange(statsTarget);
      const nearBottom = scrollRange > 32 && currentY + viewportHeight >= height - 32;
      const outsideEmbeddedScan = statsTarget === window && Number.isFinite(scanBottomY) && currentY >= scanBottomY;
      const didMove = statsTarget !== scrollTarget || Math.abs(currentY - beforeY) > 8;
      const didGrow = height > lastHeight + 8 || imageCount > lastImageCount || commentCount > lastCommentCount;

      stats.scrolls += 1;
      stats.finalY = currentY;
      stats.finalHeight = height;
      stats.finalViewportHeight = viewportHeight;
      stats.lastDeltaY = Math.round(currentY - beforeY);
      stats.lastImageCount = imageCount;
      stats.lastCommentCount = commentCount;
      stats.lastSettleRounds = settled.rounds;
      stats.lastLoadMoreClicks = beforeLoadMore.clicks + afterLoadMore.clicks;
      stats.scrollRange = scrollRange;
      stats.scrollTarget = statsTarget === window ? "window" : getElementSignature(statsTarget);
      stats.scrollTargetScrollable = statsTarget === window || isActuallyScrollable(statsTarget);
      stats.requestedScrollTarget = scrollTarget === statsTarget ? "" : getElementSignature(scrollTarget);
      stats.outsideEmbeddedScan = outsideEmbeddedScan;

      if (!didGrow && !afterLoadMore.clicks && (!didMove || nearBottom)) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      if (nearBottom && !didGrow && !beforeLoadMore.clicks && !afterLoadMore.clicks) {
        bottomRounds += 1;
      } else {
        bottomRounds = 0;
      }
      stats.bottomRounds = bottomRounds;

      lastHeight = height;
      lastImageCount = imageCount;
      lastCommentCount = commentCount;

      if (stats.scrolls >= earlyStopMinScrolls && bottomRounds >= bottomStopRounds) {
        stats.stopReason = "reached_scroll_bottom";
        break;
      }
      if (!scrollUntilBottom && stats.scrolls >= earlyStopMinScrolls && stableRounds >= stableStopRounds) {
        stats.stopReason = "stable_no_growth";
        break;
      }
      if (activeCommentView !== "modal" && outsideEmbeddedScan && !didGrow && !afterLoadMore.clicks) {
        stats.stopReason = "outside_embedded_scan";
        break;
      }
    }

    stats.commentLocatorAfterScroll = locateComments();

    return stats;
  };

  window.masakiClawCollectCommentImages = function masakiClawCollectCommentImages(options = {}) {
    if (!activeContentRoot) {
      activeContentRoot = findTargetContentRoot(options);
    }
    const maxImages = normalizeImageLimit(options.maxImages);
    const roots = findCommentRoots();
    const seen = new Set();
    const images = [];
    const debug = createCollectDebug(roots);

    if (!activeContentRoot) {
      collectZhihuStateCommentImages(seen, images, debug);
    }
    secondaryReplyImages.forEach((image) => {
      if (image.originalUrl && !seen.has(image.originalUrl)) {
        seen.add(image.originalUrl);
        images.push(image);
      }
    });

    roots.forEach((root) => {
      collectImgElements(root, seen, images, debug);
      collectBackgroundImages(root, seen, images, debug);
    });

    debug.collected = images.length;
    debug.commentLocator = locateComments();

    return {
      pageTitle: document.title,
      pageUrl: location.href,
      capturedAt: new Date().toISOString(),
      publishedAt: findPagePublishedAt(),
      scope: activeContentRoot ? "target_answer_comments" : roots.length ? "comments" : "comments_state_or_empty",
      prepareStats: options.prepareStats || null,
      captureDebug: debug,
      images: maxImages === null ? images : images.slice(0, maxImages)
    };
  };

  function normalizeImageLimit(value) {
    if (value === null || value === "" || value === undefined) {
      return null;
    }
    return Math.max(1, Number(value) || 80);
  }

  function findPagePublishedAt() {
    const scopedDate = findScopedPublishedAt(activeContentRoot);
    if (scopedDate) {
      return scopedDate;
    }

    const metaSelectors = [
      "meta[property='article:published_time']",
      "meta[name='pubdate']",
      "meta[name='publishdate']",
      "meta[name='publish_date']",
      "meta[itemprop='datePublished']"
    ];
    for (const selector of metaSelectors) {
      const value = document.querySelector(selector)?.getAttribute("content");
      const normalized = normalizeDateLikeValue(value);
      if (normalized) {
        return normalized;
      }
    }

    const jsonLdDate = findJsonLdPublishedAt();
    if (jsonLdDate) {
      return jsonLdDate;
    }

    const timeDate = Array.from(document.querySelectorAll("time[datetime], [itemprop='datePublished'][content], [datetime]"))
      .map((element) => element.getAttribute("datetime") || element.getAttribute("content"))
      .map(normalizeDateLikeValue)
      .find(Boolean);
    if (timeDate) {
      return timeDate;
    }

    return "";
  }

  function findScopedPublishedAt(scope) {
    if (!scope) {
      return "";
    }

    const metaDate = Array.from(scope.querySelectorAll("meta[itemprop='datePublished'], meta[itemprop='dateCreated'], [itemprop='datePublished'][content], [itemprop='dateCreated'][content]"))
      .map((element) => element.getAttribute("content"))
      .map(normalizeDateLikeValue)
      .find(Boolean);
    if (metaDate) {
      return metaDate;
    }

    const textDate = Array.from(scope.querySelectorAll(".ContentItem-time, [class*='ContentItem-time'], time[datetime], [datetime], a, span"))
      .flatMap((element) => [
        element.getAttribute("datetime"),
        element.getAttribute("content"),
        element.getAttribute("data-tooltip"),
        element.getAttribute("aria-label"),
        element.textContent
      ])
      .map(extractPublishedDateFromText)
      .find(Boolean);
    return textDate || "";
  }

  function extractPublishedDateFromText(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }
    const publishedMatch = text.match(/发布于\s*(\d{4}[/-]\d{1,2}[/-]\d{1,2}(?:\s+\d{1,2}:\d{1,2})?)/);
    if (publishedMatch) {
      return normalizeDateLikeValue(publishedMatch[1]);
    }
    const genericMatch = text.match(/(\d{4}[/-]\d{1,2}[/-]\d{1,2}(?:\s+\d{1,2}:\d{1,2})?)/);
    return genericMatch ? normalizeDateLikeValue(genericMatch[1]) : "";
  }

  function findJsonLdPublishedAt() {
    const scripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "null");
        const date = findPublishedDateInObject(data);
        if (date) {
          return date;
        }
      } catch {
        // Ignore invalid structured data from the host page.
      }
    }
    return "";
  }

  function findPublishedDateInObject(value) {
    if (!value || typeof value !== "object") {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(findPublishedDateInObject).find(Boolean) || "";
    }
    const direct = normalizeDateLikeValue(value.datePublished || value.dateCreated || value.uploadDate);
    if (direct) {
      return direct;
    }
    return Object.values(value).map(findPublishedDateInObject).find(Boolean) || "";
  }

  function normalizeDateLikeValue(value) {
    if (!value) {
      return "";
    }
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
    const match = String(value).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (!match) {
      return "";
    }
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function locateComments() {
    const expectedCount = getExpectedCommentCount();
    const root = findCommentRootContainer();
    const scope = root || document;
    const dataIdItems = getLoadedCommentItems(scope);
    const commentContentNodes = getLoadedCommentContentNodes(scope);
    const selectorCounts = getCommentCandidateSelectors().map((selector) => {
      const elements = Array.from(scope.querySelectorAll(selector)).filter(isVisibleElement);
      return {
        selector,
        count: elements.length,
        samples: elements.slice(0, 3).map((element) => normalizeText(element.innerText).slice(0, 120))
      };
    });
    const best = selectorCounts.slice().sort((a, b) => b.count - a.count)[0] || { selector: "", count: 0 };

    return {
      expectedCount,
      rootSelector: root ? getElementSignature(root) : "",
      rootTextSample: root ? normalizeText(root.innerText).slice(0, 160) : "",
      dataIdCommentItems: dataIdItems.length,
      commentContentNodes: commentContentNodes.length,
      dataIdSamples: dataIdItems.slice(0, 5).map((element) => ({
        id: element.getAttribute("data-id") || "",
        text: normalizeText(element.innerText).slice(0, 120),
        images: element.querySelectorAll("img").length
      })),
      bestSelector: best.selector,
      locatedCount: best.count,
      complete: expectedCount > 0 && best.count >= expectedCount,
      selectorCounts
    };
  }

  function getExpectedCommentCount() {
    const meta = (activeContentRoot || document).querySelector('meta[itemprop="commentCount"]');
    const metaCount = Number(meta?.getAttribute("content"));
    if (Number.isFinite(metaCount) && metaCount > 0) {
      return metaCount;
    }

    const data = parseZhihuInitialData();
    const articleId = getArticleIdFromUrl();
    const articleCount = Number(data?.initialState?.entities?.articles?.[articleId]?.commentCount);
    if (Number.isFinite(articleCount) && articleCount > 0) {
      return articleCount;
    }
    return 0;
  }

  function getArticleIdFromUrl() {
    const match = location.pathname.match(/\/p\/(\d+)/);
    return match?.[1] || "";
  }

  function getAnswerIdFromUrl(value = location.href) {
    try {
      const url = new URL(value, location.href);
      return url.pathname.match(/\/answer\/(\d+)/)?.[1] || "";
    } catch {
      return String(value || "").match(/\/answer\/(\d+)/)?.[1] || "";
    }
  }

  function findTargetContentRoot(options = {}) {
    const answerId = getAnswerIdFromUrl(options.targetUrl || location.href);
    if (!answerId) {
      return null;
    }

    const selectors = [
      `.AnswerItem[name="${cssEscape(answerId)}"]`,
      `.ContentItem[name="${cssEscape(answerId)}"]`,
      `[data-zop*='"itemId":"${answerId}"']`,
      `[data-za-extra-module*='"token":"${answerId}"']`
    ];
    return selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .map((element) => element.closest(".AnswerItem, .ContentItem") || element)
      .filter(isVisibleElement)[0] || null;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return CSS.escape(String(value));
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function findCommentRootContainer() {
    const dialog = findCommentDialog();
    if (dialog) {
      return dialog;
    }

    const selectors = [
      ".Comments-container",
      ".CommentsV2",
      "[class*='Comments-container']",
      "[class*='CommentsContainer']",
      "[class*='CommentsV2']",
      ".CommentList",
      "[class*='CommentList']"
    ];

    return selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter(isVisibleElement)
      .sort((a, b) => normalizeText(b.innerText).length - normalizeText(a.innerText).length)[0] || null;
  }

  function getCommentCandidateSelectors() {
    return [
      "div[data-id]",
      "div[data-id] .CommentContent",
      "div[data-id] [class*='CommentContent']",
      ".CommentItem",
      "[class*='CommentItem']",
      ".CommentList-item",
      "[class*='CommentList-item']",
      "[class*='CommentItemV2']",
      "[class*='Comments-item']",
      "[class*='commentItem']",
      "[class*='comment-item']",
      "[data-testid*='comment']",
      "[itemprop='comment']",
      ".CommentContent",
      "[class*='CommentContent']"
    ];
  }

  function normalizeText(text) {
    return String(text || "").replace(/[\u200B-\u200F\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  }

  function mergeSecondaryReplyStats(current, next) {
    const base = current || { visits: 0, clicks: 0, collected: 0, returned: 0, skipped: 0, scrolls: 0, returnAttempts: 0, returnFailed: 0 };
    return {
      visits: base.visits + next.visits,
      clicks: base.clicks + next.clicks,
      collected: base.collected + next.collected,
      returned: base.returned + next.returned,
      skipped: base.skipped + next.skipped,
      scrolls: base.scrolls + (next.scrolls || 0),
      returnAttempts: base.returnAttempts + (next.returnAttempts || 0),
      returnFailed: base.returnFailed + (next.returnFailed || 0),
      lastScrollTarget: next.lastScrollTarget || base.lastScrollTarget || "",
      lastScrollRange: next.lastScrollRange ?? base.lastScrollRange ?? 0,
      lastFinalY: next.lastFinalY ?? base.lastFinalY ?? 0
    };
  }

  function getLoadedCommentItems(scope = document) {
    return Array.from(scope.querySelectorAll("div[data-id]"))
      .filter(isVisibleElement)
      .filter((element) => element.querySelector(".CommentContent, [class*='CommentContent']"));
  }

  function getLoadedCommentContentNodes(scope = document) {
    const fromDataId = getLoadedCommentItems(scope).flatMap((item) =>
      Array.from(item.querySelectorAll(".CommentContent, [class*='CommentContent']"))
    );
    if (fromDataId.length) {
      return uniqueElements(fromDataId).filter(isVisibleElement);
    }

    return Array.from(scope.querySelectorAll(".CommentContent, [class*='CommentContent']")).filter(isVisibleElement);
  }

  function scrollToCommentTop(commentAnchor) {
    const top = Math.max(0, window.scrollY + commentAnchor.getBoundingClientRect().top - 16);
    window.scrollTo({ top, behavior: "auto" });
  }

  function getWindowScanBottom(commentAnchor) {
    if (!commentAnchor || findCommentDialog()) {
      return Infinity;
    }
    const root = findCommentRootContainer() || commentAnchor;
    const rect = root.getBoundingClientRect();
    const bottom = window.scrollY + rect.bottom + Math.max(240, window.innerHeight * 0.5);
    const maxScrollTop = Math.max(0, getScrollHeight() - window.innerHeight);
    return Math.min(maxScrollTop, Math.max(window.scrollY, bottom));
  }

  async function waitForLazyContentSettled(scrollTarget, delayMs) {
    let lastHeight = getScrollTargetHeight(scrollTarget);
    let lastImageCount = countPotentialCommentImages();
    let stableRounds = 0;
    let rounds = 0;

    while (rounds < 3 && stableRounds < 2) {
      await wait(delayMs);
      rounds += 1;

      const height = getScrollTargetHeight(scrollTarget);
      const imageCount = countPotentialCommentImages();
      if (height === lastHeight && imageCount === lastImageCount) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      lastHeight = height;
      lastImageCount = imageCount;
    }

    return { rounds };
  }

  function getScrollHeight() {
    return Math.max(
      document.scrollingElement?.scrollHeight || 0,
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0
    );
  }

  function getBestScrollTarget() {
    const dialog = findCommentDialog();
    const dialogCandidates = dialog ? getDialogScrollCandidates(dialog) : [];
    const scrollableDialogCandidate = dialogCandidates.find(isActuallyScrollable);
    if (scrollableDialogCandidate) {
      return scrollableDialogCandidate;
    }
    if (dialogCandidates.length) {
      return dialogCandidates[0];
    }

    const scope = dialog || document;
    const candidates = uniqueElements([
      ...(dialog ? [dialog] : []),
      ...Array.from(scope.querySelectorAll("[role='dialog'], .Modal, [class*='Modal'], .CommentList, [class*='CommentList'], [class*='Comment'], [class*='Scroller'], [class*='scroll']"))
    ])
      .filter(isVisibleElement)
      .filter((element) => !dialog || isInsideDialogScope(dialog, element));

    const actuallyScrollable = candidates
      .filter(isActuallyScrollable)
      .map((element) => ({ element, score: scoreScrollTarget(element) + 100 }))
      .sort((a, b) => b.score - a.score);
    if (actuallyScrollable.length) {
      return actuallyScrollable[0].element;
    }

    if (dialog) {
      return window;
    }

    const scrollables = candidates
      .map((element) => ({ element, score: scoreScrollTarget(element) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scrollables[0]?.element || window;
  }

  function normalizeScrollTarget(target) {
    if (target === window || target instanceof Element) {
      return target;
    }
    return window;
  }

  function getDialogScrollCandidates(dialog) {
    if (!dialog) {
      return [];
    }

    return uniqueElements([
      ...Array.from(dialog.querySelectorAll(".Comments-container, [class*='Comments-container'], [class*='CommentsContainer'], [class*='CommentList'], [class*='Modal-content'], [class*='Scroller'], [class*='scroll']")),
      ...Array.from(dialog.querySelectorAll("*")).filter((element) => getScrollableRange(element) > 8),
      dialog
    ])
      .filter(isVisibleElement)
      .filter((element) => isInsideDialogScope(dialog, element))
      .map((element) => ({ element, score: scoreDialogScrollCandidate(element) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.element);
  }

  function scoreDialogScrollCandidate(element) {
    const className = String(element.className || "");
    const text = `${className} ${element.getAttribute("role") || ""} ${element.getAttribute("aria-label") || ""}`;
    const range = getScrollableRange(element);
    const canScroll = range > 8 ? 120 : 0;
    const commentsContainer = /Comments-container|CommentsContainer/i.test(className) ? 90 : 0;
    const commentList = /CommentList/i.test(className) ? 70 : 0;
    const modalContent = /Modal-content|modal/i.test(text) ? 50 : 0;
    const hasComments = element.querySelector("div[data-id] .CommentContent, div[data-id] [class*='CommentContent']") ? 40 : 0;
    const visibleSize = element.clientHeight > 0 ? 10 : -100;
    return canScroll + commentsContainer + commentList + modalContent + hasComments + visibleSize;
  }

  function scoreScrollTarget(element) {
    const style = getComputedStyle(element);
    const canScroll = element.scrollHeight > element.clientHeight + 20;
    const overflowScroll = /(auto|scroll)/i.test(`${style.overflow} ${style.overflowY}`);
    const text = `${element.className || ""} ${element.getAttribute("role") || ""} ${element.innerText || ""}`;
    const commentScore = /comment|评论/i.test(text) ? 50 : 0;
    const dialogScore = /dialog|modal/i.test(text) ? 20 : 0;
    const imageScore = element.querySelector("img, source, [style*='background-image']") ? 20 : 0;
    const sizePenalty = element.scrollHeight === 0 || element.clientHeight === 0 ? -100 : 0;
    return (canScroll || overflowScroll ? 40 : 0) + commentScore + dialogScore + imageScore + sizePenalty;
  }

  function findScrollableRelative(element) {
    const relatives = uniqueElements([
      ...getVisibleAncestors(element),
      element,
      ...Array.from(element.querySelectorAll("*"))
    ]).filter(isVisibleElement);

    return relatives
      .filter(isActuallyScrollable)
      .map((candidate) => ({ element: candidate, score: scoreScrollTarget(candidate) }))
      .sort((a, b) => b.score - a.score)[0]?.element || null;
  }

  function getVisibleAncestors(element) {
    const ancestors = [];
    let current = element.parentElement;
    for (let depth = 0; current && depth < 8; depth += 1) {
      if (isVisibleElement(current)) {
        ancestors.push(current);
      }
      current = current.parentElement;
    }
    return ancestors;
  }

  function isActuallyScrollable(element) {
    if (!element || element === window) {
      return false;
    }
    return element.clientHeight > 0 && getScrollableRange(element) >= MIN_SCROLL_RANGE;
  }

  function getScrollableRange(element) {
    return Math.max(0, element.scrollHeight - element.clientHeight);
  }

  function getScrollTargetHeight(target) {
    return target === window ? getScrollHeight() : target.scrollHeight;
  }

  function getScrollTargetTop(target) {
    return target === window ? window.scrollY : target.scrollTop;
  }

  function getScrollTargetViewportHeight(target) {
    return target === window ? window.innerHeight : target.clientHeight;
  }

  function scrollElementBy(target, top, options = {}) {
    if (target === window) {
      if (options.restrictToDialog && findCommentDialog()) {
        return target;
      }
      window.scrollBy({ top, behavior: "auto" });
      dispatchWheel(document.scrollingElement || document.documentElement, top);
      return window;
    }
    const before = target.scrollTop;
    target.scrollTop += top;
    target.dispatchEvent(new Event("scroll", { bubbles: true }));
    dispatchWheel(target, top);
    if (Math.abs(target.scrollTop - before) > 2) {
      return target;
    }

    const dialog = findCommentDialog();
    const dialogFallback = scrollDialogFallbacks(dialog, target, top);
    if (dialogFallback) {
      return dialogFallback;
    }
    if (options.restrictToDialog && dialog) {
      return target;
    }
    const fallback = findScrollableRelative(target);
    if (fallback && fallback !== target) {
      const fallbackBefore = fallback.scrollTop;
      fallback.scrollTop += top;
      fallback.dispatchEvent(new Event("scroll", { bubbles: true }));
      dispatchWheel(fallback, top);
      if (Math.abs(fallback.scrollTop - fallbackBefore) > 2) {
        return fallback;
      }
    }
    return target;
  }

  function scrollDialogFallbacks(dialog, originalTarget, top) {
    const candidates = getDialogScrollCandidates(dialog)
      .filter((candidate) => candidate !== originalTarget)
      .filter((candidate) => isInsideDialogScope(dialog, candidate));
    for (const candidate of candidates) {
      const before = candidate.scrollTop;
      candidate.scrollTop += top;
      candidate.dispatchEvent(new Event("scroll", { bubbles: true }));
      dispatchWheel(candidate, top);
      if (Math.abs(candidate.scrollTop - before) > 2) {
        return candidate;
      }
    }
    return null;
  }

  function isInsideDialogScope(dialog, element) {
    if (!dialog || !element) {
      return false;
    }
    if (element === document.body || element === document.documentElement || element === document.scrollingElement) {
      return false;
    }
    return element === dialog || dialog.contains(element);
  }

  function dispatchWheel(target, deltaY) {
    target.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY,
        deltaMode: 0
      })
    );
  }

  function getElementSignature(element) {
    return [element.tagName?.toLowerCase(), element.id ? `#${element.id}` : "", element.className ? `.${String(element.className).trim().split(/\s+/).slice(0, 3).join(".")}` : ""]
      .filter(Boolean)
      .join("");
  }

  function findCommentAnchor() {
    const dialog = findCommentDialog();
    if (dialog) {
      return dialog;
    }

    const root = findCommentRootContainer();
    if (root) {
      return root;
    }

    const scope = activeContentRoot || document;
    const roots = uniqueElements(COMMENT_SELECTORS.flatMap((selector) => Array.from(scope.querySelectorAll(selector))));
    if (roots.length) {
      return roots[0];
    }

    const candidates = Array.from(scope.querySelectorAll("button, a, div, span, [role='button'], [class*='Comment']"));
    return candidates.find((element) => /评论|comment/i.test(element.innerText || element.getAttribute("aria-label") || ""));
  }

  async function clickCommentOpeners() {
    const clicked = [];
    let lastCandidates = [];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const candidates = findCommentOpenerCandidates().filter((candidate) => !clicked.includes(candidate.signature));
      lastCandidates = candidates;
      for (const item of candidates) {
        const clickable = getClickableTarget(item.element);
        if (clickable.closest?.("a[href]")) {
          continue;
        }
        clickable.click();
        clicked.push(item.signature);
        await wait(900);
        if (findCommentDialog()) {
          return {
            clicks: clicked.length,
            clicked: item.signature,
            candidates: candidates.slice(0, 5).map((candidate) => candidate.signature)
          };
        }
        break;
      }
    }

    return {
      clicks: clicked.length,
      clicked: clicked[clicked.length - 1] || "",
      candidates: lastCandidates.slice(0, 5).map((candidate) => candidate.signature)
    };
  }

  function findCommentOpenerCandidates() {
    const scope = activeContentRoot || document;
    return uniqueElements(Array.from(scope.querySelectorAll("button, div, span, [role='button'], .BottomActions-CommentBtn, [class*='CommentBtn']")))
      .filter(isVisibleElement)
      .filter(isAllowedCommentOpenerScope)
      .map((element) => {
        const labelText = normalizeText(`${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`);
        return {
          element,
          labelText,
          score: scoreCommentOpenerLabel(element, labelText),
          signature: `${getElementSignature(element)}:${labelText.slice(0, 80)}`
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function isAllowedCommentOpenerScope(element) {
    if (element.closest(".QuestionHeader, .QuestionHeader-Comment, [class*='QuestionHeader']")) {
      return false;
    }
    if (!activeContentRoot) {
      return true;
    }
    if (!activeContentRoot.contains(element)) {
      return false;
    }
    const owner = element.closest(".AnswerItem, .ContentItem");
    return !owner || owner === activeContentRoot || activeContentRoot.contains(owner);
  }

  async function clickLoadMoreButtons() {
    const commentPatterns = [
      /加载更多/,
      /查看更多/,
      /展开更多/,
      /显示更多/,
      /更多评论/,
      /下一页/,
      /Load more/i,
      /Show more/i
    ];
    return clickMatchingElements(commentPatterns, 12, { markOnce: false, loadMoreOnly: true });
  }

  async function processSecondaryReplyButtons(delayMs) {
    const stats = { visits: 0, clicks: 0, collected: 0, returned: 0, skipped: 0, scrolls: 0, returnAttempts: 0, returnFailed: 0 };
    const candidates = findSecondaryReplyButtons().filter((item) => !processedSecondaryReplyButtons.has(item.signature));

    for (const item of candidates.slice(0, 2)) {
      processedSecondaryReplyButtons.add(item.signature);
      const clickable = getClickableTarget(item.element);
      if (hasNavigatingHref(clickable)) {
        stats.skipped += 1;
        continue;
      }

      clickable.click();
      stats.clicks += 1;
      await wait(Math.max(500, delayMs * 2));
      if (!isSecondaryReplyView()) {
        stats.skipped += 1;
        continue;
      }

      stats.visits += 1;
      const scrollStats = await scrollSecondaryReplyView(delayMs);
      stats.scrolls += scrollStats.scrolls;
      stats.lastScrollTarget = scrollStats.target;
      stats.lastScrollRange = scrollStats.scrollRange;
      stats.lastFinalY = scrollStats.finalY;
      const beforeCount = secondaryReplyImages.length;
      collectSecondaryReplyImages();
      stats.collected += secondaryReplyImages.length - beforeCount;

      const returnStats = await ensureSecondaryReplyReturned(delayMs);
      stats.returnAttempts += returnStats.returnAttempts;
      if (returnStats.returned) {
        stats.returned += 1;
      } else {
        stats.returnFailed += 1;
        break;
      }
    }

    return stats;
  }

  function findSecondaryReplyButtons() {
    return Array.from(document.querySelectorAll("button, [role='button']"))
      .filter(isVisibleElement)
      .map((element) => {
        const text = normalizeText(`${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`);
        return {
          element,
          text,
          score: scoreSecondaryReplyButton(text),
          signature: `${getClosestCommentId(element)}:${text}`
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  function scoreSecondaryReplyButton(text) {
    if (/查看全部\s*\d+\s*条回复/.test(text)) {
      return 100;
    }
    if (/展开其他\s*\d+\s*条回复/.test(text)) {
      return 80;
    }
    return 0;
  }

  function getClosestCommentId(element) {
    return element.closest?.("div[data-id]")?.getAttribute("data-id") || "";
  }

  function isSecondaryReplyView() {
    return Boolean(findSecondaryReplyRoot());
  }

  async function scrollSecondaryReplyView(delayMs) {
    const root = findSecondaryReplyRoot();
    const target = findSecondaryReplyScrollTarget(root);
    if (!root || !target) {
      return { scrolls: 0, target: "", finalY: 0, scrollRange: 0 };
    }

    let stableRounds = 0;
    let scrolls = 0;
    let lastHeight = target.scrollHeight;
    let lastImageCount = countSecondaryReplyPotentialImages(root);
    const step = Math.max(680, window.innerHeight);

    for (let index = 0; index < 10; index += 1) {
      const before = target.scrollTop;
      scrollSecondaryElementBy(target, root, step);
      await wait(delayMs);
      scrolls += 1;

      const after = target.scrollTop;
      const height = target.scrollHeight;
      const imageCount = countSecondaryReplyPotentialImages(root);
      const scrollRange = getScrollableRange(target);
      const nearBottom = scrollRange > 8 && after + target.clientHeight >= height - 32;
      const didMove = Math.abs(after - before) > 8;
      const didGrow = height > lastHeight + 8 || imageCount > lastImageCount;

      if (!didMove && !didGrow) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }
      if ((nearBottom && !didGrow) || stableRounds >= 2) {
        break;
      }

      lastHeight = height;
      lastImageCount = imageCount;
    }

    return {
      scrolls,
      target: getElementSignature(target),
      finalY: target.scrollTop,
      scrollRange: getScrollableRange(target)
    };
  }

  function collectSecondaryReplyImages() {
    const scope = findSecondaryReplyRoot() || document;
    const roots = getLoadedCommentContentNodes(scope).filter((root) => root.querySelector("img, source, [style*='background-image']"));
    const seen = new Set(secondaryReplyImages.map((image) => image.originalUrl).filter(Boolean));
    const images = [];
    const debug = createCollectDebug(roots);

    roots.forEach((root) => {
      collectImgElements(root, seen, images, debug);
      collectBackgroundImages(root, seen, images, debug);
    });

    images.forEach((image) => {
      secondaryReplyImages.push({
        ...image,
        source: "secondary_reply"
      });
    });
  }

  async function ensureSecondaryReplyReturned(delayMs) {
    const stats = { visits: 0, clicks: 0, collected: 0, returned: 0, skipped: 0, scrolls: 0, returnAttempts: 0, returnFailed: 0 };
    if (!isSecondaryReplyView()) {
      stats.returned = 1;
      return stats;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      revealSecondaryReplyReturnArea();
      const candidates = findSecondaryReplyReturnCandidates();
      if (!candidates.length) {
        await wait(Math.max(250, delayMs));
        break;
      }

      for (const element of candidates.slice(0, 4)) {
        if (hasNavigatingHref(element)) {
          continue;
        }
        clickElementLikeUser(element);
        stats.returnAttempts += 1;
        await wait(Math.max(350, delayMs));
        if (!isSecondaryReplyView()) {
          activeSecondaryReplyRoot = null;
          stats.returned = 1;
          return stats;
        }
      }
    }

    stats.returnFailed = 1;
    return stats;
  }

  function findSecondaryReplyReturnButton() {
    return findSecondaryReplyReturnCandidates({ requireVisible: false })[0] || null;
  }

  function findSecondaryReplyReturnCandidates(options = {}) {
    const requireVisible = options.requireVisible !== false;
    const textMatches = Array.from(document.querySelectorAll("button, div, span, [role='button']"))
      .filter((element) => !requireVisible || isVisibleElement(element))
      .filter((element) => normalizeText(element.innerText || element.getAttribute("aria-label") || element.title || "") === "评论回复");
    const arrowMatches = Array.from(document.querySelectorAll(".ZDI--ArrowLeftSmall24, svg[class*='ArrowLeft']"))
      .filter((element) => !requireVisible || isVisibleElement(element))
      .map((element) => findCompactTextAncestor(element, "评论回复"))
      .filter(Boolean);
    const exact = uniqueElements([...textMatches, ...arrowMatches]);

    const candidates = [];
    exact.forEach((element) => {
      candidates.push(getClickableTarget(element));
      let current = element;
      for (let depth = 0; current && depth < 5; depth += 1) {
        if (current === document.body || current === document.documentElement) {
          break;
        }
        const text = normalizeText(current.innerText || current.getAttribute?.("aria-label") || current.title || "");
        if (text === "评论回复" || (text.includes("评论回复") && text.length <= 40)) {
          candidates.push(current);
        }
        current = current.parentElement;
      }
    });

    return uniqueElements(candidates).filter((element) => !requireVisible || isVisibleElement(element));
  }

  function findCompactTextAncestor(element, expectedText) {
    let current = element;
    for (let depth = 0; current && depth < 6; depth += 1) {
      if (current === document.body || current === document.documentElement) {
        return null;
      }
      const text = normalizeText(current.innerText || current.getAttribute?.("aria-label") || current.title || "");
      if (text === expectedText || (text.includes(expectedText) && text.length <= 40)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function clickElementLikeUser(element) {
    const rect = element.getBoundingClientRect();
    const clientX = Math.max(1, rect.left + Math.min(rect.width / 2, 24));
    const clientY = Math.max(1, rect.top + rect.height / 2);
    const PointerCtor = window.PointerEvent || MouseEvent;
    ["pointerdown", "pointerup"].forEach((type) => {
      element.dispatchEvent(new PointerCtor(type, { bubbles: true, cancelable: true, view: window, pointerId: 1, pointerType: "mouse", clientX, clientY }));
    });
    ["mousedown", "mouseup", "click"].forEach((type) => {
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX, clientY }));
    });
    element.click?.();
  }

  function findSecondaryReplyRoot() {
    if (activeSecondaryReplyRoot?.isConnected && looksLikeSecondaryReplyRoot(activeSecondaryReplyRoot)) {
      return activeSecondaryReplyRoot;
    }

    const returnButton = findSecondaryReplyReturnButton();
    if (!returnButton) {
      return null;
    }

    let current = returnButton.parentElement;
    for (let depth = 0; current && depth < 14; depth += 1) {
      if (current === document.body || current === document.documentElement) {
        break;
      }
      if (looksLikeSecondaryReplyRoot(current)) {
        activeSecondaryReplyRoot = current;
        return current;
      }
      current = current.parentElement;
    }

    return returnButton.parentElement || null;
  }

  function looksLikeSecondaryReplyRoot(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    const text = normalizeText(element.innerText);
    const hasReturn = text.includes("评论回复") || element.querySelector(".ZDI--ArrowLeftSmall24, svg[class*='ArrowLeft']");
    const hasReplyHeader = /\d+\s*条回复/.test(text);
    const hasCommentContent = element.querySelector("div[data-id] .CommentContent, div[data-id] [class*='CommentContent']");
    return Boolean(hasReturn && hasReplyHeader && hasCommentContent);
  }

  function findSecondaryReplyScrollTarget(root) {
    if (!root) {
      return null;
    }

    const descendants = Array.from(root.querySelectorAll("*"));
    const ancestors = getVisibleAncestors(root).filter((element) => element !== document.body && element !== document.documentElement);
    const candidates = uniqueElements([root, ...descendants, ...ancestors])
      .filter(isVisibleElement)
      .map((element) => ({ element, score: scoreSecondaryReplyScrollTarget(element, root) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.element || root;
  }

  function scoreSecondaryReplyScrollTarget(element, root) {
    if (!element || element === document.body || element === document.documentElement) {
      return 0;
    }
    if (element !== root && !element.contains(root) && !root.contains(element)) {
      return 0;
    }

    const className = String(element.className || "");
    const role = element.getAttribute("role") || "";
    const label = element.getAttribute("aria-label") || "";
    const text = `${className} ${role} ${label} ${normalizeText(element.innerText).slice(0, 300)}`;
    const range = getScrollableRange(element);
    const canScroll = range > 8 ? 140 : 0;
    const replyHeader = /\d+\s*条回复/.test(text) ? 60 : 0;
    const replyItems = Math.min(80, element.querySelectorAll("div[data-id] .CommentContent, div[data-id] [class*='CommentContent']").length * 8);
    const modalScore = /modal|dialog|content/i.test(text) ? 30 : 0;
    const commentScore = /comment|评论|reply|回复/i.test(text) ? 30 : 0;
    const rootScore = element === root ? 20 : 0;
    const contentChildScore = element.parentElement === root && replyItems > 0 ? 100 : 0;
    const returnHeaderPenalty = element.querySelector(".ZDI--ArrowLeftSmall24, svg[class*='ArrowLeft']") ? -90 : 0;
    const sizePenalty = element.clientHeight <= 0 ? -100 : 0;

    return canScroll + replyHeader + replyItems + modalScore + commentScore + rootScore + contentChildScore + returnHeaderPenalty + sizePenalty;
  }

  function revealSecondaryReplyReturnArea() {
    const root = findSecondaryReplyRoot();
    if (!root) {
      return;
    }
    const target = findSecondaryReplyScrollTarget(root) || root;
    [target, root].forEach((element) => {
      if (!element || element === document.body || element === document.documentElement) {
        return;
      }
      element.scrollTop = 0;
      element.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
  }

  function scrollSecondaryElementBy(target, root, top) {
    const before = target.scrollTop;
    target.scrollTop += top;
    target.dispatchEvent(new Event("scroll", { bubbles: true }));
    dispatchWheel(target, top);
    if (root && root !== target) {
      dispatchWheel(root, top);
    }
    return Math.abs(target.scrollTop - before) > 2;
  }

  function countSecondaryReplyPotentialImages(root) {
    if (!root) {
      return 0;
    }
    return Array.from(root.querySelectorAll("img, source, [style*='background-image']"))
      .filter((element) => !shouldSkipElement(element))
      .length;
  }

  async function clickMatchingElements(patterns, limit, options = {}) {
    const markOnce = options.markOnce !== false;
    const openerOnly = options.openerOnly === true;
    const loadMoreOnly = options.loadMoreOnly === true;
    let clicks = 0;
    const selector = openerOnly
      ? "button, div, span, [role='button'], .BottomActions-CommentBtn, [class*='CommentBtn']"
      : loadMoreOnly
        ? "button, [role='button']"
        : "button, a, div, span, [role='button']";
    const elements = Array.from(document.querySelectorAll(selector)).sort((a, b) => {
      if (openerOnly) return scoreCommentOpenerCandidate(b) - scoreCommentOpenerCandidate(a);
      if (loadMoreOnly) return scoreLoadMoreCandidate(b) - scoreLoadMoreCandidate(a);
      return scoreCommentOpenerCandidate(b) - scoreCommentOpenerCandidate(a);
    });

    for (const element of elements) {
      if (clicks >= limit) break;
      if (!isVisibleElement(element) || element.disabled || (markOnce && element.dataset.masakiClawClicked === "true")) {
        continue;
      }

      const labelText = `${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`.trim();
      const text = `${labelText} ${element.className || ""}`.trim();
      const isKnownCommentButton = /\bBottomActions-CommentBtn\b|CommentBtn/i.test(String(element.className || ""));
      const matchesText = patterns.some((pattern) => pattern.test(labelText));
      if (loadMoreOnly && isReplyExpansionText(text)) {
        continue;
      }
      if (openerOnly && !matchesText) {
        continue;
      }
      if (loadMoreOnly && isKnownCommentButton) {
        continue;
      }
      if (!openerOnly && (!text || !patterns.some((pattern) => pattern.test(text)))) {
        continue;
      }

      const clickable = getClickableTarget(element);
      if (hasNavigatingHref(clickable)) {
        continue;
      }
      if (markOnce && clickable.dataset.masakiClawClicked === "true") {
        continue;
      }
      if (markOnce) {
        clickable.dataset.masakiClawClicked = "true";
      }
      clickable.click();
      clicks += 1;
    }

    return { clicks };
  }

  function getClickableTarget(element) {
    return element.closest("button, a, [role='button']") || element;
  }

  function hasNavigatingHref(element) {
    const anchor = element.closest?.("a[href]");
    if (!anchor) {
      return false;
    }
    const href = anchor.getAttribute("href") || "";
    return Boolean(href && !href.startsWith("#") && !href.startsWith("javascript:"));
  }

  function scoreCommentOpenerCandidate(element) {
    const text = `${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`.trim();
    return scoreCommentOpenerLabel(element, text);
  }

  function scoreCommentOpenerLabel(element, text) {
    const className = String(element.className || "");
    const normalized = normalizeText(text);
    if (normalized.length > 140) {
      return 0;
    }
    const hasCommentText = /点击查看全部评论|查看全部评论|\d+\s*条评论|\d+\s*评论|View.*comment|Show.*comment/i.test(normalized);
    const knownCommentButton = hasCommentText && /\bBottomActions-CommentBtn\b|CommentBtn/i.test(className) ? 100 : 0;
    const exactAllComments = /点击查看全部评论|查看全部评论/.test(normalized) ? 80 : 0;
    const countText = /\d+\s*条评论|\d+\s*评论/.test(normalized) ? 40 : 0;
    const nativeControl = /^(BUTTON|A)$/.test(element.tagName || "") || element.getAttribute("role") === "button" ? 20 : 0;
    return knownCommentButton + exactAllComments + countText + nativeControl;
  }

  function scoreLoadMoreCandidate(element) {
    const text = `${element.innerText || ""} ${element.getAttribute("aria-label") || ""} ${element.title || ""}`.trim();
    const moreComments = /加载更多|查看更多|显示更多|更多评论/.test(text) ? 40 : 0;
    const nativeControl = /^(BUTTON|A)$/.test(element.tagName || "") || element.getAttribute("role") === "button" ? 20 : 0;
    return moreComments + nativeControl;
  }

  function isReplyExpansionText(text) {
    return /回复|展开其他\s*\d+\s*条回复|展开.*其他.*回复|其他\s*\d+\s*条回复/i.test(String(text || ""));
  }

  async function waitForCommentDialog(timeoutMs) {
    const startedAt = Date.now();
    let dialog = findCommentDialog();
    while (!dialog && Date.now() - startedAt < timeoutMs) {
      await wait(250);
      dialog = findCommentDialog();
    }
    return dialog;
  }

  function findCommentDialog() {
    if (activeCommentView === "embedded") {
      return null;
    }
    const candidates = uniqueElements(COMMENT_DIALOG_SELECTORS.flatMap((selector) => Array.from(document.querySelectorAll(selector)))).filter(isVisibleElement);
    return candidates
      .map((element) => ({ element, score: scoreCommentDialog(element) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.element || null;
  }

  function scoreCommentDialog(element) {
    const text = `${element.className || ""} ${element.getAttribute("role") || ""} ${element.getAttribute("aria-label") || ""} ${element.innerText || ""}`;
    const isDialogShell = element.getAttribute("role") === "dialog" || /(^|\s)Modal(\s|$)|Modal-content|modal/i.test(String(element.className || ""));
    if (!isDialogShell) {
      return 0;
    }
    const hasCommentSignal = /comment|评论/i.test(text) || element.querySelector("div[data-id] .CommentContent, div[data-id] [class*='CommentContent'], .Comments-container, [class*='Comments-container']");
    if (!hasCommentSignal) {
      return 0;
    }
    const commentScore = /comment|评论/i.test(text) ? 60 : 0;
    const dialogScore = element.getAttribute("role") === "dialog" || /modal/i.test(String(element.className || "")) ? 30 : 0;
    const listScore = /CommentList/i.test(String(element.className || "")) ? 40 : 0;
    const hasCommentImage = element.querySelector("img, source, [style*='background-image']") ? 10 : 0;
    const scrollScore = element.scrollHeight > element.clientHeight + 20 ? 10 : 0;
    return commentScore + dialogScore + listScore + hasCommentImage + scrollScore;
  }

  function isVisibleElement(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function countPotentialCommentImages() {
    return findCommentRoots().reduce((count, root) => count + root.querySelectorAll("img, source, [style*='background-image']").length, 0);
  }

  function countLoadedCommentContents() {
    const dialog = findCommentDialog();
    const root = dialog || findCommentRootContainer() || document;
    return getLoadedCommentContentNodes(root).length;
  }

  function findCommentRoots() {
    const dialog = findCommentDialog();
    const scope = dialog || activeContentRoot || document;
    const commentContentRoots = getLoadedCommentContentNodes(scope).filter((root) => root.querySelector("img, source, [style*='background-image']"));
    if (commentContentRoots.length) {
      return commentContentRoots;
    }

    const roots = uniqueElements(COMMENT_SELECTORS.flatMap((selector) => Array.from(scope.querySelectorAll(selector))));
    if (dialog && dialog.querySelector("img, source, [style*='background-image']")) {
      roots.unshift(dialog);
    }
    const usefulRoots = roots.filter((root) => root.querySelector("img, source, [style*='background-image']"));
    if (usefulRoots.length) {
      return usefulRoots;
    }
    return [];
  }

  function createCollectDebug(roots) {
    return {
      roots: roots.length,
      potentialNodes: roots.reduce((count, root) => count + root.querySelectorAll("img, source, [style*='background-image']").length, 0),
      stateCandidates: 0,
      domImgNodes: 0,
      backgroundNodes: 0,
      skippedByElement: 0,
      skippedNoUrl: 0,
      skippedDuplicate: 0,
      skippedUnhelpfulUrl: 0,
      skippedSmallIcon: 0,
      collected: 0,
      samples: []
    };
  }

  function addDebugSample(debug, reason, value) {
    if (debug.samples.length >= 20) {
      return;
    }
    debug.samples.push({ reason, value: String(value || "").slice(0, 220) });
  }

  function collectZhihuStateCommentImages(seen, images, debug) {
    const data = parseZhihuInitialData();
    if (!data) {
      return;
    }

    walkState(data, [], (value, path) => {
      if (!value || typeof value !== "object" || !isCommentStateObject(value, path)) {
        return;
      }

      const urls = [];
      if (value.imageUrl) {
        urls.push({ url: value.imageUrl, source: "comment.imageUrl" });
      }
      if (value.content) {
        urls.push(...extractImageUrlsFromHtml(value.content).map((url) => ({ url, source: "comment.content" })));
      }

      urls.forEach((item) => {
        debug.stateCandidates += 1;
        const candidates = buildDownloadCandidates(item.url, 120);
        const best = candidates[0];
        if (!best?.downloadUrl || seen.has(best.downloadUrl) || looksLikeUnhelpfulUrl(best.downloadUrl)) {
          if (!best?.downloadUrl) debug.skippedNoUrl += 1;
          else if (seen.has(best.downloadUrl)) debug.skippedDuplicate += 1;
          else debug.skippedUnhelpfulUrl += 1;
          addDebugSample(debug, "state-skip", item.url);
          return;
        }
        seen.add(best.downloadUrl);
        images.push(buildStateImageRecord(best.downloadUrl, best.pageImageUrl, candidates, value, item.source));
      });
    });
  }

  function parseZhihuInitialData() {
    const script = document.querySelector("#js-initialData[type='text/json'], #js-initialData");
    if (!script?.textContent) {
      return null;
    }
    try {
      return JSON.parse(script.textContent);
    } catch {
      return null;
    }
  }

  function walkState(value, path, visitor) {
    visitor(value, path);
    if (!value || typeof value !== "object") {
      return;
    }
    Object.entries(value).forEach(([key, child]) => walkState(child, path.concat(key), visitor));
  }

  function isCommentStateObject(value, path) {
    const pathText = path.join(".");
    return value.type === "comment" || /\.comments(V2)?\./i.test(pathText) || /\.comments(V2)?$/i.test(pathText);
  }

  function extractImageUrlsFromHtml(html) {
    try {
      const doc = new DOMParser().parseFromString(String(html), "text/html");
      return Array.from(doc.querySelectorAll("img"))
        .map((img) => img.getAttribute("src"))
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function collectImgElements(root, seen, images, debug) {
    root.querySelectorAll("img, source").forEach((element) => {
      debug.domImgNodes += 1;
      if (shouldSkipElement(element)) {
        debug.skippedByElement += 1;
        addDebugSample(debug, "element", element.outerHTML);
        return;
      }

      const candidates = getPreferredImageCandidates(element);
      if (!candidates.length) {
        debug.skippedNoUrl += 1;
        addDebugSample(debug, "no-url", element.outerHTML);
      }
      candidates.forEach((candidate) => {
        if (!candidate.downloadUrl || seen.has(candidate.downloadUrl)) {
          if (!candidate.downloadUrl) debug.skippedNoUrl += 1;
          else debug.skippedDuplicate += 1;
          return;
        }

        if (looksLikeUnhelpfulUrl(candidate.downloadUrl) || isStickerLikeUrl(candidate.downloadUrl) || looksLikeSmallIcon(element)) {
          if (looksLikeUnhelpfulUrl(candidate.downloadUrl) || isStickerLikeUrl(candidate.downloadUrl)) debug.skippedUnhelpfulUrl += 1;
          else debug.skippedSmallIcon += 1;
          addDebugSample(debug, "filtered", candidate.downloadUrl);
          return;
        }

        seen.add(candidate.downloadUrl);
        images.push(buildImageRecord(candidate.downloadUrl, element, candidate.pageImageUrl, candidate.fallbackUrls));
      });
    });
  }

  function collectBackgroundImages(root, seen, images, debug) {
    root.querySelectorAll("*").forEach((element) => {
      debug.backgroundNodes += 1;
      if (shouldSkipElement(element) || isStickerLikeElement(element) || looksLikeSmallIcon(element)) {
        if (shouldSkipElement(element)) debug.skippedByElement += 1;
        else if (isStickerLikeElement(element)) debug.skippedUnhelpfulUrl += 1;
        else debug.skippedSmallIcon += 1;
        return;
      }

      const style = getComputedStyle(element);
      const candidates = parseCssImageUrls(style.backgroundImage).flatMap((url) => buildDownloadCandidates(url));
      candidates.forEach((candidate) => {
        if (!candidate.downloadUrl || seen.has(candidate.downloadUrl) || looksLikeUnhelpfulUrl(candidate.downloadUrl) || isStickerLikeUrl(candidate.downloadUrl)) {
          if (!candidate.downloadUrl) debug.skippedNoUrl += 1;
          else if (seen.has(candidate.downloadUrl)) debug.skippedDuplicate += 1;
          else debug.skippedUnhelpfulUrl += 1;
          return;
        }

        seen.add(candidate.downloadUrl);
        images.push(buildImageRecord(candidate.downloadUrl, element, candidate.pageImageUrl, candidate.fallbackUrls));
      });
    });
  }

  function getPreferredImageCandidates(element) {
    const urls = [];
    const linkedImage = getClosestLinkedImage(element);
    if (linkedImage) urls.push({ value: linkedImage, priority: 100 });

    LAZY_ATTRS.forEach((attr) => {
      const value = element.getAttribute(attr);
      if (!value) return;
      if (value.includes(",")) {
        urls.push(...parseSrcset(value).map((item) => ({ value: item.url, priority: 90 + item.score })));
      } else {
        urls.push({ value, priority: 90 });
      }
    });

    if (element.srcset) {
      urls.push(...parseSrcset(element.srcset).map((item) => ({ value: item.url, priority: 70 + item.score })));
    }
    if (element.currentSrc) urls.push({ value: element.currentSrc, priority: 50 });
    if (element.src) urls.push({ value: element.src, priority: 40 });

    const sortedCandidates = urls
      .flatMap((item) => buildDownloadCandidates(item.value, item.priority))
      .sort((a, b) => b.score - a.score)
      .filter((candidate, index, candidates) => candidates.findIndex((item) => item.downloadUrl === candidate.downloadUrl) === index);

    if (!sortedCandidates.length) {
      return [];
    }

    return [
      {
        ...sortedCandidates[0],
        fallbackUrls: sortedCandidates.map((candidate) => candidate.downloadUrl)
      }
    ];
  }

  function parseSrcset(srcset) {
    return String(srcset)
      .split(",")
      .map((item) => {
        const [url, descriptor = ""] = item.trim().split(/\s+/);
        return {
          url,
          score: descriptor.endsWith("w") ? Number.parseInt(descriptor, 10) / 100 : 0
        };
      })
      .filter((item) => item.url);
  }

  function parseCssImageUrls(value) {
    const urls = [];
    const re = /url\((['"]?)(.*?)\1\)/g;
    let match;
    while ((match = re.exec(value || ""))) {
      urls.push(match[2]);
    }
    return urls;
  }

  function normalizeUrl(value) {
    if (!value || value.startsWith("data:") || value.startsWith("blob:")) {
      return "";
    }
    try {
      const url = new URL(value, location.href);
      url.hash = "";
      return url.href;
    } catch {
      return "";
    }
  }

  function buildDownloadCandidates(value, baseScore = 0) {
    const pageImageUrl = normalizeUrl(value);
    if (!pageImageUrl) {
      return [];
    }

    const urls = [pageImageUrl, ...getZhihuOriginalCandidates(pageImageUrl)];
    return Array.from(new Set(urls))
      .map((downloadUrl) => ({
        downloadUrl,
        pageImageUrl,
        score: baseScore + scoreImageUrl(downloadUrl, pageImageUrl),
        fallbackUrls: []
      }))
      .sort((a, b) => b.score - a.score);
  }

  function getClosestLinkedImage(element) {
    const anchor = element.closest("a[href]");
    if (!anchor) {
      return "";
    }

    const href = anchor.getAttribute("href") || "";
    if (!/\.(jpe?g|png|webp|gif)(?:$|[?#])/i.test(href) && !/zhimg\.com/i.test(href)) {
      return "";
    }
    return href;
  }

  function getZhihuOriginalCandidates(value) {
    let url;
    try {
      url = new URL(value);
    } catch {
      return [];
    }

    if (!/(^|\.)zhimg\.com$/i.test(url.hostname)) {
      return [];
    }

    const candidates = [];
    const clean = new URL(url.href);
    clean.search = "";
    clean.hash = "";

    const withoutQualityPath = new URL(clean.href);
    withoutQualityPath.pathname = withoutQualityPath.pathname.replace(/\/(?:50|70|80)\//, "/");
    candidates.push(withoutQualityPath.href);

    const sizeSuffixRe = /_(?:\d+w|hd|b|r|l|xl)(\.(?:jpe?g|png|webp|gif|image))$/i;
    ["_r", "_b", "_xl"].forEach((suffix) => {
      const candidate = new URL(withoutQualityPath.href);
      candidate.pathname = candidate.pathname.replace(sizeSuffixRe, `${suffix}$1`);
      candidates.push(candidate.href);
    });

    return candidates;
  }

  function scoreImageUrl(downloadUrl, pageImageUrl) {
    let score = 0;
    if (downloadUrl !== pageImageUrl) score += 25;
    if (/zhimg\.com/i.test(downloadUrl)) score += 10;
    if (/_r\.(?:jpe?g|png|webp|gif|image)$/i.test(downloadUrl)) score += 40;
    if (/_b\.(?:jpe?g|png|webp|gif|image)$/i.test(downloadUrl)) score += 30;
    if (/_xl\.(?:jpe?g|png|webp|gif|image)$/i.test(downloadUrl)) score += 20;
    if (/\/(?:50|70|80)\//.test(downloadUrl)) score -= 20;
    if (/_(?:\d{2,4}w|hd)\./i.test(downloadUrl)) score -= 10;
    return score;
  }

  function shouldSkipElement(element) {
    if (isEditorOrPickerImage(element)) {
      return true;
    }

    if (isStickerLikeElement(element)) {
      return true;
    }

    const classText = getAncestryText(element);
    if (EXCLUDE_ANCESTOR_RE.test(classText) && isAvatarLikeElement(element)) {
      return true;
    }

    const alt = element.getAttribute("alt") || "";
    return /avatar|头像|用户头像|icon|logo|徽章/i.test(alt);
  }

  function getAncestryText(element) {
    const parts = [];
    let current = element;
    for (let depth = 0; current && depth < 5; depth += 1) {
      parts.push(current.className || "", current.id || "", current.getAttribute?.("aria-label") || "");
      current = current.parentElement;
    }
    return parts.join(" ");
  }

  function looksLikeSmallIcon(element) {
    const rect = element.getBoundingClientRect();
    const naturalWidth = Number(element.naturalWidth) || 0;
    const naturalHeight = Number(element.naturalHeight) || 0;
    const width = Math.max(rect.width || 0, naturalWidth);
    const height = Math.max(rect.height || 0, naturalHeight);

    if (!width || !height) {
      return false;
    }

    if (isAvatarLikeElement(element) && width < MIN_USEFUL_SIDE && height < MIN_USEFUL_SIDE) {
      return true;
    }

    const isSquareish = Math.abs(width - height) <= 16;
    return isAvatarLikeElement(element) && isSquareish && width * height <= MAX_ICON_AREA;
  }

  function isAvatarLikeElement(element) {
    const text = getAncestryText(element);
    const alt = element.getAttribute?.("alt") || "";
    return /avatar|头像|用户头像|author|badge|icon|logo|commentauthor/i.test(`${text} ${alt}`);
  }

  function isEditorOrPickerImage(element) {
    const text = getAncestryText(element);
    return /Editable|DraftEditor|Dropzone|InputLike|EmoHappy|emotion|emoji|sticker|popover|picker|css-pcc2vs|css-dza3t2/i.test(text);
  }

  function looksLikeUnhelpfulUrl(url) {
    return /avatar|icon|logo|badge|sprite|loading|placeholder|grey\.gif|blank\.gif|\/equation\?/i.test(url);
  }

  function isStickerLikeElement(element) {
    const text = `${getAncestryText(element)} ${element.getAttribute?.("alt") || ""} ${element.getAttribute?.("title") || ""}`;
    if (/sticker|emoji|emoticon|emotion|reaction|表情|贴纸/i.test(text)) {
      return true;
    }
    return isZhihuBuiltinReactionImage(element);
  }

  function isStickerLikeUrl(url) {
    return /sticker|emoji|emoticon|emotion|reaction|表情|贴纸/i.test(String(url || ""));
  }

  function isZhihuBuiltinReactionImage(element) {
    const alt = normalizeText(element.getAttribute?.("alt") || "");
    if (!/^(爱|害羞|酷|大笑|发呆|捂脸|机智|赞|怒|惊讶|流泪|偷笑|尴尬|可怜|思考|笑哭|飙泪|鄙视|疑问)$/.test(alt)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const naturalWidth = Number(element.naturalWidth) || 0;
    const naturalHeight = Number(element.naturalHeight) || 0;
    const width = Math.max(rect.width || 0, naturalWidth);
    const height = Math.max(rect.height || 0, naturalHeight);
    return width > 0 && height > 0 && width <= 72 && height <= 72;
  }

  function buildStateImageRecord(url, pageImageUrl, candidates, comment, source) {
    const stateCreatedTime = getStateCommentCreatedTime(comment);
    const commentTime = formatStateCommentTime(stateCreatedTime);
    return {
      originalUrl: url,
      thumbnailUrl: pageImageUrl && pageImageUrl !== url ? pageImageUrl : "",
      fallbackUrls: candidates.map((candidate) => candidate.downloadUrl).filter((item) => item && item !== url),
      originalName: getOriginalName(url),
      alt: "",
      title: "",
      weakDescription: getCommentText(comment),
      width: 0,
      height: 0,
      source,
      commentId: comment.id || "",
      authorName: comment.author?.name || comment.author?.member?.name || "",
      createdTime: stateCreatedTime,
      commentTime
    };
  }

  function getStateCommentCreatedTime(comment) {
    return comment.createdTime || comment.created_time || comment.createdAt || comment.createTime || comment.created || comment.time || "";
  }

  function formatStateCommentTime(value) {
    if (!value) {
      return "";
    }
    if (typeof value === "number" || /^\d{10,13}$/.test(String(value))) {
      const timestamp = Number(value) < 100000000000 ? Number(value) * 1000 : Number(value);
      const date = new Date(timestamp);
      if (!Number.isNaN(date.getTime())) {
        return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
    }
    return extractCommentTimeText(value);
  }

  function getCommentText(comment) {
    const text = comment.content || comment.excerpt || comment.text || "";
    return String(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function buildImageRecord(url, element, pageImageUrl, fallbackUrls) {
    const rect = element.getBoundingClientRect();
    return {
      originalUrl: url,
      thumbnailUrl: pageImageUrl && pageImageUrl !== url ? pageImageUrl : "",
      fallbackUrls: Array.from(new Set(fallbackUrls || [url])).filter((item) => item && item !== url),
      originalName: getOriginalName(url),
      alt: element.getAttribute("alt") || "",
      title: element.getAttribute("title") || "",
      weakDescription: getNearbyText(element),
      width: Math.round(Math.max(rect.width || 0, Number(element.naturalWidth) || 0)),
      height: Math.round(Math.max(rect.height || 0, Number(element.naturalHeight) || 0)),
      commentTime: getCommentTime(element)
    };
  }

  function getOriginalName(url) {
    try {
      const pathname = new URL(url).pathname;
      const name = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
      return name || "image";
    } catch {
      return "image";
    }
  }

  function getNearbyText(element) {
    const holder = element.closest(".CommentItem, .CommentContent, [class*='Comment']") || element.parentElement;
    return (holder?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 180);
  }

  function getCommentTime(element) {
    const item = element.closest("div[data-id]") || element.closest(".CommentItem, [class*='CommentItem']") || element.closest(".CommentContent, [class*='CommentContent']");
    if (!item) {
      return "";
    }

    const candidates = Array.from(item.querySelectorAll("time, [datetime], [data-tooltip], [aria-label], span, a, div"))
      .flatMap((node) => [
        node.getAttribute?.("datetime"),
        node.getAttribute?.("content"),
        node.getAttribute?.("data-tooltip"),
        node.getAttribute?.("aria-label"),
        node.getAttribute?.("title"),
        node.textContent
      ])
      .map(extractCommentTimeText)
      .filter(Boolean);
    if (candidates.length) {
      return candidates[0];
    }

    return extractCommentTimeText(item.innerText || "");
  }

  function extractCommentTimeText(value) {
    const text = normalizeText(value);
    if (!text) {
      return "";
    }

    const iso = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/);
    if (iso) {
      const datePart = `${String(Number(iso[2])).padStart(2, "0")}-${String(Number(iso[3])).padStart(2, "0")}`;
      return iso[4] ? `${datePart} ${String(Number(iso[4])).padStart(2, "0")}:${iso[5]}` : datePart;
    }

    const monthDay = text.match(/(?:^|[\s·])(\d{1,2}[-/]\d{1,2}(?:\s+\d{1,2}:\d{2})?)(?:[\s·]|$)/);
    if (monthDay) {
      return monthDay[1].replace("/", "-");
    }

    const dayTime = text.match(/(今天|昨天|前天)\s*\d{1,2}:\d{2}/);
    if (dayTime) {
      return dayTime[0];
    }

    const relative = text.match(/(?:刚刚|\d+\s*(?:秒|分钟|小时|天)前)/);
    return relative?.[0] || "";
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements)).filter(Boolean);
  }
})();


(function registerWorkerModule(root, factory) {
  const dependencies = typeof require === "function" ? require("./domain.cjs") : root.MasakiClaw || {};
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createWorkerModule(core) {
  async function handleWorkerRequest() {
    const request = await GM.getValue(core.WORK_KEY, null);
    if (!request || !sameTarget(request.url, location.href)) return false;
    try {
      const result = request.kind === "discover" ? await discoverItems(request) : await collectTarget(request);
      await GM.setValue(core.RESPONSE_KEY, { nonce: request.nonce, ok: true, result });
    } catch (error) {
      await GM.setValue(core.RESPONSE_KEY, { nonce: request.nonce, ok: false, error: error?.message || String(error) });
    }
    return true;
  }

  async function collectTarget(request) {
    if (typeof window.masakiClawPreparePage !== "function") throw new Error("知乎采集器未加载。");
    const options = request.options || {};
    const prepareStats = options.autoScroll === false ? null : await window.masakiClawPreparePage({
      maxScrolls: options.scrollUntilBottom ? null : options.scrollSteps,
      scrollUntilBottom: options.scrollUntilBottom,
      delayMs: 350,
      allowSecondaryReplies: options.allowSecondaryReplies,
      targetUrl: request.url
    });
    const capture = await window.masakiClawCollectCommentImages({
      maxImages: options.unlimitedImages ? null : options.maxImages,
      prepareStats,
      targetUrl: request.url
    });
    return shapeCapture(capture, prepareStats, location.href, document.title);
  }

  function shapeCapture(capture, prepareStats, fallbackUrl = "", fallbackTitle = "") {
    return {
      status: "complete",
      sourcePage: capture.pageUrl || fallbackUrl,
      pageTitle: capture.pageTitle || fallbackTitle,
      capturedAt: capture.capturedAt,
      publishedAt: capture.publishedAt,
      scope: capture.scope,
      captureDebug: capture.captureDebug,
      images: core.uniqueImageCandidates(capture.images),
      prepareStats
    };
  }

  async function discoverItems(request) {
    const cutoff = Date.parse(request.cutoff || "2021-12-30T00:00:00+08:00");
    let previousCount = 0;
    let stale = 0;
    for (let index = 0; index < 180 && stale < 16; index += 1) {
      window.scrollTo(0, document.scrollingElement?.scrollHeight || document.body.scrollHeight || 0);
      await delay(700);
      const count = document.querySelectorAll(".ContentItem, [data-zop]").length;
      stale = count > previousCount ? 0 : stale + 1;
      previousCount = count;
    }
    const selectors = {
      answer: "a[href*='/question/'][href*='/answer/']",
      post: "a[href*='zhuanlan.zhihu.com/p/'], a[href^='/p/']",
      pin: "a[href*='/pin/']"
    };
    const found = [];
    for (const anchor of document.querySelectorAll(selectors[request.sourceType] || "a")) {
      const url = normalizeDiscoveredUrl(anchor.href, request.sourceType);
      if (!url) continue;
      const holder = anchor.closest(".ContentItem, [data-zop]") || anchor.parentElement;
      const publishedAt = findPublishedAt(holder);
      if (publishedAt && Date.parse(publishedAt) < cutoff) continue;
      found.push({ url, title: (anchor.textContent || holder?.innerText || "").trim().slice(0, 120), publishedAt });
    }
    return Array.from(new Map(found.map((item) => [item.url, item])).values());
  }

  function normalizeDiscoveredUrl(value, type) {
    try {
      const url = new URL(value, location.href); url.search = ""; url.hash = "";
      if (type === "answer" && /\/question\/\d+\/answer\/\d+/.test(url.pathname)) return `https://www.zhihu.com${url.pathname}`;
      if (type === "post" && /^\/p\/\d+/.test(url.pathname)) return `https://zhuanlan.zhihu.com${url.pathname}`;
      if (type === "pin" && /^\/pin\/\d+/.test(url.pathname)) return `https://www.zhihu.com${url.pathname}`;
    } catch {}
    return "";
  }

  function findPublishedAt(root) {
    const value = root?.querySelector("meta[itemprop='dateCreated'], meta[itemprop='datePublished'], time")?.getAttribute("content")
      || root?.querySelector("time")?.getAttribute("datetime") || "";
    if (value && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
    const match = (root?.innerText || "").match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toISOString() : "";
  }
  function sameTarget(left, right) { try { const a = new URL(left); const b = new URL(right); return a.origin === b.origin && a.pathname.replace(/\/$/, "") === b.pathname.replace(/\/$/, ""); } catch { return false; } }
  function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  return { handleWorkerRequest, collectTarget, discoverItems, shapeCapture };
});


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

// ==UserScript==
// @name         MasakiClaw
// @namespace    https://github.com/Ayachi2225/masakiclaw
// @version      0.1.0
// @description  Collect Zhihu comment images into a structured local archive.
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAARGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAACAoAMABAAAAAEAAACAAAAAAEiOBHcAAAHLaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj40ODA8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDgwPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CvNWbFkAAD5XSURBVHgBxd0FvJRV/jj+S3d3d4NIKY1grIXd3aL73dfq6trdva6x6irYICa2lAKChEmrdEl3x4X/e+7jPj7MzJ07cy/+/iOv65nznPicT38+5zxnsvYV4PPkk/8aM+arVq1azZ49c8uWjevXr92wft2GDesUEv9t27Zl2LAPChcu3K1bt19++aUA0/7RddeuXa1bt/7HP67du2/v7Xfc/sEHH5xyyqmHHHLI+g1rt27bsm792rXr1oT/NmxcP3PWjEMOPTQrK6tDhw4//vjjHwP9/1cqctdddwEof59Vq1aVK1+2atWq777z3nHHHbd3794U43jaoEGDjh07li9f7pFHHv3kk0+KFClSoUKF8uXLp+iV+pER3n///RUrVp53/rlVq1Z57dXXnnnm6cmTJw8Z/FaZMmXq169fsmTJ7OzsYBBINt2pp55Ss1atzz777LnnnitVqlS7du1KlCiRepY/9WmBCFCqVOlp06deeNGFo0aNtrw2bdrs2bMnN3ALFSoEHa1bt6pYsQKhWb58+WOPPf7iiy+OHj169erVderUgZ3c+ibWf/rpp6+88go8Lly4cM6cOSVLlKhSpUrJkiV+/fXXm2666b///W/RosW+/+EHf+vUqU3sgGcQf4sXL969e/f+/fuvWrXyX//610cffdS5c2ezJ07x/6amUABZ/ibTlxY686wzLe3OO+6+9tprGjSov3v37sTRAhTA9Ycffkz/bNiwoVGjRngfvnbu3OkvZjzssMPOPffcM844Q+PEEcKaWbNmPfTQQzVq1CBzeBzZVq5caUz1iDF+/HgEaN++PQa/9bZbvvvuO2qob9/DiGlUQIsVKwb4r7766t577ps7d+5FF110xx13VK5cOZzl/1mhQBKAqTdu3Lhk6ZL27Q+uWKnioEEv9+zZI1ibBXiK3YIPqtxww4233HKrRV5yySV/+9vfSMP27duvueYaZCAQdevV/eD9D9577z0YNELTpk39jcMCZUJx6fvPf/5zwIABDRs2rFSpUunSpatVq2aE3r17H3PMMX369Bk7dqypt27diiqXXXZJzZo1s/ZllSj5u54JoEIM45t6x/bt3333PUr4tG3btl69enGT/tlfC0QAwDVo0PCzTz+lfBo2arh2zdqPP/7k8MMP37dvL/xCwaRJk0aNGvXrr3OeeuqZV1559dZbb3366acPPfRQSGEqEePtt9/u1KkTgejVs+ell1069aepU6ZModY///xzbZo1axaVBjz79ddfDx48+Lffflu/fj29EWc/mAS9AECqKJknHn+iUcNGjRo3ivLEli1bJ0+alL0ne+7cefPmzvt59uzWrVo0a9r0l19/ASH61a1b989GenT8AhFgx44dU6ZMfurf//7hhx+XLlnGAFDNVkvRv/76G88++xzF26RJ01q1avE6Tj31VMuLaltL7dq167vvvoskEydOqt+g/i233pydvZfeWLZs2VtvvYUY6ES5BxAjBmqhSk77ibfddhuZoMrKli0bXZJy7dq1cQC1g95H/eUohAkbFC5caE/2HrTnC9SrX69IkaITJ06sW6d28+bNx4wZSw4wE80WJXzY988oFMgGLFmyZOjQocjw+uuvX3bZZaeccgpcX3HFFWvXrqUNevXqNWHChG3btjVp0oSh4wIlXcCWLVueffbZGMM+8cTZ55zdq1fP/sf3HzFiZPXq1eGafr/++uuplx9++GHGjBm0fKDx16xZwwc1IHX/5JNPsh9JB3/++ed379l9xRWXE8ewAXpwWwtlFSpatChijxwxisQsWrQI9kGuGQLffPPNJ/TvXyilNQoHLEihQAQIJ4Y7Ct0aEGDSpMlXXnkFYmzatIljjuWZx59++omZPeKIIyDassOOQYER3rx5M7679tpr73/gvhXLV9x6620c1DfefOP2225//PEn8Dg6hb1gEJ9e/derCUSJ4sXvvvtuBoashA3CAua44IILrv7rVTggIFj4KCgAhpViojAK7M+YPuPzz7/48MMPqbg+vXvfcOONxx57bFyXA/v1wBAAP44ZO+bww/s99OBDvXv3wfu8TGiioxk98k6iaRUaf968eeeffz7NE7cMBPCh3yd+881jTzz227LfuOcdOna88sorB740UGOE5G5RYsWLF+P5LFv22+pVq0uWKnnwwQfffNPNGuvL948b1tdvv/32qquuGjzkTY5TGBMkNgMnIOlPBaAyZi/+98XZs2cfffTRQiUykdjlgNQcGAIA5Y033mjQsL7IoHOnzlxAiIYymGIVBatcdVxGLy1YsODRRx+Fx7POOitcAN+GdbV+yqpFzufNN9+kc9q0aT1kyFs494wzTr/o4otZ1N17drHYSFWsWPFKlSoi86yZs+6//wFh7S233EIUwjGjBV5m7Tq177jjdmwerc+tjHVQ1Cx8gX898a/Zs3++8MILmZw/w0c6YAQYOXLkjp07uDEcRGYTH0WXx+3jHX7xxRdMBWPATpx33nk0kjYff/wxPJ588sm8ybAL1cGZqVWrNofqwQcfqFix4oyZM0eOGIHxGzduTFmxz2xpxw4duvfocd+99/Ff1YuBGd5wkLCA6ieddOKrr72qTYpQMWwfFCyB87p92/YPh30odEcPEQaJpLLiWhbk6wEjAC0/YfzXq9asqVC+wj/+8Y+kMHHM+Tb0T8+ePW+88UbroRZwriCoXLlyYRe2/brrrpO0oDrw+zvvvCPakPbwl29DS8AjjU+8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
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

  async function createArchiveWriter({
    directoryHandle = null,
    options = {},
    onLog = () => {},
    volumeLimit = ZIP_VOLUME_LIMIT,
    now = () => new Date()
  }) {
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
      const folder = getTaskImageFolderName({
        ...result,
        capturedAt: result.capturedAt || job.createdAt
      }, now().toISOString());
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
        completedAt: now().toISOString(),
        options: publicOptions(options),
        dedupe: { enabled: options.dedupeEnabled === true },
        ai: { enabled: options.aiEnabled === true, baseUrl: options.visionBaseUrl || "", model: options.visionModel || "" },
        images: records
      };
      index.tasks.push(task);
      index.updatedAt = now().toISOString();
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
      const jobIndex = {
        ...index,
        tasks: index.tasks.filter((task) => task.taskId.startsWith(`${job.id}-`))
      };
      const similarityReport = buildSimilarityReport(jobIndex);
      const reportFilename = getSimilarityReportFilename(job, now().toISOString());
      if (directoryHandle) {
        await writeJson(directoryHandle, "images.json", index);
        if (similarityReport) await writeText(directoryHandle, reportFilename, similarityReport);
        return { kind: "directory", taskCount: index.tasks.length };
      }
      const contentVolumes = splitVolumes(zipFiles, Math.max(1024, volumeLimit - 1024 * 1024));
      const volumes = (contentVolumes.length ? contentVolumes : [[]]).map((volume, volumeIndex) => {
        const localIndex = buildVolumeIndex(index, volume, volumeIndex === 0);
        const files = volume.concat([
          { name: "images.json", data: encoder.encode(JSON.stringify(localIndex, null, 2)) }
        ]);
        const localReport = buildSimilarityReport(localIndex);
        if (localReport) files.push({ name: reportFilename, data: encoder.encode(localReport) });
        return files;
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
  function getTaskImageFolderName(task, fallbackTimestamp = "") {
    const date = new Date(task.publishedAt || task.capturedAt || fallbackTimestamp);
    const fallbackDate = new Date(fallbackTimestamp);
    const validDate = Number.isNaN(date.getTime()) ? fallbackDate : date;
    const datePart = Number.isNaN(validDate.getTime())
      ? "unknown-date"
      : `${validDate.getFullYear()}-${validDate.getMonth() + 1}-${validDate.getDate()}`;
    const sourcePage = String(task.sourcePage || "");
    const type = /\/pin\/\d+/i.test(sourcePage)
      ? "pin"
      : /\/answer\/\d+/i.test(sourcePage)
        ? "answer"
        : /zhuanlan\.zhihu\.com\/p\/\d+|\/p\/\d+/i.test(sourcePage)
          ? "post"
          : "";
    return safeName(type ? `${datePart}_${type}` : datePart);
  }
  function safeName(value) { return String(value || "image").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim().slice(0, 100) || "image"; }
  function compactHash(value) { let hash = 2166136261; for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, "0"); }
  function stripExtension(value) { return value.replace(/\.[a-z0-9]{1,8}$/i, ""); }
  function extension(value, mime) { return value.match(/\.([a-z0-9]{1,8})$/i)?.[1] || mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg"; }
  function publicOptions(options) { const copy = { ...options }; delete copy.apiKey; delete copy.visionPassword; return copy; }
  function buildSimilarityReport(index) {
    const rows = index.tasks.flatMap((task) => task.images
      .filter((image) => image.duplicate?.matchedBy === "visual_similarity")
      .map((image) => `- ${image.relativePath || image.originalUrl} ↔ ${image.duplicate.matchedOriginalUrl} (${image.duplicate.similarity || "?"}%)`));
    return rows.length ? `# MasakiClaw 相似图片报告\n\n${rows.join("\n")}\n` : "";
  }
  function getSimilarityReportFilename(job, fallbackTimestamp = "") {
    const completedAt = new Date(job.updatedAt || fallbackTimestamp);
    const fallbackDate = new Date(fallbackTimestamp);
    const validDate = Number.isNaN(completedAt.getTime()) ? fallbackDate : completedAt;
    const timestamp = (Number.isNaN(validDate.getTime()) ? "unknown-time" : validDate.toISOString())
      .replace(/\.\d{3}Z$/, "")
      .replace("T", "_")
      .replace(/:/g, "-");
    return `similar-${timestamp}-${safeName(job.id || "task")}.md`;
  }
  async function readIndex(dir) { try { const file = await (await dir.getFileHandle("images.json")).getFile(); const value = JSON.parse(await file.text()); return Array.isArray(value.tasks) ? value : { schemaVersion: 1, updatedAt: "", tasks: [] }; } catch { return { schemaVersion: 1, updatedAt: "", tasks: [] }; } }
  async function writeBlobPath(root, path, blob) { const parts = path.split("/"); const name = parts.pop(); let dir = root; for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true }); const handle = await dir.getFileHandle(name, { create: true }); const writable = await handle.createWritable(); await writable.write(blob); await writable.close(); }
  async function writeText(root, name, value) { return writeBlobPath(root, name, new Blob([value], { type: "text/plain;charset=utf-8" })); }
  async function writeJson(root, name, value) { return writeText(root, name, JSON.stringify(value, null, 2)); }
  function downloadBlob(blob, name) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); const timer = setTimeout(() => URL.revokeObjectURL(url), 60000); timer?.unref?.(); }
  function blobToDataUrl(blob) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); }
  return {
    buildSimilarityReport,
    buildVolumeIndex,
    createArchiveWriter,
    getSimilarityReportFilename,
    getTaskImageFolderName
  };
});


(function registerUiModule(root, factory) {
  const api = factory();
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createUiModule() {
  function createControlPanel({ onStart, onStop, onResume }) {
    const host = document.createElement("div"); host.id = "masakiclaw-userscript-host"; document.documentElement.append(host);
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `<style>${styles()}</style>
      <button id="claw" title="MasakiClaw" aria-label="打开 MasakiClaw"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAARGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAACAoAMABAAAAAEAAACAAAAAAEiOBHcAAAHLaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj40ODA8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDgwPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CvNWbFkAAD5XSURBVHgBxd0FvJRV/jj+S3d3d4NIKY1grIXd3aL73dfq6trdva6x6irYICa2lAKChEmrdEl3x4X/e+7jPj7MzJ07cy/+/iOv65nznPicT38+5zxnsvYV4PPkk/8aM+arVq1azZ49c8uWjevXr92wft2GDesUEv9t27Zl2LAPChcu3K1bt19++aUA0/7RddeuXa1bt/7HP67du2/v7Xfc/sEHH5xyyqmHHHLI+g1rt27bsm792rXr1oT/NmxcP3PWjEMOPTQrK6tDhw4//vjjHwP9/1cqctdddwEof59Vq1aVK1+2atWq777z3nHHHbd3794U43jaoEGDjh07li9f7pFHHv3kk0+KFClSoUKF8uXLp+iV+pER3n///RUrVp53/rlVq1Z57dXXnnnm6cmTJw8Z/FaZMmXq169fsmTJ7OzsYBBINt2pp55Ss1atzz777LnnnitVqlS7du1KlCiRepY/9WmBCFCqVOlp06deeNGFo0aNtrw2bdrs2bMnN3ALFSoEHa1bt6pYsQKhWb58+WOPPf7iiy+OHj169erVderUgZ3c+ibWf/rpp6+88go8Lly4cM6cOSVLlKhSpUrJkiV+/fXXm2666b///W/RosW+/+EHf+vUqU3sgGcQf4sXL969e/f+/fuvWrXyX//610cffdS5c2ezJ07x/6amUABZ/ibTlxY686wzLe3OO+6+9tprGjSov3v37sTRAhTA9Ycffkz/bNiwoVGjRngfvnbu3OkvZjzssMPOPffcM844Q+PEEcKaWbNmPfTQQzVq1CBzeBzZVq5caUz1iDF+/HgEaN++PQa/9bZbvvvuO2qob9/DiGlUQIsVKwb4r7766t577ps7d+5FF110xx13VK5cOZzl/1mhQBKAqTdu3Lhk6ZL27Q+uWKnioEEv9+zZI1ibBXiK3YIPqtxww4233HKrRV5yySV/+9vfSMP27duvueYaZCAQdevV/eD9D9577z0YNELTpk39jcMCZUJx6fvPf/5zwIABDRs2rFSpUunSpatVq2aE3r17H3PMMX369Bk7dqypt27diiqXXXZJzZo1s/ZllSj5u54JoEIM45t6x/bt3333PUr4tG3btl69enGT/tlfC0QAwDVo0PCzTz+lfBo2arh2zdqPP/7k8MMP37dvL/xCwaRJk0aNGvXrr3OeeuqZV1559dZbb3366acPPfRQSGEqEePtt9/u1KkTgejVs+ell1069aepU6ZModY///xzbZo1axaVBjz79ddfDx48+Lffflu/fj29EWc/mAS9AECqKJknHn+iUcNGjRo3ivLEli1bJ0+alL0ne+7cefPmzvt59uzWrVo0a9r0l19/ASH61a1b989GenT8AhFgx44dU6ZMfurf//7hhx+XLlnGAFDNVkvRv/76G88++xzF26RJ01q1avE6Tj31VMuLaltL7dq167vvvoskEydOqt+g/i233pydvZfeWLZs2VtvvYUY6ES5BxAjBmqhSk77ibfddhuZoMrKli0bXZJy7dq1cQC1g95H/eUohAkbFC5caE/2HrTnC9SrX69IkaITJ06sW6d28+bNx4wZSw4wE80WJXzY988oFMgGLFmyZOjQocjw+uuvX3bZZaeccgpcX3HFFWvXrqUNevXqNWHChG3btjVp0oSh4wIlXcCWLVueffbZGMM+8cTZ55zdq1fP/sf3HzFiZPXq1eGafr/++uuplx9++GHGjBm0fKDx16xZwwc1IHX/5JNPsh9JB3/++ed379l9xRWXE8ewAXpwWwtlFSpatChijxwxisQsWrQI9kGuGQLffPPNJ/TvXyilNQoHLEihQAQIJ4Y7Ct0aEGDSpMlXXnkFYmzatIljjuWZx59++omZPeKIIyDassOOQYER3rx5M7679tpr73/gvhXLV9x6620c1DfefOP2225//PEn8Dg6hb1gEJ9e/derCUSJ4sXvvvtuBoashA3CAua44IILrv7rVTggIFj4KCgAhpViojAK7M+YPuPzz7/48MMPqbg+vXvfcOONxx57bFyXA/v1wBAAP44ZO+bww/s99OBDvXv3wfu8TGiioxk98k6iaRUaf968eeeffz7NE7cMBPCh3yd+881jTzz227LfuOcdOna88sorB740UGOE5G5RYsWLF+P5LFv22+pVq0uWKnnwwQfffNPNGuvL948b1tdvv/32qquuGjzkTY5TGBMkNgMnIOlPBaAyZi/+98XZs2cfffTRQiUykdjlgNQcGAIA5Y033mjQsL7IoHOnzlxAiIYymGIVBatcdVxGLy1YsODRRx+Fx7POOitcAN+GdbV+yqpFzufNN9+kc9q0aT1kyFs494wzTr/o4otZ1N17drHYSFWsWPFKlSoi86yZs+6//wFh7S233EIUwjGjBV5m7Tq177jjdmwerc+tjHVQ1Cx8gX898a/Zs3++8MILmZw/w0c6YAQYOXLkjp07uDEcRGYTH0WXx+3jHX7xxRdMBWPATpx33nk0kjYff/wxPJ588sm8ybAL1cGZqVWrNofqwQcfqFix4oyZM0eOGIHxGzduTFmxz2xpxw4duvfocd+99/Ff1YuBGd5wkLCA6ieddOKrr72qTYpQMWwfFCyB87p92/YPh30odEcPEQaJpLLiWhbk6wEjAC0/YfzXq9asqVC+wj/+8Y+kMHHM+Tb0T8+ePW+88UbroRZwriCoXLlyYRe2/brrrpO0oDrw+zvvvCPakPbwl29DS8AjjU+8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" alt=""></button>
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

  function styles() { return `:host{all:initial}*{box-sizing:border-box}[hidden]{display:none!important}#claw{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:48px;height:48px;padding:0;border:2px solid #fff;border-radius:50%;overflow:hidden;background:#111827;box-shadow:0 8px 28px #0004;cursor:pointer}#claw img{display:block;width:100%;height:100%;object-fit:cover}#panel{position:fixed;right:18px;bottom:76px;z-index:2147483647;width:min(390px,calc(100vw - 24px));max-height:calc(100vh - 96px);overflow:auto;padding:16px;border:1px solid #d1d5db;border-radius:14px;background:linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.92) 55%,rgba(255,255,255,.58) 100%),url("data:image/png;base64,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") right -10px top 6px/240px 240px no-repeat,#f6f8fa;color:#111827;font:14px/1.4 system-ui;box-shadow:0 16px 48px #0005}header{display:flex;justify-content:space-between;align-items:center;font-size:18px}header button{border:0;background:none;font-size:24px;cursor:pointer}.hint{margin:3px 0 12px;color:#6b7280}label,fieldset{display:block;margin:9px 0}input,textarea,select{width:100%;margin-top:4px;padding:7px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1f2933;font:inherit}.check{display:flex;align-items:center;gap:7px}.check input,fieldset input{width:auto;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}fieldset{border:1px solid #e5e7eb;border-radius:8px;background:rgba(255,255,255,.72)}fieldset label{display:inline-flex;margin:4px 10px 4px 0;gap:4px}.actions{display:flex;gap:8px;margin-top:12px}.actions button,.notice button{padding:8px 12px;border:0;border-radius:8px;background:#1769aa;color:white;cursor:pointer}.secondary{background:#64748b!important}.notice{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:rgba(254,243,199,.92)}progress{width:100%;margin-top:10px}pre{min-height:50px;max-height:150px;overflow:auto;white-space:pre-wrap;background:#111827;color:#d1fae5;padding:8px;border-radius:8px;font:12px/1.35 ui-monospace}`; }
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

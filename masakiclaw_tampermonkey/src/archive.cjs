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

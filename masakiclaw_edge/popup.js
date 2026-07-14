const DEFAULT_TARGET = "https://zhuanlan.zhihu.com/p/2049455800079356223";
const AI_CREDENTIAL_KEY = "masakiClawAiCredential";
const AI_SETTINGS_KEY = "masakiClawAiSettings";
const PRIVACY_NOTICE_KEY = "masakiClawPrivacyNoticeAccepted";
const AI_PASSWORD_PEPPER = "donthackme";
const AI_PASSWORD_ITERATIONS = 150000;
const MAX_AI_PASSWORD_ATTEMPTS = 5;
let savedAiCredentialMode = "";

const form = {
  privacyNotice: document.querySelector("#privacyNotice"),
  acceptPrivacyNotice: document.querySelector("#acceptPrivacyNotice"),
  mainControls: document.querySelector("#mainControls"),
  start: document.querySelector("#start"),
  stopBatch: document.querySelector("#stopBatch"),
  status: document.querySelector("#status"),
  targetUrlField: document.querySelector("#targetUrlField"),
  targetUrl: document.querySelector("#targetUrl"),
  batchSourcesField: document.querySelector("#batchSourcesField"),
  maxImages: document.querySelector("#maxImages"),
  unlimitedImages: document.querySelector("#unlimitedImages"),
  autoScroll: document.querySelector("#autoScroll"),
  allowSecondaryReplies: document.querySelector("#allowSecondaryReplies"),
  dedupeEnabled: document.querySelector("#dedupeEnabled"),
  aiEnabled: document.querySelector("#aiEnabled"),
  aiConfigFields: document.querySelector("#aiConfigFields"),
  visionApiKey: document.querySelector("#visionApiKey"),
  saveAiKey: document.querySelector("#saveAiKey"),
  plainSaveAiKey: document.querySelector("#plainSaveAiKey"),
  plainSaveHint: document.querySelector("#plainSaveHint"),
  visionPassword: document.querySelector("#visionPassword"),
  visionBaseUrl: document.querySelector("#visionBaseUrl"),
  visionModel: document.querySelector("#visionModel"),
  scrollSteps: document.querySelector("#scrollSteps"),
  scrollUntilBottom: document.querySelector("#scrollUntilBottom")
};

document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener("change", syncModeFields);
});
form.aiEnabled.addEventListener("change", syncAiFields);
form.stopBatch.addEventListener("click", stopBatchCapture);
form.unlimitedImages.addEventListener("change", syncImageLimitFields);
form.scrollUntilBottom.addEventListener("change", syncScrollFields);
form.saveAiKey.addEventListener("change", syncAiSaveFields);
form.plainSaveAiKey.addEventListener("change", syncAiSaveFields);
form.visionApiKey.addEventListener("input", syncAiSaveFields);
form.acceptPrivacyNotice.addEventListener("click", acceptPrivacyNotice);

form.targetUrl.value = DEFAULT_TARGET;
syncModeFields();
syncAiFields();
syncImageLimitFields();
syncScrollFields();
loadSavedAiSettings();
loadPrivacyNoticeState();

form.start.addEventListener("click", async () => {
  form.start.disabled = true;
  setStatus("正在采集评论区图片...");

  const payload = {
    type: "START_CAPTURE",
    mode: getRadioValue("mode"),
    targetUrl: form.targetUrl.value.trim(),
    maxImages: form.unlimitedImages.checked ? null : Number(form.maxImages.value) || 80,
    maxImagesUnlimited: form.unlimitedImages.checked,
    autoScroll: form.autoScroll.checked,
    allowSecondaryReplies: form.allowSecondaryReplies.checked,
    dedupeEnabled: form.dedupeEnabled.checked,
    batchSources: getCheckedValues(".batchSource"),
    aiEnabled: form.aiEnabled.checked,
    visionApiKey: "",
    visionBaseUrl: form.visionBaseUrl.value.trim(),
    visionModel: form.visionModel.value.trim(),
    scrollSteps: form.scrollUntilBottom.checked ? null : Number(form.scrollSteps.value) || 0,
    scrollUntilBottom: form.scrollUntilBottom.checked
  };

  try {
    if (payload.mode === "url" && !isSupportedZhihuUrl(payload.targetUrl)) {
      throw new Error("指定 URL 只支持 www.zhihu.com 或 zhuanlan.zhihu.com 的 HTTPS 地址。");
    }
    if (payload.mode === "current") {
      payload.sourceTabId = await getCurrentTabId();
    }
    if (payload.mode === "batch" && !payload.batchSources.length) {
      throw new Error("批量模式至少选择一个来源。");
    }
    if (payload.aiEnabled) {
      if (!isHttpsUrl(payload.visionBaseUrl)) {
        throw new Error("视觉模型 API Base URL 必须以 https:// 开头。");
      }
      if (!payload.visionModel) {
        throw new Error("启用 AI 时必须填写视觉模型。");
      }
      await ensureAiHostPermission(payload.visionBaseUrl);
      payload.visionApiKey = await resolveAiApiKeyForTask(payload);
      if (!payload.visionApiKey) {
        throw new Error("启用 AI 时必须输入新的 API Key，或解锁本地已保存 key。");
      }
    }

    const response = await chrome.runtime.sendMessage(payload);
    if (!response?.ok) {
      throw new Error(response?.error || "任务失败。");
    }

    if (payload.mode === "batch") {
      form.stopBatch.hidden = false;
      setStatus("已打开文件夹写入页。\n选择保存文件夹后才会开始批量采集。");
    } else {
      setStatus("已打开文件夹写入页。\n选择保存文件夹后才会开始采集。");
    }
  } catch (error) {
    setStatus(error.message);
  } finally {
    form.start.disabled = false;
  }
});

function getRadioValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter((input) => input.checked)
    .map((input) => input.value);
}

async function getCurrentTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.url?.startsWith("chrome-extension://")) {
    throw new Error("没有找到可采集的当前网页。");
  }
  if (!isSupportedZhihuUrl(tab.url || "")) {
    throw new Error("当前页模式只支持 www.zhihu.com 或 zhuanlan.zhihu.com 页面。");
  }
  return tab.id;
}

function setStatus(message) {
  form.status.textContent = message;
}

function syncModeFields() {
  const mode = getRadioValue("mode");
  const useUrl = mode === "url";
  form.targetUrlField.hidden = !useUrl;
  form.targetUrl.disabled = !useUrl;
  form.batchSourcesField.hidden = mode !== "batch";
  form.stopBatch.hidden = mode !== "batch";
}

async function stopBatchCapture() {
  form.stopBatch.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "STOP_BATCH" });
    if (!response?.ok) {
      throw new Error(response?.error || "停止失败。");
    }
    setStatus("已请求停止批量采集。当前页面处理结束后会停止。");
  } catch (error) {
    setStatus(error.message);
    form.stopBatch.disabled = false;
  }
}

function syncAiFields() {
  const enabled = form.aiEnabled.checked;
  form.aiConfigFields.hidden = !enabled;
  form.visionApiKey.disabled = !enabled;
  form.saveAiKey.disabled = !enabled;
  form.plainSaveAiKey.disabled = !enabled || !form.saveAiKey.checked;
  form.visionBaseUrl.disabled = !enabled;
  form.visionModel.disabled = !enabled;
  syncAiSaveFields();
}

function syncAiSaveFields() {
  const enabled = form.aiEnabled.checked;
  const saving = enabled && form.saveAiKey.checked;
  form.plainSaveAiKey.disabled = !saving;
  if (!saving) {
    form.plainSaveAiKey.checked = false;
  }
  form.visionPassword.disabled = !shouldEnableAiPasswordField(enabled, saving, form.plainSaveAiKey.checked);
  form.plainSaveHint.hidden = !(saving && form.plainSaveAiKey.checked);
}

function shouldEnableAiPasswordField(enabled, saving, plainSave) {
  if (!enabled) {
    return false;
  }
  const hasNewApiKey = Boolean(form.visionApiKey.value.trim());
  if (hasNewApiKey) {
    return saving && !plainSave;
  }
  if (savedAiCredentialMode === "encrypted") {
    return true;
  }
  return saving && !plainSave;
}

function syncImageLimitFields() {
  form.maxImages.disabled = form.unlimitedImages.checked;
}

function syncScrollFields() {
  form.scrollSteps.disabled = form.scrollUntilBottom.checked;
}

function isHttpsUrl(value) {
  return /^https:\/\//i.test(value);
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

async function loadPrivacyNoticeState() {
  const result = await chrome.storage.local.get(PRIVACY_NOTICE_KEY);
  const accepted = result[PRIVACY_NOTICE_KEY] === true;
  form.privacyNotice.hidden = accepted;
  form.mainControls.hidden = !accepted;
}

async function acceptPrivacyNotice() {
  await chrome.storage.local.set({ [PRIVACY_NOTICE_KEY]: true });
  form.privacyNotice.hidden = true;
  form.mainControls.hidden = false;
}

async function loadSavedAiSettings() {
  const result = await chrome.storage.local.get([AI_CREDENTIAL_KEY, AI_SETTINGS_KEY]);
  const settings = result[AI_SETTINGS_KEY];
  const credential = result[AI_CREDENTIAL_KEY];
  savedAiCredentialMode = credential?.mode || "";
  if (settings?.baseUrl) {
    form.visionBaseUrl.value = settings.baseUrl;
  }
  if (settings?.model) {
    form.visionModel.value = settings.model;
  }
  if (!credential) {
    return;
  }
  if (credential.baseUrl) {
    form.visionBaseUrl.value = credential.baseUrl;
  }
  if (credential.model) {
    form.visionModel.value = credential.model;
  }
  if (credential.mode === "plain" && credential.apiKey) {
    form.visionApiKey.value = credential.apiKey;
    form.saveAiKey.checked = true;
    form.plainSaveAiKey.checked = true;
    syncAiSaveFields();
  } else if (credential.mode === "encrypted") {
    form.saveAiKey.checked = true;
    syncAiSaveFields();
  }
}

async function resolveAiApiKeyForTask(payload) {
  const apiKey = form.visionApiKey.value.trim();
  const password = form.visionPassword.value;
  await saveAiEndpointSettings(payload);
  if (apiKey) {
    if (form.saveAiKey.checked) {
      await saveAiCredential({
        apiKey,
        password,
        plainSave: form.plainSaveAiKey.checked,
        baseUrl: payload.visionBaseUrl,
        model: payload.visionModel
      });
    }
    return apiKey;
  }

  const result = await chrome.storage.local.get(AI_CREDENTIAL_KEY);
  const credential = result[AI_CREDENTIAL_KEY];
  if (!credential) {
    return "";
  }
  if (credential.mode === "plain") {
    await updateSavedAiEndpoint(credential, payload);
    return String(credential.apiKey || "").trim();
  }
  if (credential.mode === "encrypted") {
    const decrypted = await decryptSavedAiCredential(credential, password);
    await updateSavedAiEndpoint({ ...credential, attempts: 0 }, payload);
    return decrypted;
  }
  return "";
}

async function saveAiEndpointSettings(payload) {
  await chrome.storage.local.set({
    [AI_SETTINGS_KEY]: {
      baseUrl: payload.visionBaseUrl,
      model: payload.visionModel
    }
  });
}

async function updateSavedAiEndpoint(credential, payload) {
  await chrome.storage.local.set({
    [AI_CREDENTIAL_KEY]: {
      ...credential,
      baseUrl: payload.visionBaseUrl,
      model: payload.visionModel
    }
  });
  await saveAiEndpointSettings(payload);
}

async function saveAiCredential({ apiKey, password, plainSave, baseUrl, model }) {
  if (!plainSave) {
    validateSixAsciiPassword(password);
    const encrypted = await encryptWithPassword(apiKey, password);
    await chrome.storage.local.set({
      [AI_CREDENTIAL_KEY]: {
        mode: "encrypted",
        baseUrl,
        model,
        attempts: 0,
        ...encrypted
      }
    });
    return;
  }

  await chrome.storage.local.set({
    [AI_CREDENTIAL_KEY]: {
      mode: "plain",
      baseUrl,
      model,
      attempts: 0,
      apiKey
    }
  });
}

async function ensureAiHostPermission(baseUrl) {
  const origin = getOriginPermissionPattern(baseUrl);
  const hasPermission = await chrome.permissions.contains({ origins: [origin] });
  if (hasPermission) {
    return;
  }
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    throw new Error(`需要允许插件访问视觉模型域名：${origin}`);
  }
}

function getOriginPermissionPattern(baseUrl) {
  try {
    const normalized = normalizeVisionBaseUrl(baseUrl);
    const url = new URL(normalized);
    if (url.protocol !== "https:") {
      throw new Error("视觉模型 API Base URL 必须使用 https://。");
    }
    return `${url.origin}/*`;
  } catch (error) {
    throw new Error(error.message || "视觉模型 API Base URL 无效。");
  }
}

function normalizeVisionBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .replace(/\/chat\/completions$/i, "");
}

async function decryptSavedAiCredential(credential, password) {
  validateSixAsciiPassword(password);
  try {
    const key = await derivePasswordKey(password, base64ToArrayBuffer(credential.salt), ["decrypt"]);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArrayBuffer(credential.iv) },
      key,
      base64ToArrayBuffer(credential.ciphertext)
    );
    await chrome.storage.local.set({
      [AI_CREDENTIAL_KEY]: {
        ...credential,
        attempts: 0
      }
    });
    return new TextDecoder().decode(decrypted).trim();
  } catch {
    const attempts = Number(credential.attempts) + 1 || 1;
    if (attempts >= MAX_AI_PASSWORD_ATTEMPTS) {
      await chrome.storage.local.remove(AI_CREDENTIAL_KEY);
      form.visionApiKey.value = "";
      throw new Error("AI key 解密密码连续错误 5 次，已销毁本地保存的 API Key，请输入新的 API Key。");
    }
    await chrome.storage.local.set({
      [AI_CREDENTIAL_KEY]: {
        ...credential,
        attempts
      }
    });
    throw new Error(`AI key 解密密码错误，还剩 ${MAX_AI_PASSWORD_ATTEMPTS - attempts} 次。`);
  }
}

async function encryptWithPassword(apiKey, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePasswordKey(password, salt, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(apiKey)
  );
  return {
    algorithm: "PBKDF2-SHA256+AES-GCM",
    iterations: AI_PASSWORD_ITERATIONS,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(ciphertext)
  };
}

async function derivePasswordKey(password, salt, usages) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${password}${AI_PASSWORD_PEPPER}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: AI_PASSWORD_ITERATIONS,
      hash: "SHA-256"
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    usages
  );
}

function validateSixAsciiPassword(password) {
  if (!/^[\x20-\x7E]{6}$/.test(password || "")) {
    throw new Error("解密密码必须是 6 位 ASCII 字符。");
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToArrayBuffer(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

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

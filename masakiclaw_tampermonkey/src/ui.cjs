(function registerUiModule(root, factory) {
  const api = factory();
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createUiModule() {
  function createControlPanel({ onStart, onStop, onResume }) {
    const host = document.createElement("div"); host.id = "masakiclaw-userscript-host"; document.documentElement.append(host);
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `<style>${styles()}</style>
      <button id="claw" title="MasakiClaw" aria-label="打开 MasakiClaw"><img src="__MASAKICLAW_ICON_DATA_URI__" alt=""></button>
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

  function styles() { return `:host{all:initial}*{box-sizing:border-box}[hidden]{display:none!important}#claw{position:fixed;right:18px;bottom:18px;z-index:2147483646;width:48px;height:48px;padding:0;border:2px solid #fff;border-radius:50%;overflow:hidden;background:#111827;box-shadow:0 8px 28px #0004;cursor:pointer}#claw img{display:block;width:100%;height:100%;object-fit:cover}#panel{position:fixed;right:18px;bottom:76px;z-index:2147483647;width:min(390px,calc(100vw - 24px));max-height:calc(100vh - 96px);overflow:auto;padding:16px;border:1px solid #d1d5db;border-radius:14px;background:linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.92) 55%,rgba(255,255,255,.58) 100%),url("__MASAKICLAW_BACKGROUND_DATA_URI__") right -10px top 6px/240px 240px no-repeat,#f6f8fa;color:#111827;font:14px/1.4 system-ui;box-shadow:0 16px 48px #0005}header{display:flex;justify-content:space-between;align-items:center;font-size:18px}header button{border:0;background:none;font-size:24px;cursor:pointer}.hint{margin:3px 0 12px;color:#6b7280}label,fieldset{display:block;margin:9px 0}input,textarea,select{width:100%;margin-top:4px;padding:7px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1f2933;font:inherit}.check{display:flex;align-items:center;gap:7px}.check input,fieldset input{width:auto;margin:0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}fieldset{border:1px solid #e5e7eb;border-radius:8px;background:rgba(255,255,255,.72)}fieldset label{display:inline-flex;margin:4px 10px 4px 0;gap:4px}.actions{display:flex;gap:8px;margin-top:12px}.actions button,.notice button{padding:8px 12px;border:0;border-radius:8px;background:#1769aa;color:white;cursor:pointer}.secondary{background:#64748b!important}.notice{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:8px;background:rgba(254,243,199,.92)}progress{width:100%;margin-top:10px}pre{min-height:50px;max-height:150px;overflow:auto;white-space:pre-wrap;background:#111827;color:#d1fae5;padding:8px;border-radius:8px;font:12px/1.35 ui-monospace}`; }
  return { createControlPanel };
});

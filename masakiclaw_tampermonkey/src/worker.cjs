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

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

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

const test = require("node:test");
const assert = require("node:assert/strict");

const { createDedupeIndex } = require("../src/dedupe.cjs");

test("deduplication skips URL/content matches but only reports visual similarity", () => {
  const index = createDedupeIndex([{ originalUrl: "https://pic.zhimg.com/a_r.jpg", contentHash: "sha-a", perceptualHash: "0000000000000000", saved: true }]);

  assert.equal(index.claim({ originalUrl: "https://pic.zhimg.com/a.jpg" }).kind, "source_url");
  assert.equal(index.claim({ originalUrl: "https://pic.zhimg.com/b.jpg", contentHash: "sha-a" }).kind, "content_hash");
  const similar = index.claim({ originalUrl: "https://pic.zhimg.com/c.jpg", contentHash: "sha-c", perceptualHash: "0000000000000001" });
  assert.equal(similar.save, true);
  assert.equal(similar.kind, "visual_similarity");
});

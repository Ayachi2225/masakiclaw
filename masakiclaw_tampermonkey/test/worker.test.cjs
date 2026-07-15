const test = require("node:test");
const assert = require("node:assert/strict");

const { shapeCapture } = require("../src/worker.cjs");

test("Chrome collector results become a filtered target result without losing diagnostics", () => {
  const result = shapeCapture({
    pageUrl: "https://www.zhihu.com/question/1",
    pageTitle: "Question",
    capturedAt: "2026-01-01T00:00:00Z",
    scope: "comments",
    captureDebug: { roots: 2 },
    images: [
      { originalUrl: "https://pic.zhimg.com/photo.jpg" },
      { originalUrl: "https://pic.zhimg.com/sticker/party.png" }
    ]
  }, { scrolls: 3 });

  assert.equal(result.sourcePage, "https://www.zhihu.com/question/1");
  assert.deepEqual(result.captureDebug, { roots: 2 });
  assert.deepEqual(result.prepareStats, { scrolls: 3 });
  assert.deepEqual(result.images.map((image) => image.originalUrl), ["https://pic.zhimg.com/photo.jpg"]);
});

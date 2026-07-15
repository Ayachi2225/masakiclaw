const test = require("node:test");
const assert = require("node:assert/strict");

const { createCollectionJob, finishTarget, requestStop } = require("../src/job.cjs");

test("a collection job advances serially and preserves a failed target", () => {
  const started = createCollectionJob({ id: "job-1", mode: "batch", targets: ["https://example.test/1", "https://example.test/2"] });
  const afterSuccess = finishTarget(started, { status: "complete", images: [{ originalUrl: "https://img.test/1.jpg" }] });
  const afterFailure = finishTarget(afterSuccess, { status: "failed", error: "comments timed out", images: [] });

  assert.equal(afterFailure.status, "complete");
  assert.equal(afterFailure.cursor, 2);
  assert.equal(afterFailure.imageCount, 1);
  assert.equal(afterFailure.results[1].error, "comments timed out");
});

test("a stop request prevents the next target from becoming active", () => {
  const started = createCollectionJob({ id: "job-2", mode: "batch", targets: ["https://example.test/1", "https://example.test/2"] });
  const stopping = requestStop(started);
  const stopped = finishTarget(stopping, { status: "complete", images: [] });

  assert.equal(stopped.status, "stopped");
  assert.equal(stopped.cursor, 1);
});

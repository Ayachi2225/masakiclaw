const test = require("node:test");
const assert = require("node:assert/strict");

const values = new Map();
global.GM = {
  getValue: async (key, fallback) => values.has(key) ? values.get(key) : fallback,
  setValue: async (key, value) => { values.set(key, value); }
};
const {
  buildSimilarityReport,
  buildVolumeIndex,
  createArchiveWriter,
  getSimilarityReportFilename,
  getTaskImageFolderName
} = require("../src/archive.cjs");

test("directory archive writes a Chrome-compatible task once across recovery", async () => {
  values.clear();
  values.set("masakiclaw:dedupe-history", [{ originalUrl: "https://pic.zhimg.com/existing.jpg", status: "downloaded" }]);
  const directory = new MemoryDirectory();
  const writer = await createArchiveWriter({ directoryHandle: directory, options: {} });
  const result = { sourcePage: "https://www.zhihu.com/question/1", pageTitle: "Question", images: [{ originalUrl: "https://pic.zhimg.com/existing.jpg", originalName: "existing.jpg", thumbnailUrl: "", fallbackUrls: [] }] };
  const job = { id: "job", cursor: 0, mode: "current", createdAt: "2026-01-01T00:00:00Z" };

  await writer.writeTarget(result, job);
  await writer.writeTarget(result, job);
  await writer.complete(job);
  const index = JSON.parse(await directory.read("images.json"));

  assert.equal(index.tasks.length, 1);
  assert.equal(index.tasks[0].taskId, "job-0001");
  assert.equal(index.tasks[0].sourcePage, result.sourcePage);
  assert.equal(index.tasks[0].images[0].status, "skipped_duplicate");
  assert.equal(index.tasks[0].images[0].normalizedOriginalUrl, "https://pic.zhimg.com/existing.jpg");
  assert.equal(index.tasks[0].images[0].duplicate.matchedBy, "normalized_original_url");
  assert.equal(index.tasks[0].imageFolder, "2026-1-1");
  assert.equal(directory.files.has("task-job.log"), false);
});

test("each independent ZIP volume index references only files in that volume", () => {
  const source = { tasks: [{ taskId: "task", images: [
    { status: "downloaded", relativePath: "one/a.jpg" },
    { status: "downloaded", relativePath: "two/b.jpg" },
    { status: "skipped_duplicate", originalUrl: "duplicate" }
  ] }] };
  const first = buildVolumeIndex(source, [{ name: "one/a.jpg", data: new Uint8Array() }], true);
  const second = buildVolumeIndex(source, [{ name: "two/b.jpg", data: new Uint8Array() }], false);

  assert.deepEqual(first.tasks[0].images.map((image) => image.relativePath || image.originalUrl), ["one/a.jpg", "duplicate"]);
  assert.deepEqual(second.tasks[0].images.map((image) => image.relativePath), ["two/b.jpg"]);
});

test("ZIP archive omits logs and an empty similarity report", async () => {
  values.clear();
  let downloaded;
  const previousDocument = global.document;
  const previousCreate = URL.createObjectURL;
  global.document = { createElement: () => ({ click() {} }) };
  URL.createObjectURL = (blob) => { downloaded = blob; return "blob:test"; };
  try {
    const writer = await createArchiveWriter({ options: {} });
    const job = { id: "zip-job", cursor: 0, mode: "current", createdAt: "2026-01-01T00:00:00Z" };
    await writer.writeTarget({ sourcePage: "https://www.zhihu.com/question/1", images: [] }, job);
    const completed = await writer.complete(job);
    const binary = Buffer.from(await downloaded.arrayBuffer()).toString("latin1");
    assert.equal(completed.kind, "zip");
    assert.match(binary, /images\.json/);
    assert.doesNotMatch(binary, /\.log/);
    assert.doesNotMatch(binary, /\.md/);
  } finally {
    global.document = previousDocument;
    URL.createObjectURL = previousCreate;
  }
});

test("folder names match the Chromium date and content-type convention", () => {
  assert.equal(getTaskImageFolderName({
    sourcePage: "https://www.zhihu.com/question/1/answer/2",
    publishedAt: "2026-07-03T12:00:00Z"
  }), "2026-7-3_answer");
  assert.equal(getTaskImageFolderName({
    sourcePage: "https://zhuanlan.zhihu.com/p/123",
    capturedAt: "2026-07-04T12:00:00Z"
  }), "2026-7-4_post");
  assert.equal(getTaskImageFolderName({
    sourcePage: "https://www.zhihu.com/pin/123",
    publishedAt: "2026-07-05T12:00:00Z"
  }), "2026-7-5_pin");
});

test("similarity reports are only built for matches and have readable names", () => {
  assert.equal(buildSimilarityReport({ tasks: [{ images: [] }] }), "");
  const report = buildSimilarityReport({ tasks: [{ images: [{
    originalUrl: "https://pic.zhimg.com/a.jpg",
    duplicate: { matchedBy: "visual_similarity", matchedOriginalUrl: "https://pic.zhimg.com/b.jpg", similarity: 98 }
  }] }] });
  assert.match(report, /a\.jpg.*b\.jpg.*98%/);
  assert.equal(
    getSimilarityReportFilename({ id: "zip-job", updatedAt: "2026-07-23T12:34:56.000Z" }),
    "similar-2026-07-23_12-34-56-zip-job.md"
  );
});

class MemoryDirectory {
  constructor() { this.files = new Map(); this.directories = new Map(); }
  async getFileHandle(name, options = {}) {
    if (!this.files.has(name) && !options.create) { const error = new Error("missing"); error.name = "NotFoundError"; throw error; }
    if (!this.files.has(name)) this.files.set(name, new Blob([]));
    return {
      getFile: async () => this.files.get(name),
      createWritable: async () => ({ write: async (blob) => { this.files.set(name, blob instanceof Blob ? blob : new Blob([blob])); }, close: async () => {} })
    };
  }
  async getDirectoryHandle(name, options = {}) { if (!this.directories.has(name) && options.create) this.directories.set(name, new MemoryDirectory()); return this.directories.get(name); }
  async read(name) { return (await (await this.getFileHandle(name)).getFile()).text(); }
}

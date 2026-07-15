(function registerJobModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createJobModule() {
  function createCollectionJob({ id, mode, targets, options = {}, now = new Date().toISOString() }) {
    if (!id || !Array.isArray(targets) || targets.length === 0) throw new Error("Collection Job requires at least one target.");
    return {
      schemaVersion: 1,
      id,
      mode,
      status: "running",
      cursor: 0,
      targets: targets.map((url) => ({ url, status: "pending" })),
      results: [],
      imageCount: 0,
      stopRequested: false,
      options,
      createdAt: now,
      updatedAt: now
    };
  }

  function requestStop(job, now = new Date().toISOString()) {
    return { ...job, status: "stopping", stopRequested: true, updatedAt: now };
  }

  function finishTarget(job, result, now = new Date().toISOString()) {
    if (job.cursor >= job.targets.length) return job;
    const targets = job.targets.slice();
    targets[job.cursor] = { ...targets[job.cursor], status: result.status, error: result.error || "" };
    const results = job.results.concat({ ...result, targetUrl: targets[job.cursor].url });
    const cursor = job.cursor + 1;
    const status = job.stopRequested ? "stopped" : result.stopJob || cursor >= targets.length ? "complete" : "running";
    return {
      ...job,
      targets,
      results,
      cursor,
      status,
      imageCount: job.imageCount + (Array.isArray(result.images) ? result.images.length : 0),
      updatedAt: now
    };
  }

  return { createCollectionJob, finishTarget, requestStop };
});

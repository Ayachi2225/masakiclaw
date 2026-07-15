(function registerCoordinatorModule(root, factory) {
  const jobApi = typeof require === "function" ? require("./job.cjs") : root.MasakiClaw;
  const api = factory(jobApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createCoordinatorModule(jobApi) {
  function createCollectionCoordinator({ taskStore, targetRunner, onProgress = () => {} }) {
    async function run(job) {
      let current = job;
      while (current.status === "running" && current.cursor < current.targets.length) {
        const target = current.targets[current.cursor];
        let result;
        try {
          result = await targetRunner(target, current.options, current);
        } catch (error) {
          result = { status: "failed", error: error?.message || String(error), images: [] };
        }
        const latest = await taskStore.load();
        if (latest?.id === current.id && latest.cursor === current.cursor && latest.stopRequested) {
          current = { ...current, stopRequested: true, status: "stopping", updatedAt: latest.updatedAt };
        }
        current = jobApi.finishTarget(current, result);
        await taskStore.save(current);
        onProgress(current);
      }
      return current;
    }

    return {
      async start(input) {
        const job = jobApi.createCollectionJob(input);
        await taskStore.save(job);
        return run(job);
      },
      async resume() {
        const job = await taskStore.load();
        if (!job || !["running", "stopping"].includes(job.status)) throw new Error("没有可恢复的 Collection Job。");
        if (job.status === "stopping") {
          return run({ ...job, status: "running", stopRequested: true, updatedAt: new Date().toISOString() });
        }
        return run(job);
      },
      async stop() {
        const job = await taskStore.load();
        if (!job || job.status !== "running") return job;
        const stopping = jobApi.requestStop(job);
        await taskStore.save(stopping);
        return stopping;
      }
    };
  }

  return { createCollectionCoordinator };
});

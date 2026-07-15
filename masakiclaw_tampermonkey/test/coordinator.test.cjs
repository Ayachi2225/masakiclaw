const test = require("node:test");
const assert = require("node:assert/strict");

const { createCollectionCoordinator } = require("../src/coordinator.cjs");

test("the coordinator checkpoints every serial target and can resume", async () => {
  let saved;
  let interruptOnce = true;
  const visited = [];
  const coordinator = createCollectionCoordinator({
    taskStore: {
      load: async () => saved,
      save: async (job) => {
        saved = structuredClone(job);
        if (saved.cursor === 1 && interruptOnce) {
          interruptOnce = false;
          throw new Error("controller reloaded");
        }
      }
    },
    targetRunner: async (target) => { visited.push(target.url); return { status: "complete", images: [{ originalUrl: `${target.url}/image.jpg` }] }; }
  });

  await assert.rejects(coordinator.start({ id: "job", mode: "batch", targets: ["https://one.test", "https://two.test"] }), /controller reloaded/);
  assert.equal(saved.cursor, 1);
  assert.equal(saved.status, "running");

  await coordinator.resume();
  assert.equal(saved.status, "complete");
  assert.deepEqual(visited, ["https://one.test", "https://two.test"]);
});

test("a concurrent stop request is observed after the active target", async () => {
  let saved;
  let release;
  const active = new Promise((resolve) => { release = resolve; });
  const coordinator = createCollectionCoordinator({
    taskStore: { load: async () => saved, save: async (job) => { saved = structuredClone(job); } },
    targetRunner: async () => { await active; return { status: "complete", images: [] }; }
  });
  const running = coordinator.start({ id: "job-stop", mode: "batch", targets: ["https://one.test", "https://two.test"] });
  await new Promise((resolve) => setImmediate(resolve));
  await coordinator.stop();
  release();
  const result = await running;

  assert.equal(result.status, "stopped");
  assert.equal(result.cursor, 1);
});

test("resuming a stopping checkpoint finishes its current atomic target and then stops", async () => {
  let saved = { id: "stopping", status: "stopping", stopRequested: true, cursor: 1, targets: [{ url: "one" }, { url: "two" }], results: [] };
  let runs = 0;
  const coordinator = createCollectionCoordinator({
    taskStore: { load: async () => saved, save: async (job) => { saved = job; } },
    targetRunner: async () => { runs += 1; return { status: "complete", images: [] }; }
  });

  const result = await coordinator.resume();
  assert.equal(result.status, "stopped");
  assert.equal(result.cursor, 2);
  assert.equal(runs, 1);
});

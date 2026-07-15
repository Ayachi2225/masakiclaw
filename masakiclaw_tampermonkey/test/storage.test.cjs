const test = require("node:test");
const assert = require("node:assert/strict");

const { createTaskStore } = require("../src/storage.cjs");

test("task store persists and clears a Collection Checkpoint through its adapter", async () => {
  const values = new Map();
  const store = createTaskStore({
    get: async (key, fallback) => values.has(key) ? values.get(key) : fallback,
    set: async (key, value) => { values.set(key, value); },
    delete: async (key) => { values.delete(key); }
  });
  const checkpoint = { id: "job", status: "running", cursor: 1 };

  await store.save(checkpoint);
  assert.deepEqual(await store.load(), checkpoint);
  await store.clear();
  assert.equal(await store.load(), null);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const { validatePassword } = require("../src/credentials.cjs");

test("AI credential password retains the six-character ASCII contract", () => {
  assert.doesNotThrow(() => validatePassword("aB3! x"));
  assert.throws(() => validatePassword("short"), /6 位 ASCII/);
  assert.throws(() => validatePassword("密码1234"), /6 位 ASCII/);
});

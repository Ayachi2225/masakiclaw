const test = require("node:test");
const assert = require("node:assert/strict");

const { createZip } = require("../src/zip.cjs");

test("a packaged archive contains its files and a ZIP central directory", () => {
  const bytes = createZip([
    { name: "images.json", data: new TextEncoder().encode('{"tasks":[]}') },
    { name: "images/photo.jpg", data: new Uint8Array([1, 2, 3]) }
  ]);
  const binary = Buffer.from(bytes);

  assert.equal(binary.readUInt32LE(0), 0x04034b50);
  assert.match(binary.toString("latin1"), /images\.json/);
  assert.match(binary.toString("latin1"), /images\/photo\.jpg/);
  assert.notEqual(binary.indexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])), -1);
});

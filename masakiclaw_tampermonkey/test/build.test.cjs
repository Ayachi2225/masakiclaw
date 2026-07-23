const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("the built userscript embeds the extension icon in metadata and the floating button", () => {
  const root = path.resolve(__dirname, "..");
  execFileSync(process.execPath, [path.join(root, "scripts", "build.cjs")]);

  const output = fs.readFileSync(path.join(root, "masakiclaw.user.js"), "utf8");
  const iconMatches = output.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) || [];

  assert.ok(output.includes("// @icon         data:image/png;base64,"));
  assert.ok(output.includes('<button id="claw" title="MasakiClaw" aria-label="打开 MasakiClaw"><img src="data:image/png;base64,'));
  assert.ok(iconMatches.length >= 2);
  assert.ok(!output.includes("__MASAKICLAW_ICON_DATA_URI__"));
});

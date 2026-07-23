const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const repository = path.resolve(root, "..");
const iconPath = path.join(repository, "masakiclaw_chrome", "icons", "icon-128.png");
const iconDataUri = `data:image/png;base64,${fs.readFileSync(iconPath).toString("base64")}`;
const backgroundPath = path.join(repository, "masakiclaw_chrome", "masaki.png");
const backgroundDataUri = `data:image/png;base64,${fs.readFileSync(backgroundPath).toString("base64")}`;
const header = `// ==UserScript==
// @name         MasakiClaw
// @namespace    https://github.com/Ayachi2225/masakiclaw
// @version      0.1.0
// @description  Collect Zhihu comment images into a structured local archive.
// @icon         ${iconDataUri}
// @match        https://www.zhihu.com/*
// @match        https://zhuanlan.zhihu.com/*
// @run-at       document-idle
// @connect      *
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_openInTab
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @grant        window.focus
// ==/UserScript==
`;
const modules = ["job.cjs", "domain.cjs", "dedupe.cjs", "zip.cjs", "coordinator.cjs", "storage.cjs", "credentials.cjs", "archive.cjs", "ui.cjs"];
const parts = [
  header,
  ...modules.map((name) => fs.readFileSync(path.join(root, "src", name), "utf8")),
  fs.readFileSync(path.join(repository, "masakiclaw_chrome", "content-script.js"), "utf8"),
  fs.readFileSync(path.join(root, "src", "worker.cjs"), "utf8"),
  fs.readFileSync(path.join(root, "src", "main.cjs"), "utf8")
];
const output = parts.join("\n\n")
  .replaceAll("__MASAKICLAW_ICON_DATA_URI__", iconDataUri)
  .replaceAll("__MASAKICLAW_BACKGROUND_DATA_URI__", backgroundDataUri);
fs.writeFileSync(path.join(root, "masakiclaw.user.js"), output);

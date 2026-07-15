(function registerCredentialModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createCredentialModule() {
  const CREDENTIAL_KEY = "masakiclaw:ai-credential";
  const ITERATIONS = 210000;
  const PEPPER = "MasakiClaw::local-ai-key::v1";

  function validatePassword(password) {
    if (!/^[\x20-\x7e]{6}$/.test(password || "")) throw new Error("AI Key 密码必须是 6 位 ASCII 字符。");
  }

  async function resolveCredential({ apiKey, password, saveKey, plainSave, baseUrl, model }) {
    const entered = String(apiKey || "").trim();
    if (entered) {
      if (saveKey) await saveCredential({ apiKey: entered, password, plainSave, baseUrl, model });
      return entered;
    }
    const saved = await GM.getValue(CREDENTIAL_KEY, null);
    if (!saved) return "";
    if (saved.mode === "plain") return String(saved.apiKey || "").trim();
    validatePassword(password);
    try {
      const key = await derive(password, fromBase64(saved.salt), ["decrypt"]);
      const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(saved.iv) }, key, fromBase64(saved.ciphertext));
      await GM.setValue(CREDENTIAL_KEY, { ...saved, attempts: 0, baseUrl, model });
      return new TextDecoder().decode(clear).trim();
    } catch {
      const attempts = Number(saved.attempts || 0) + 1;
      if (attempts >= 5) { await GM.deleteValue(CREDENTIAL_KEY); throw new Error("密码连续错误 5 次，已删除保存的 API Key。"); }
      await GM.setValue(CREDENTIAL_KEY, { ...saved, attempts });
      throw new Error(`AI Key 密码错误，还剩 ${5 - attempts} 次。`);
    }
  }

  async function saveCredential({ apiKey, password, plainSave, baseUrl, model }) {
    if (plainSave) return GM.setValue(CREDENTIAL_KEY, { mode: "plain", apiKey, baseUrl, model, attempts: 0 });
    validatePassword(password);
    const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await derive(password, salt, ["encrypt"]);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(apiKey));
    return GM.setValue(CREDENTIAL_KEY, { mode: "encrypted", algorithm: "PBKDF2-SHA256+AES-GCM", iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(ciphertext), baseUrl, model, attempts: 0 });
  }
  async function derive(password, salt, usages) { const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${password}${PEPPER}`), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, usages); }
  function toBase64(value) { let binary = ""; for (const byte of new Uint8Array(value.buffer || value)) binary += String.fromCharCode(byte); return btoa(binary); }
  function fromBase64(value) { const binary = atob(value); return Uint8Array.from(binary, (char) => char.charCodeAt(0)); }
  return { resolveCredential, saveCredential, validatePassword };
});

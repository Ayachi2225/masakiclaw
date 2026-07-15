(function registerZipModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MasakiClaw = Object.assign(root.MasakiClaw || {}, api);
})(typeof globalThis === "object" ? globalThis : this, function createZipModule() {
  const encoder = new TextEncoder();
  const crcTable = buildCrcTable();

  function createZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    for (const file of files) {
      const name = encoder.encode(String(file.name).replace(/^\/+/, ""));
      const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data || ""));
      const crc = crc32(data);
      const local = header(30 + name.length);
      write32(local, 0, 0x04034b50); write16(local, 4, 20); write16(local, 6, 0x0800);
      write16(local, 8, 0); write32(local, 14, crc); write32(local, 18, data.length); write32(local, 22, data.length);
      write16(local, 26, name.length); local.set(name, 30);
      localParts.push(local, data);

      const central = header(46 + name.length);
      write32(central, 0, 0x02014b50); write16(central, 4, 20); write16(central, 6, 20); write16(central, 8, 0x0800);
      write16(central, 10, 0); write32(central, 16, crc); write32(central, 20, data.length); write32(central, 24, data.length);
      write16(central, 28, name.length); write32(central, 42, offset); central.set(name, 46);
      centralParts.push(central);
      offset += local.length + data.length;
    }
    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = header(22);
    write32(end, 0, 0x06054b50); write16(end, 8, files.length); write16(end, 10, files.length);
    write32(end, 12, centralSize); write32(end, 16, centralOffset);
    return concat(localParts.concat(centralParts, end));
  }

  function header(size) { return new Uint8Array(size); }
  function write16(bytes, offset, value) { new DataView(bytes.buffer).setUint16(offset, value, true); }
  function write32(bytes, offset, value) { new DataView(bytes.buffer).setUint32(offset, value >>> 0, true); }
  function concat(parts) {
    const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) { output.set(part, offset); offset += part.length; }
    return output;
  }
  function buildCrcTable() {
    return Array.from({ length: 256 }, (_, index) => {
      let crc = index;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
      return crc >>> 0;
    });
  }
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  return { createZip };
});

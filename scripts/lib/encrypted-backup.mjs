import { createCipheriv, createDecipheriv, randomBytes, randomUUID, scrypt } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { link, lstat, open, rm } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import path from "node:path";

const derive = promisify(scrypt), magic = Buffer.from("LKBACK01"), headerSize = 36, tagSize = 16;
export function validateBackupPassphrase(value) {
  if (typeof value !== "string" || value.length < 24 || value.length > 1024 || new Set(value).size < 10 || /change.this|your_|replace|example/i.test(value)) throw new Error("BACKUP_PASSPHRASE_REQUIRED");
}
async function keyFor(passphrase, salt) {
  validateBackupPassphrase(passphrase);
  return derive(passphrase, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}
async function absent(file) {
  try { await lstat(file); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  throw new Error("BACKUP_TARGET_EXISTS");
}
async function transform(source, target, passphrase, decrypt) {
  validateBackupPassphrase(passphrase);
  const input = path.resolve(source), output = path.resolve(target);
  if (input === output) throw new Error("BACKUP_TARGET_EQUALS_SOURCE");
  const info = await lstat(input);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error("BACKUP_SOURCE_NOT_REGULAR");
  if (!decrypt && info.size === 0) throw new Error("BACKUP_SOURCE_EMPTY");
  await absent(output);
  let header, tag;
  if (decrypt) {
    if (info.size <= headerSize + tagSize) throw new Error("INVALID_ENCRYPTED_BACKUP");
    const handle = await open(input, "r");
    try {
      header = Buffer.alloc(headerSize); tag = Buffer.alloc(tagSize);
      await handle.read(header, 0, headerSize, 0); await handle.read(tag, 0, tagSize, info.size - tagSize);
    } finally { await handle.close(); }
    if (!header.subarray(0, 8).equals(magic)) throw new Error("INVALID_ENCRYPTED_BACKUP");
  } else header = Buffer.concat([magic, randomBytes(16), randomBytes(12)]);
  const key = await keyFor(passphrase, header.subarray(8, 24));
  const temporary = `${output}.${randomUUID()}.partial`;
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    const cipher = decrypt ? createDecipheriv("aes-256-gcm", key, header.subarray(24)) : createCipheriv("aes-256-gcm", key, header.subarray(24));
    cipher.setAAD(header); if (decrypt) cipher.setAuthTag(tag);
    if (!decrypt) await handle.write(header);
    const read = createReadStream(input, decrypt ? { start: headerSize, end: info.size - tagSize - 1 } : {});
    const write = createWriteStream(temporary, { fd: handle.fd, autoClose: false, start: decrypt ? 0 : headerSize });
    await pipeline(read, cipher, write);
    if (!decrypt) {
      const result = await handle.stat(); await handle.write(cipher.getAuthTag(), 0, tagSize, result.size);
    }
    await handle.sync(); await handle.close(); handle = null;
    // Publish only authenticated complete data; hard-link is exclusive (no overwrite race).
    await link(temporary, output);
    return { format: "LKBACK01", bytes: (await lstat(output)).size, authenticated: true };
  } catch {
    throw new Error(decrypt ? "BACKUP_DECRYPT_FAILED" : "BACKUP_ENCRYPT_FAILED");
  } finally {
    key.fill(0); if (handle) await handle.close().catch(() => {});
    await rm(temporary, { force: true });
  }
}
export const encryptBackup = (source, target, passphrase) => transform(source, target, passphrase, false);
export const decryptBackup = (source, target, passphrase) => transform(source, target, passphrase, true);

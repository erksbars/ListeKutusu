import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { encryptBackup, decryptBackup, validateBackupPassphrase } from "../scripts/lib/encrypted-backup.mjs";

test("şifreli yedek: doğrulanmış roundtrip, yeni salt/IV, kaynak ve mevcut hedef koruması", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "lk-encrypted-test-")), phrase = randomBytes(32).toString("hex");
  try {
    const source = path.join(directory, "source.db"), encrypted = path.join(directory, "first.lkbackup"), second = path.join(directory, "second.lkbackup"), restored = path.join(directory, "restored.db");
    const bytes = Buffer.concat([Buffer.from("SQLite format 3\0"), randomBytes(96_000), Buffer.from("Şifreli Türkçe sentetik içerik")]);
    await writeFile(source, bytes);
    const result = await encryptBackup(source, encrypted, phrase); assert.equal(result.authenticated, true);
    assert.equal((await readFile(encrypted)).includes(Buffer.from("Şifreli Türkçe")), false);
    await encryptBackup(source, second, phrase); assert.notDeepEqual(await readFile(encrypted), await readFile(second));
    await decryptBackup(encrypted, restored, phrase); assert.deepEqual(await readFile(restored), bytes);
    await assert.rejects(encryptBackup(source, encrypted, phrase), /TARGET_EXISTS/);
    await assert.rejects(decryptBackup(encrypted, restored, phrase), /TARGET_EXISTS/);
    await assert.rejects(encryptBackup(source, source, phrase), /EQUALS_SOURCE/);
    assert.deepEqual(await readFile(source), bytes); assert.deepEqual(await readFile(restored), bytes);
    assert.equal((await readdir(directory)).some(name => name.endsWith(".partial")), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("bozuk başlık/veri/tag, yanlış parola ve kesik yedek plaintext hedef yayımlamaz", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "lk-auth-test-")), phrase = randomBytes(32).toString("hex");
  try {
    const source = path.join(directory, "source.db"), encrypted = path.join(directory, "backup.lkbackup");
    await writeFile(source, randomBytes(8192)); await encryptBackup(source, encrypted, phrase);
    const bytes = await readFile(encrypted);
    const variants = [bytes.subarray(0, 20), bytes.subarray(0, bytes.length - 1)];
    for (const index of [0, 8, 24, 40, bytes.length - 1]) { const corrupt = Buffer.from(bytes); corrupt[index] ^= 1; variants.push(corrupt); }
    for (const [index, variant] of variants.entries()) {
      const file = path.join(directory, `corrupt-${index}.lkbackup`), output = path.join(directory, `rejected-${index}.db`);
      await writeFile(file, variant); await assert.rejects(decryptBackup(file, output, phrase));
      assert.equal((await readdir(directory)).includes(path.basename(output)), false);
    }
    await assert.rejects(decryptBackup(encrypted, path.join(directory, "wrong.db"), randomBytes(32).toString("hex")), /DECRYPT_FAILED/);
    assert.equal((await readdir(directory)).some(name => name.endsWith(".partial") || name === "wrong.db"), false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("yedek parolası eksik, örnek veya basitse reddedilir", () => {
  for (const value of [undefined, "short", "a".repeat(64), "change_this_example_backup_passphrase_123456"]) assert.throws(() => validateBackupPassphrase(value), /PASSPHRASE_REQUIRED/);
  assert.doesNotThrow(() => validateBackupPassphrase(randomBytes(32).toString("hex")));
});

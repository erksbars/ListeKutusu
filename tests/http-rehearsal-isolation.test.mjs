import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { assertRehearsalDirectory, copyRehearsalSource, createRehearsalDirectory, rehearsalEnvironment, removeRehearsalDirectory } from "../scripts/lib/http-rehearsal-isolation.mjs";

test("HTTP prova ortamı sırları, DB hedeflerini ve Node enjeksiyon seçeneklerini devralmaz", () => {
  const env = rehearsalEnvironment({ Path: "runtime-path", SystemRoot: "system-root", DATABASE_URL: "live-secret", APP_URL: "https://live.example", SESSION_SECRET: "live-session", ADMIN_LOGIN_KEY: "live-key", SPOTIFY_CLIENT_SECRET: "provider-secret", NODE_OPTIONS: "--import=unsafe", NODE_ENV: "production", HTTP_PROXY: "unsafe-proxy", EVENT_WORKER_HEALTH_DIR: "live-heartbeat" });
  assert.equal(env.Path, "runtime-path"); assert.equal(env.SystemRoot, "system-root");
  assert.equal(env.NODE_ENV, "development"); assert.equal(env.MEDIA_CATALOG_ENABLED, "false");
  for (const key of ["DATABASE_URL", "APP_URL", "SPOTIFY_CLIENT_SECRET", "NODE_OPTIONS", "HTTP_PROXY", "EVENT_WORKER_HEALTH_DIR"]) assert.equal(env[key], undefined);
  assert.equal(env.SESSION_SECRET.length, 64); assert.equal(env.ADMIN_LOGIN_KEY.length, 48);
  assert.notEqual(env.SESSION_SECRET, rehearsalEnvironment({}).SESSION_SECRET);
  assert.equal(JSON.stringify(env).includes("live-"), false);
});

test("prova kopyası yalnız kaynak whitelist'ini alır; temizleme kesin sınırı korur", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "http-probe-test-"));
  try {
    for (const name of ["package.json", "tsconfig.json", "next.config.mjs", "middleware.ts", "postcss.config.js", "tailwind.config.ts"]) await writeFile(path.join(root, name), "fixture");
    for (const name of ["app", "lib", "types"]) await mkdir(path.join(root, name));
    await writeFile(path.join(root, "app", "page.tsx"), "kaynak");
    for (const name of [".env", ".env.private.json", "live.db", "private.log"]) { await writeFile(path.join(root, name), "private"); await writeFile(path.join(root, "lib", name), "private"); }
    const directory = await createRehearsalDirectory(root);
    await copyRehearsalSource(root, directory);
    assert.equal(await readFile(path.join(directory, "app", "page.tsx"), "utf8"), "kaynak");
    assert.deepEqual(await readdir(path.join(directory, "lib")), []);
    assert.equal((await readdir(directory)).includes(".env"), false);
    for (const target of [root, path.join(root, "tmp"), path.join(root, "tmp", "other"), path.join(root, "tmp", "nested", "http-rehearsal-test")]) await assert.rejects(removeRehearsalDirectory(target, root), /UNSAFE_REHEARSAL_DIRECTORY/);
    await removeRehearsalDirectory(directory, root);
    assert.equal(await readFile(path.join(root, "live.db"), "utf8"), "private");
    assert.deepEqual(await readdir(path.join(root, "tmp")), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("junction/symlink tmp hedefi oluşturma ve silmeden önce reddedilir", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "http-probe-link-")), outside = await mkdtemp(path.join(tmpdir(), "http-probe-outside-"));
  try {
    await writeFile(path.join(outside, "keep.txt"), "koru");
    await symlink(outside, path.join(root, "tmp"), process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(createRehearsalDirectory(root), /UNSAFE_REHEARSAL_DIRECTORY/);
    assert.deepEqual(await readdir(outside), ["keep.txt"]);
    await rm(path.join(root, "tmp"));
    const directory = await createRehearsalDirectory(root);
    await removeRehearsalDirectory(directory, root);
    const target = path.join(root, "tmp", "http-rehearsal-link");
    await symlink(outside, target, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(assertRehearsalDirectory(target, root), /UNSAFE_REHEARSAL_DIRECTORY/);
    await rm(target);
    assert.equal(await readFile(path.join(outside, "keep.txt"), "utf8"), "koru");
  } finally { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});

test("HTTP prova CLI canlı URL/DB seçeneklerini işlem başlamadan reddeder", () => {
  const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", "scripts/rehearse-http-worker.mjs", "--url=https://private-secret.example"], { encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 1); assert.equal(result.stdout, "");
  assert.match(result.stderr, /kabul etmez/); assert.equal(result.stderr.includes("private-secret"), false);
});

test("kurtarma CLI kullanıcı DB veya URL hedefi almaz", () => {
  for (const flag of ["--backup", "--url", "--database"]) {
    const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", "scripts/rehearse-http-recovery.mjs", flag, "private-sentinel"], { encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 1); assert.equal(result.stdout, "");
    assert.match(result.stderr, /kabul etmez/); assert.equal(result.stderr.includes("private-sentinel"), false);
  }
});

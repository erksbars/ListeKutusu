import assert from "node:assert/strict";
import test from "node:test";
import { checkEnvironment } from "../scripts/lib/environment-check.mjs";
const configured = () => ({ SESSION_SECRET: "m9N4yL1dQr8A6sF2wX0cP7zV5kB3uH9e", ADMIN_LOGIN_KEY: "R7v0aL2qW8x1eP6z", SPOTIFY_CLIENT_ID: "configured-client-id", SPOTIFY_CLIENT_SECRET: "configured-client-secret", APP_URL: "https://pilot.example.org", SPOTIFY_REDIRECT_URI: "https://pilot.example.org/api/auth/callback", DATABASE_URL: "file:./dev.db", MEDIA_CATALOG_ENABLED: "false" });
const codes = result => result.errors.map(item => item.code);

test("production kontrolünde development NODE_ENV sessizce kabul edilmez", () => {
  assert.ok(codes(checkEnvironment({ ...configured(), NODE_ENV: "development" }, true)).includes("NODE_ENV_MISMATCH"));
  assert.equal(checkEnvironment({ ...configured(), NODE_ENV: "production" }, true).errors.length, 0);
  assert.equal(checkEnvironment({ ...configured(), NODE_ENV: "development" }).errors.length, 0);
});

test("ortam doğrulama saftır; yapılandırılmış development geçer", () => {
  const env = configured(), before = structuredClone(env); assert.equal(checkEnvironment(env).errors.length, 0); assert.deepEqual(env, before);
  assert.equal(checkEnvironment(env, true).warnings[0].code, "SQLITE_OPERATIONS_REQUIRED"); assert.equal(checkEnvironment(env, true).errors.length, 0);
});
test("kısa/örnek/tekrarlı sır dev uyarısı ve production hatasıdır; aynı sır yasak", () => {
  for (const value of ["", "change_this_long_sample_secret_for_testing", "a".repeat(64), "local-development-session-secret-change-before-deploy"]) {
    const env = { ...configured(), SESSION_SECRET: value }; assert.ok(checkEnvironment(env).warnings.some(item => item.code === "WEAK_SECRET")); assert.ok(codes(checkEnvironment(env, true)).includes("WEAK_SECRET"));
  }
  const env = configured(); env.ADMIN_LOGIN_KEY = env.SESSION_SECRET; assert.ok(codes(checkEnvironment(env)).includes("REUSED_SECRET"));
});
test("HTTP(S), origin ve callback: kimlik bilgisi/query/hash/path kabul edilmez", () => {
  for (const APP_URL of ["file:///tmp/private", "ftp://pilot.example.org", "javascript:secret", "https://private:password@pilot.example.org", "https://pilot.example.org/path", "https://pilot.example.org/?secret=token", "https://pilot.example.org/#token"]) assert.ok(codes(checkEnvironment({ ...configured(), APP_URL })).includes("INVALID_URL"));
  for (const uri of ["https://pilot.example.org/wrong", "https://user:password@pilot.example.org/api/auth/callback", "https://pilot.example.org/api/auth/callback?token=private"]) assert.ok(codes(checkEnvironment({ ...configured(), SPOTIFY_REDIRECT_URI: uri })).includes("INVALID_URL"));
  assert.ok(codes(checkEnvironment({ ...configured(), SPOTIFY_REDIRECT_URI: "https://other.example.org/api/auth/callback" }, true)).includes("ORIGIN_MISMATCH"));
});
test("production yerel/özel HTTPS adresini de reddeder; development HTTP kalır", () => {
  for (const host of ["localhost", "localhost.", "host.local", "127.0.0.1", "127.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.1.1", "0.0.0.0", "[::1]", "[::]", "[fc00::1]", "[fe80::1]", "[::ffff:127.0.0.1]"]) assert.ok(codes(checkEnvironment({ ...configured(), APP_URL: `https://${host}` }, true)).includes("PUBLIC_HTTPS_REQUIRED"), host);
  assert.equal(checkEnvironment({ ...configured(), APP_URL: "http://127.0.0.1:3000", SPOTIFY_REDIRECT_URI: "http://127.0.0.1:3000/api/auth/callback" }).errors.length, 0);
});
test("mevcut SQLite şeması, limit ve bakım aralığı açıkça doğrulanır", () => {
  for (const DATABASE_URL of ["", "postgres://private:secret@host/db", "file:./db?secret=x", "file://remote/share"]) assert.ok(codes(checkEnvironment({ ...configured(), DATABASE_URL })).includes("SQLITE_URL_REQUIRED"));
  for (const MANAGED_PLAYLIST_LIMIT of ["0", "10001", "1e3", "1.5"]) assert.ok(codes(checkEnvironment({ ...configured(), MANAGED_PLAYLIST_LIMIT })).includes("INVALID_PLAYLIST_LIMIT"));
  for (const GAME_MAINTENANCE_INTERVAL_MS of ["4999", "NaN", "-1", "1e4"]) assert.ok(codes(checkEnvironment({ ...configured(), GAME_MAINTENANCE_INTERVAL_MS })).includes("INVALID_GAME_INTERVAL"));
});
test("katalog flag'i ve açık kitap kataloğu iletişimi koşullu doğrulanır", () => {
  assert.ok(codes(checkEnvironment({ ...configured(), MEDIA_CATALOG_ENABLED: "yes" })).includes("INVALID_CATALOG_FLAG"));
  for (const contact of ["", "not-an-email", "a@example.org\r\nInjected: bad", "your_operator@example.org"]) assert.ok(codes(checkEnvironment({ ...configured(), MEDIA_CATALOG_ENABLED: "true", OPEN_LIBRARY_CONTACT: contact })).includes("CATALOG_CONTACT_REQUIRED"));
  assert.equal(checkEnvironment({ ...configured(), MEDIA_CATALOG_ENABLED: "true", OPEN_LIBRARY_CONTACT: "operator@example.org" }).errors.length, 0);
});
test("hata/uyarı çıktısı sır, URL, DB parolası ve e-postayı içermez", () => {
  const markers = ["PRIVATE_SECRET_MARKER_92", "PRIVATE_CONTACT_MARKER@example.org", "private-url.example.org", "PRIVATE_DB_PASSWORD"];
  const env = { ...configured(), SESSION_SECRET: markers[0], ADMIN_LOGIN_KEY: markers[0], APP_URL: `ftp://${markers[2]}/?secret=${markers[0]}`, DATABASE_URL: `postgres://operator:${markers[3]}@host/db`, MEDIA_CATALOG_ENABLED: "true", OPEN_LIBRARY_CONTACT: `invalid-${markers[1]}\n` + "header" };
  const text = JSON.stringify(checkEnvironment(env, true)); for (const marker of markers) assert.ok(!text.includes(marker));
});

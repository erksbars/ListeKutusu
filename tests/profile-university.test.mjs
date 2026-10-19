import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { changedUniversity, parseUniversityUpdate, publicUniversity, universityDraft } from "../lib/profileUniversity.ts";

test("üniversite isteğe bağlı, eski istemci alan göndermeyince veri korunur", () => {
  assert.deepEqual(parseUniversityUpdate(undefined), { ok: true, data: undefined });
  assert.deepEqual(universityDraft(null), { name: "", public: false });
  assert.deepEqual(parseUniversityUpdate({ name: "", public: true }), { ok: true, data: { universityName: null, universityPublic: false } });
  assert.deepEqual(parseUniversityUpdate({ name: "   ", public: false }), { ok: true, data: { universityName: null, universityPublic: false } });
});
test("Türkçe adlar, boşluk ve Unicode normalizasyonu", () => {
  assert.deepEqual(parseUniversityUpdate({ name: "  Örnek   Test Üniversitesi  ", public: true }), { ok: true, data: { universityName: "Örnek Test Üniversitesi", universityPublic: true } });
  assert.equal(parseUniversityUpdate({ name: "U\u0308niversite", public: false }).data.universityName, "Üniversite");
  assert.equal(parseUniversityUpdate({ name: "Ü".repeat(120), public: false }).ok, true);
});
test("üniversiteye dokunmadan profil kaydetmek eski görünürlük tercihini tekrar yazmaz", () => {
  const saved = { universityName: "Örnek Üniversite", universityPublic: true };
  assert.equal(changedUniversity(universityDraft(saved), saved), undefined);
  assert.equal(changedUniversity(undefined, saved), undefined);
  assert.deepEqual(changedUniversity({ name: saved.universityName, public: false }, saved), { name: saved.universityName, public: false });
});
test("görünürlük açık boolean olmalı; uzun/hatalı/çok satırlı ad reddedilir", () => {
  for (const value of [null, [], "Okul", {}, { name: "Örnek", public: "true" }, { name: "Örnek" }, { name: null, public: false }, { name: "Ö", public: true }, { name: "Ü".repeat(121), public: true }, { name: "Örnek\nÜniversitesi", public: false }, { name: "Örnek\u0000", public: true }]) assert.equal(parseUniversityUpdate(value).ok, false);
});
test("gizli veya engellenmiş üniversite kamu projeksiyonuna çıkmaz", () => {
  const profile = { universityName: "Örnek Üniversite", universityPublic: false };
  assert.equal(publicUniversity(profile), null);
  assert.equal(publicUniversity({ ...profile, universityPublic: true }), profile.universityName);
  assert.equal(publicUniversity({ ...profile, universityPublic: true }, true), null);
  assert.equal(publicUniversity({ universityName: "Ad var, izin yok" }), null);
  assert.equal(publicUniversity({ universityPublic: true }), null);
});
test("migration eski profili değiştirmez, varsayılan görünürlük kapalıdır", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-university-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    const folders = (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort();
    for (const folder of folders) {
      if (folder === "20261015160000_profile_university") await db.$executeRawUnsafe(`INSERT INTO "UserList" ("id", "ownerName", "slug", "bio", "updatedAt") VALUES ('legacy-university', 'Eski Profil', 'legacy-university', 'Korunan açıklama', CURRENT_TIMESTAMP)`);
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    const row = await db.userList.findUniqueOrThrow({ where: { id: "legacy-university" } });
    assert.equal(row.bio, "Korunan açıklama"); assert.equal(row.universityName, null); assert.equal(row.universityPublic, false);
    const saved = parseUniversityUpdate({ name: "Örnek Üniversite", public: false });
    await db.userList.update({ where: { id: row.id }, data: saved.data });
    assert.equal(publicUniversity(await db.userList.findUniqueOrThrow({ where: { id: row.id } })), null);
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});

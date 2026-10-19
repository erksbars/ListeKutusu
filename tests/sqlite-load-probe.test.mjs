import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { latencySummary, runBounded, probeSqliteLoad } from "../scripts/lib/sqlite-load-probe.mjs";

test("yük ölçümü yüzdelikleri ve eşzamanlılık sınırı", async () => {
  assert.deepEqual(latencySummary([]), { count: 0, p50Ms: null, p95Ms: null, maxMs: null });
  const values = [5, 1, 4, 2, 3]; assert.deepEqual(latencySummary(values), { count: 5, p50Ms: 3, p95Ms: 5, maxMs: 5 }); assert.equal(values[0], 5);
  let active = 0, maximum = 0, completed = 0;
  await runBounded(Array.from({ length: 20 }, () => async () => { active++; maximum = Math.max(maximum, active); await new Promise(resolve => setTimeout(resolve, 1)); active--; completed++; }), 4);
  assert.equal(maximum, 4); assert.equal(completed, 20);
  for (const count of [0, 9, 1.5]) await assert.rejects(runBounded([], count));
});
test("sentetik yük mevcut dosyayı açmaz veya üzerine yazmaz", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-probe-guard-"));
  try {
    const file = path.join(directory, "synthetic-load.db"); await writeFile(file, "untouched");
    await assert.rejects(probeSqliteLoad(directory, new URL("../prisma/migrations/", import.meta.url)));
    assert.equal(await readFile(file, "utf8"), "untouched");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

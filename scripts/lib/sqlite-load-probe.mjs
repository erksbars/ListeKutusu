import { PrismaClient } from "@prisma/client";
import { lstat, readFile, readdir } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { createCommunities, CommunityError } from "../../lib/communities.ts";
import { createCommunityEvents } from "../../lib/communityEvents.ts";
import { respondToCommunityEvent } from "../../lib/communityAttendance.ts";
import { communityHealth } from "../../lib/communityHealth.ts";

export function latencySummary(values) {
  if (!values.length) return { count: 0, p50Ms: null, p95Ms: null, maxMs: null };
  const sorted = [...values].sort((a, b) => a - b), round = value => Math.round(value * 100) / 100;
  return { count: sorted.length, p50Ms: round(sorted[Math.ceil(sorted.length * 0.5) - 1]), p95Ms: round(sorted[Math.ceil(sorted.length * 0.95) - 1]), maxMs: round(sorted.at(-1)) };
}
export async function runBounded(tasks, concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error("Concurrency must be 1–8");
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async (_, worker) => {
    while (next < tasks.length) { const index = next++; await tasks[index](worker); }
  }));
}
// No URL parameter or DATABASE_URL fallback: this can only create a new fixture DB.
export async function probeSqliteLoad(directory, migrations) {
  const file = path.join(directory, "synthetic-load.db");
  try { await lstat(file); throw new Error("Fixture target already exists"); } catch (error) { if (error.code !== "ENOENT") throw error; }
  const clients = Array.from({ length: 8 }, () => new PrismaClient({ datasources: { db: { url: `file:${file.replaceAll("\\", "/")}?connection_limit=1` } } }));
  const db = clients[0], users = Array.from({ length: 80 }, (_, i) => `probe-member-${i}`), stages = [];
  try {
    for (const folder of (await readdir(migrations, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, migrations), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    await db.userList.createMany({ data: ["probe-owner", ...users].map(id => ({ id, slug: id, ownerName: "Sentetik yük kullanıcısı" })) });
    const { slug } = await createCommunities(db).create("probe-owner", { name: "Sentetik yük topluluğu", description: "Yalnız geçici yerel SQLite ölçüm verisidir.", category: "interest", rules: "Gerçek kullanıcı veya gerçek etkinlik değildir." });
    const community = await db.community.findUniqueOrThrow({ where: { slug } });
    await db.communityMember.createMany({ data: users.map(userId => ({ communityId: community.id, userId })) });
    await db.communityPost.createMany({ data: Array.from({ length: 200 }, (_, i) => ({ communityId: community.id, authorId: users[i % users.length], title: `Sentetik paylaşım ${i}`, body: "Yerel ölçüm için üretilmiş sentetik içerik." })) });
    for (const client of clients) await client.$connect();
    for (const concurrency of [1, 4, 8]) {
      const capacity = 24, events = createCommunityEvents(db);
      const event = (await events.create(slug, "probe-owner", { title: "Sentetik kapasite ölçümü", description: "Yalnız geçici SQLite yük ölçümü için oluşturulmuştur.", localStart: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16), city: "İstanbul", venue: "Kurgusal test alanı", capacity, publicLocationConfirmed: true })).event;
      // Warm the read path outside timed results.
      await events.detail(slug, event.id, users[0]); await createCommunities(db).detail(slug, users[0], 1);
      const reads = [], writes = [], acceptedWrites = [], rejectedWrites = [], errorCodes = {}; let admitted = 0, full = 0;
      const tasks = [];
      for (const [index, userId] of users.entries()) {
        tasks.push(async worker => {
          const started = performance.now(); let outcome = "error";
          try { await respondToCommunityEvent(clients[worker], slug, event.id, userId, "attending", () => new Date()); admitted++; outcome = "accepted"; }
          catch (error) {
            if (error instanceof CommunityError && error.status === 409) { full++; outcome = "full"; }
            else { const code = typeof error?.code === "string" && /^[A-Z0-9_]{1,40}$/.test(error.code) ? error.code : "UNEXPECTED"; errorCodes[code] = (errorCodes[code] ?? 0) + 1; }
          } finally { const elapsed = performance.now() - started; writes.push(elapsed); if (outcome === "accepted") acceptedWrites.push(elapsed); else if (outcome === "full") rejectedWrites.push(elapsed); }
        });
        if (index % 2 === 0) tasks.push(async worker => {
          const started = performance.now();
          try { if (index % 4 === 0) await createCommunityEvents(clients[worker]).detail(slug, event.id, userId); else await createCommunities(clients[worker]).detail(slug, userId, 1); }
          catch { errorCodes.READ_ERROR = (errorCodes.READ_ERROR ?? 0) + 1; }
          finally { reads.push(performance.now() - started); }
        });
      }
      const started = performance.now(); await runBounded(tasks, concurrency);
      const elapsedMs = performance.now() - started;
      const stored = await db.communityEventRsvp.count({ where: { eventId: event.id, status: "attending" } });
      stages.push({ concurrency, attempts: users.length, capacity, admitted, capacityRejected: full, stored, errorCodes, invariantOk: stored === capacity && admitted === capacity && full === users.length - capacity && !Object.keys(errorCodes).length, elapsedMs: Math.round(elapsedMs), operationsPerSecond: Math.round(tasks.length / elapsedMs * 1000), reads: latencySummary(reads), writes: latencySummary(writes), acceptedWrites: latencySummary(acceptedWrites), capacityRejections: latencySummary(rejectedWrites) });
    }
    const health = await communityHealth(db), journal = await db.$queryRawUnsafe("PRAGMA journal_mode");
    return { scope: "synthetic-local-service-only", fixture: { users: 81, posts: 200, events: 3 }, journalMode: journal[0].journal_mode, stages, integrityErrors: health.errors, integrityWarnings: health.warnings, ok: stages.every(stage => stage.invariantOk) && health.errors === 0 && health.warnings === 0 };
  } finally { await Promise.all(clients.map(client => client.$disconnect())); }
}

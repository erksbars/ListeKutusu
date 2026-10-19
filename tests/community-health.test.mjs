import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities } from "../lib/communities.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { communityHealth } from "../lib/communityHealth.ts";
test("salt okunur pilot kontrolü tutarsızlıkları ve bekleyen işleri ayırır", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "listekutusu-health-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "alice", "bob", "carol"]) await db.userList.create({ data: { id, ownerName: id, slug: id } });
    const communities = createCommunities(db), { slug } = await communities.create("owner", { name: "Pilot kontrolü", description: "Salt okunur denetleme için test topluluğu.", category: "interest", rules: "Yalnız test verisi kullanılır." });
    const row = await db.community.findUniqueOrThrow({ where: { slug } });
    for (const id of ["alice", "bob", "carol"]) await communities.mutate(slug, id, { action: "join" });
    const events = createCommunityEvents(db, () => new Date("2026-10-17T10:00:00Z"));
    const id = (await events.create(slug, "owner", { title: "Örnek etkinlik", description: "Yalnız kontrol için oluşturulan kurgusal duyuru.", localStart: "2026-11-20T18:30", city: "Ankara", venue: "Örnek mekân", capacity: 2, publicLocationConfirmed: true })).event.id;
    const now = new Date();
    assert.equal((await communityHealth(db, now)).status, "ok");
    await db.communityMember.update({ where: { communityId_userId: { communityId: row.id, userId: "alice" } }, data: { role: "owner" } });
    await db.communityEventRsvp.createMany({ data: ["alice", "bob", "carol"].map(userId => ({ eventId: id, userId, status: "attending" })) });
    await db.communityReport.create({ data: { communityId: row.id, reporterId: "alice", targetType: "post", targetId: "missing", reason: "Örnek gerekçe" } });
    await db.communityEventNotificationJob.create({ data: { id: "old-job", eventId: id, actorId: "owner", version: 1, type: "community_event_updated", createdAt: new Date(now.getTime() - 360_000) } });
    await db.communityEventNotificationJob.create({ data: { id: "failed-job", eventId: id, actorId: "owner", version: 2, type: "community_event_updated", failedAt: now, failures: 5 } });
    const dirty = await communityHealth(db, now);
    const counts = Object.fromEntries(dirty.checks.map(check => [check.key, check.count]));
    assert.equal(dirty.status, "failed"); assert.equal(counts["owner-role"], 1); assert.equal(counts["rsvp-overcapacity"], 1);
    assert.equal(counts["report-target"], 1); assert.equal(counts["old-pending-job"], 1); assert.equal(counts["failed-job"], 1);
    assert.equal((await db.communityMember.findUniqueOrThrow({ where: { communityId_userId: { communityId: row.id, userId: "alice" } } })).role, "owner");
    assert.equal(await db.communityReport.count({ where: { status: "pending" } }), 1); // No automatic repair.
    await db.communityEvent.update({ where: { id }, data: { status: "cancelled" } });
    await db.userList.update({ where: { id: "owner" }, data: { status: "deleted" } });
    const after = Object.fromEntries((await communityHealth(db, now)).checks.map(check => [check.key, check.count]));
    assert.equal(after["closed-event-rsvp"], 3); assert.equal(after["inactive-owner"], 1); assert.equal(after["rsvp-overcapacity"], 0);
    assert.equal(JSON.stringify(dirty).includes("alice"), false); assert.equal(JSON.stringify(dirty).includes("Örnek gerekçe"), false);
  } finally { await db.$disconnect(); await rm(dir, { recursive: true, force: true }); }
});

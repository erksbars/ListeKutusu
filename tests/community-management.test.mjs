import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { communityManagement } from "../lib/communityManagement.ts";
import { moderationNote } from "../lib/communityAudit.ts";
import { createCommunityEvents } from "../lib/communityEvents.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;

test("yönetim notu sınırı", () => {
  assert.equal(moderationNote(undefined), null); assert.equal(moderationNote("  Karar notu  "), "Karar notu");
  for (const raw of [true, 4, "x".repeat(301), "iki\nsatır", "gizli\u200bmetin"]) assert.throws(() => moderationNote(raw), denied(400));
});
test("topluluk yönetimi sayfalaması ve atomik karar geçmişi", async t => {
  const dir = await mkdtemp(path.join(tmpdir(), "listekutusu-management-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    const users = ["owner", "mod", "outsider", ...Array.from({ length: 65 }, (_, i) => `user-${String(i).padStart(2, "0")}`)];
    await db.userList.createMany({ data: users.map(id => ({ id, slug: id, ownerName: id })) });
    const service = createCommunities(db), input = { name: "Yönetim test topluluğu", description: "Sayfalama ve yönetim kararları için geçici topluluk.", category: "interest", rules: "Gerçek kişi veya etkinlik yoktur." };
    const { slug } = await service.create("owner", input), other = await service.create("outsider", input);
    const row = await db.community.findUniqueOrThrow({ where: { slug } });
    await db.communityMember.createMany({ data: users.filter(id => !["owner", "outsider"].includes(id)).map(userId => ({ communityId: row.id, userId })) });
    await service.mutate(slug, "owner", { action: "moderate-member", userId: "mod", operation: "promote", moderationNote: "Pilot yöneticisi" });
    const postId = (await service.mutate(slug, "user-00", { action: "create-post", title: "Örnek sohbet", body: "Kuyruk hedefinin örnek açıklaması." })).post.id;
    await db.communityReport.createMany({ data: users.filter(id => id.startsWith("user-")).slice(1, 42).map((reporterId, index) => ({ id: `report-${String(index).padStart(2, "0")}`, reporterId, communityId: row.id, targetType: "post", targetId: postId, reason: `Gerekçe ${index}`, createdAt: new Date("2026-10-17T08:00:00Z") })) });
    const read = (params = {}, user = "owner", target = slug) => communityManagement(db, target, user, params);
    await t.test("anonim/normal üye/yabancı yönetici/deaktif hesap kuyruğu göremez", async () => {
      await assert.rejects(read({}, null), denied(401));
      await assert.rejects(read({}, "user-00"), denied(403)); await assert.rejects(read({}, "outsider"), denied(403));
      await db.userList.update({ where: { id: "mod" }, data: { status: "deleted" } });
      await assert.rejects(read({}, "mod"), denied(401));
      assert.equal((await service.detail(slug, "mod", 1)).canModerate, false);
      assert.deepEqual((await service.detail(slug, "mod", 1)).reports, []);
      await db.userList.update({ where: { id: "mod" }, data: { status: "active" } });
    });
    await t.test("41 bekleyen bildirim 20/20/1; aynı tarihte tekrar/kayıp yok; kimlik sızmaz", async () => {
      const pages = await Promise.all([1, 2, 3].map(page => read({ view: "reports", page: String(page) })));
      assert.deepEqual(pages.map(result => result.reports.length), [20, 20, 1]);
      assert.equal(new Set(pages.flatMap(result => result.reports.map(report => report.id))).size, 41);
      assert.deepEqual(pages.map(result => result.hasMore), [true, true, false]);
      assert.equal(pages[0].total, 41); assert.equal(pages[0].reports[0].postId, postId);
      assert.equal(JSON.stringify(pages).includes("reporterId"), false);
      assert.equal((await read({ type: "event" })).total, 0);
      assert.equal((await read({ status: "reviewed" })).total, 0);
    });
    await t.test("67 üye sayfalanır; arama/durum ve sayfa doğrulaması", async () => {
      const pages = await Promise.all([1, 2, 3, 4].map(page => read({ view: "members", page: String(page) })));
      assert.deepEqual(pages.map(result => result.members.length), [20, 20, 20, 7]);
      assert.equal(new Set(pages.flatMap(result => result.members.map(member => member.userId))).size, 67);
      assert.equal((await read({ view: "members", q: "user-64" })).members[0].userId, "user-64");
      for (const params of [{ view: "other" }, { page: "101" }, { view: "members", status: "deleted" }, { view: "reports", type: "user" }, { status: "hidden" }, { view: "members", q: "x".repeat(101) }]) await assert.rejects(read(params), denied(400));
    });
    await t.test("inceleme aktör/tarih ve notu atomik yazar; ikinci karar kayıt çoğaltmaz", async () => {
      await service.mutate(slug, "mod", { action: "resolve-report", reportId: "report-00", moderationNote: "İçerik kurallara uygun" });
      const report = await db.communityReport.findUniqueOrThrow({ where: { id: "report-00" } });
      assert.equal(report.reviewedById, "mod"); assert.ok(report.reviewedAt);
      const reviewed = await read({ status: "reviewed" }); assert.equal(reviewed.total, 1); assert.equal(reviewed.reports[0].reviewedBy.id, "mod");
      await assert.rejects(service.mutate(slug, "mod", { action: "resolve-report", reportId: "report-00" }), denied(404));
      const logs = await read({ view: "history" }); assert.equal(logs.logs.filter(log => log.action === "resolve-report").length, 1);
      assert.ok(logs.logs.some(log => log.note === "İçerik kurallara uygun"));
      assert.equal(JSON.stringify(logs).includes("Gerekçe 0"), false);
    });
    await t.test("yetki hiyerarşisi/no-op geçmişi kirletmez; ban RSVP'yi çeker", async () => {
      const events = createCommunityEvents(db, () => new Date("2026-10-17T10:00:00Z"));
      const event = (await events.create(slug, "owner", { title: "Test etkinliği", description: "Bu yalnız yönetim testi için örnek duyurudur.", localStart: "2026-11-20T18:30", city: "Ankara", venue: "Örnek kamusal mekân", publicLocationConfirmed: true })).event;
      await events.respond(slug, event.id, "user-64", "attending");
      await service.mutate(slug, "mod", { action: "moderate-member", userId: "user-64", operation: "ban", moderationNote: "Tekrarlayan kural ihlali" });
      await service.mutate(slug, "mod", { action: "moderate-member", userId: "user-64", operation: "ban" });
      assert.equal(await db.communityModerationLog.count({ where: { action: "ban", targetId: "user-64" } }), 1);
      assert.equal((await read({ view: "members", status: "banned" })).members[0].userId, "user-64");
      assert.equal((await db.communityEventRsvp.findFirstOrThrow({ where: { eventId: event.id } })).status, "withdrawn");
      await assert.rejects(service.mutate(slug, "mod", { action: "moderate-member", userId: "owner", operation: "ban" }), denied(403));
      await assert.rejects(service.mutate(slug, "mod", { action: "moderate-member", userId: "user-01", operation: "promote" }), denied(403));
      await assert.rejects(read({}, "user-64"), denied(403));
    });
    await t.test("geçmiş yazılamazsa içerik/inceleme/outbox geri alınır", async () => {
      await db.$executeRawUnsafe("CREATE TRIGGER fail_audit BEFORE INSERT ON CommunityModerationLog BEGIN SELECT RAISE(ABORT, 'audit failure'); END");
      await assert.rejects(service.mutate(slug, "owner", { action: "remove-post", postId }));
      assert.equal((await db.communityPost.findUniqueOrThrow({ where: { id: postId } })).status, "published");
      assert.equal(await db.communityReport.count({ where: { status: "pending" } }), 40);
      const events = createCommunityEvents(db, () => new Date("2026-10-17T10:00:00Z"));
      const event = await db.communityEvent.findFirstOrThrow();
      await assert.rejects(events.manage(slug, event.id, "owner", "cancel"));
      assert.equal((await db.communityEvent.findUniqueOrThrow({ where: { id: event.id } })).status, "scheduled");
      assert.equal(await db.communityEventNotificationJob.count(), 0);
      await db.$executeRawUnsafe("DROP TRIGGER fail_audit");
      await service.mutate(slug, "owner", { action: "remove-post", postId });
      assert.equal(await db.communityReport.count({ where: { status: "pending" } }), 0);
      assert.equal(await db.communityReport.count({ where: { reviewedById: "owner" } }), 40);
    });
    await t.test("geçmiş sayfalaması ve aktör silinmesi; topluluk sınırı", async () => {
      await db.communityModerationLog.createMany({ data: Array.from({ length: 25 }, (_, i) => ({ communityId: row.id, actorId: "mod", action: "resolve-report", targetType: "post", targetId: `legacy-${i}` })) });
      const first = await read({ view: "history" }), second = await read({ view: "history", page: "2" });
      assert.equal(first.logs.length, 20); assert.equal(first.hasMore, true); assert.ok(second.logs.length > 0);
      assert.equal(new Set([...first.logs, ...second.logs].map(log => log.id)).size, first.total);
      assert.equal((await read({ view: "history" }, "outsider", other.slug)).total, 0);
      await db.userList.delete({ where: { id: "mod" } });
      assert.ok((await read({ view: "history" })).logs.some(log => log.actor === null));
      assert.equal((await read({ status: "reviewed" })).reports.find(report => report.id === "report-00")?.reviewedBy ?? null, null);
    });
  } finally { await db.$disconnect(); await rm(dir, { recursive: true, force: true }); }
});

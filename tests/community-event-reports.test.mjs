import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunityEvents } from "../lib/communityEvents.ts";
import { CommunityError, createCommunities } from "../lib/communities.ts";
import { processEventNotificationBatch } from "../lib/communityEventOutbox.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;

test("etkinlik bildirimleri: hedef, gizlilik, tekrar, yönetim ve kaldırma", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-event-reports-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "organizer", "reporter", "member", "moderator", "outsider"]) await db.userList.create({ data: { id, slug: id, ownerName: id } });
    const communities = createCommunities(db), events = createCommunityEvents(db, () => new Date("2026-10-15T12:00:00Z"));
    const body = { name: "Bildirim Kulübü", description: "Etkinlik bildirimlerinin test topluluğu.", category: "interest", rules: "Saygılı ol ve hassas bilgileri paylaşma." };
    const { slug } = await communities.create("owner", body), other = await communities.create("outsider", body);
    for (const id of ["organizer", "reporter", "member", "moderator"]) await communities.mutate(slug, id, { action: "join" });
    await communities.mutate(slug, "owner", { action: "moderate-member", userId: "moderator", operation: "promote" });
    const input = { title: "Örnek etkinlik", description: "Yalnız otomatik test için oluşturulan etkinlik duyurusu.", localStart: "2026-11-20T18:30", city: "Ankara", venue: "Kurgusal kamusal mekân", capacity: 4, distribution: "general", publicLocationConfirmed: true };
    const eventId = (await events.create(slug, "organizer", input)).event.id;
    await events.respond(slug, eventId, "member", "attending");
    await t.test("üyelik, aktif hesap, kendi içeriği ve yabancı hedef sınırı", async () => {
      await assert.rejects(events.report(slug, eventId, "outsider", "Örnek neden"), denied(403));
      await assert.rejects(events.report(slug, eventId, "organizer", "Örnek neden"), denied(400));
      await assert.rejects(events.report(other.slug, eventId, "outsider", "Örnek neden"), denied(404));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "reporter", operation: "ban" });
      await assert.rejects(events.report(slug, eventId, "reporter", "Örnek neden"), denied(403));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "reporter", operation: "unban" });
      await db.userList.update({ where: { id: "reporter" }, data: { status: "deleted" } });
      await assert.rejects(events.report(slug, eventId, "reporter", "Örnek neden"), denied(401));
      await db.userList.update({ where: { id: "reporter" }, data: { status: "active" } });
      for (const reason of [null, 123, "  ", "a".repeat(301)]) await assert.rejects(events.report(slug, eventId, "reporter", reason), denied(400));
      assert.equal(await db.communityReport.count(), 0);
    });
    await t.test("iki yönlü engel ve deaktif düzenleyen rapor hedefini gizler", async () => {
      for (const [blockerId, blockedId] of [["reporter", "organizer"], ["organizer", "reporter"]]) {
        await db.userBlock.create({ data: { blockerId, blockedId } });
        await assert.rejects(events.report(slug, eventId, "reporter", "Örnek neden"), denied(404));
        await db.userBlock.deleteMany();
      }
      await db.userList.update({ where: { id: "organizer" }, data: { status: "deleted" } });
      await assert.rejects(events.report(slug, eventId, "reporter", "Örnek neden"), denied(404));
      await db.userList.update({ where: { id: "organizer" }, data: { status: "active" } });
    });
    let reportId;
    await t.test("tekrar tek kayıt; rapor etkinlik/kapasite/sürüm/bildirim değiştirmez", async () => {
      assert.equal((await events.detail(slug, eventId, "reporter")).canReport, true);
      assert.equal((await events.detail(slug, eventId, null)).canReport, false);
      assert.equal((await events.detail(slug, eventId, "outsider")).canReport, false);
      assert.equal((await events.detail(slug, eventId, "organizer")).canReport, false);
      await events.report(slug, eventId, "reporter", "  Uygunsuz etkinlik açıklaması  ");
      await events.report(slug, eventId, "reporter", "İkinci gönderim");
      const report = await db.communityReport.findFirstOrThrow(); reportId = report.id;
      assert.equal(await db.communityReport.count(), 1); assert.equal(report.reason, "Uygunsuz etkinlik açıklaması");
      assert.equal(report.targetType, "event"); assert.equal(report.targetId, eventId);
      const detail = await events.detail(slug, eventId, "reporter");
      assert.equal(detail.canReport, false); assert.equal(detail.reportStatus, "pending");
      assert.equal(detail.event.status, "scheduled"); assert.equal(detail.event.contentVersion, 0); assert.equal(detail.event.attendingCount, 1);
      assert.equal(await db.notification.count(), 0);
    });
    await t.test("bildiren kimliği/nedeni kamuya veya düzenleyene sızmaz; yalnız topluluk yönetimi kuyruğu", async () => {
      for (const viewer of [null, "member", "organizer", "outsider"]) {
        assert.deepEqual((await communities.detail(slug, viewer, 1)).reports, []);
        const detail = await events.detail(slug, eventId, viewer);
        assert.equal(detail.reportStatus, null); assert.equal(JSON.stringify(detail).includes("Uygunsuz etkinlik açıklaması"), false);
      }
      for (const viewer of ["owner", "moderator"]) {
        const reports = (await communities.detail(slug, viewer, 1)).reports;
        assert.equal(reports.length, 1); assert.equal(reports[0].postId, null); assert.equal(reports[0].targetType, "event");
        assert.equal(Object.hasOwn(reports[0], "reporterId"), false);
      }
    });
    await t.test("yetkisiz/farklı topluluk inceleyemez; incelendi içeriği kaldırmaz ve tekrar açılmaz", async () => {
      await assert.rejects(communities.mutate(slug, "organizer", { action: "resolve-report", reportId }), denied(403));
      await assert.rejects(communities.mutate(other.slug, "outsider", { action: "resolve-report", reportId }), denied(404));
      await communities.mutate(slug, "moderator", { action: "resolve-report", reportId });
      await events.report(slug, eventId, "reporter", "Tekrar gönderim");
      assert.equal((await events.detail(slug, eventId, "reporter")).reportStatus, "reviewed");
      assert.equal((await events.detail(slug, eventId, null)).event.status, "scheduled");
      assert.equal((await communities.detail(slug, "owner", 1)).reports.length, 0);
      assert.equal(await db.communityReport.count(), 1);
    });
    await t.test("iptal raporu kapatmaz; kaldırma tüm hedef raporlarını ve RSVP'yi atomik kapatır", async () => {
      await events.report(slug, eventId, "member", "Etkinlikte uygunsuz içerik");
      await events.manage(slug, eventId, "organizer", "cancel");
      assert.equal((await communities.detail(slug, "owner", 1)).reports.length, 1);
      await events.report(slug, eventId, "moderator", "İptal edilmiş duyuru da incelenmeli");
      assert.equal((await events.detail(slug, eventId, "owner")).event.status, "cancelled");
      await events.manage(slug, eventId, "owner", "remove");
      assert.equal(await db.communityReport.count({ where: { status: "pending" } }), 0);
      await assert.rejects(events.detail(slug, eventId, null), denied(404));
      await assert.rejects(events.report(slug, eventId, "member", "Kaldırma sonrası"), denied(404));
      assert.equal(await db.communityEventRsvp.count({ where: { eventId, status: "attending" } }), 0);
    });
    await t.test("başlangıcı geçmiş duyuru bildirilebilir; doğrudan kaldırma katılımcıyı bilgilendirir", async () => {
      const id = (await events.create(slug, "organizer", input)).event.id;
      await events.respond(slug, id, "member", "attending");
      await events.report(slug, id, "reporter", "Mekân bilgisi uygunsuz");
      const later = createCommunityEvents(db, () => new Date("2026-11-21T12:00:00Z"));
      await later.report(slug, id, "member", "Geçmiş duyuru bildirimi");
      await events.manage(slug, id, "moderator", "remove");
      while ((await processEventNotificationBatch(db)).status === "processed") { /* drain committed jobs */ }
      assert.equal(await db.communityReport.count({ where: { targetId: id, status: "pending" } }), 0);
      assert.equal(await db.notification.count({ where: { communityEventId: id, type: "community_event_removed", userId: "member" } }), 1);
      assert.equal(await db.communityEventRsvp.count({ where: { eventId: id, status: "attending" } }), 0);
    });
  } finally { await db.$disconnect(); await rm(directory, { recursive: true, force: true }); }
});

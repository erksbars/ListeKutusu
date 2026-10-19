import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, CommunityError } from "../lib/communities.ts";
import { createPlatformCommunityCases } from "../lib/platformCommunityCases.ts";
import { createCommunityLifecycle } from "../lib/communityLifecycle.ts";
import { deleteAccountData } from "../lib/accountDeletion.ts";
const denied = status => error => error instanceof CommunityError && error.status === status;
test("özel platform başvurusu, itiraz, çıkar çatışması ve atomik karar", async t => {
  const dir = await mkdtemp(path.join(tmpdir(), "listekutusu-platform-cases-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      for (const sql of (await readFile(new URL(`${folder}/migration.sql`, root), "utf8")).split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(sql);
    }
    for (const id of ["owner", "member", "other", "staff", "staff2", "moderator", "inactive"]) await db.userList.create({ data: { id, slug: id, ownerName: id, role: ["owner", "staff", "staff2"].includes(id) ? "admin" : id === "moderator" ? "moderator" : "member", passwordHash: "verified-test-hash" } });
    const communities = createCommunities(db), cases = createPlatformCommunityCases(db), staff = { kind: "account", id: "staff" }, secondStaff = { kind: "account", id: "staff2" }, rootActor = { kind: "owner", id: null };
    const { slug } = await communities.create("owner", { name: "Platform test topluluğu", description: "Yalnız özel platform başvurusu test topluluğu.", category: "interest", rules: "Hassas bilgi içermeyen geçici test." });
    const row = await db.community.findUniqueOrThrow({ where: { slug } });
    for (const id of ["member", "other", "staff2"]) await communities.mutate(slug, id, { action: "join" });
    const submit = (user = "member", fields = {}) => cases.submit(user, { communitySlug: slug, kind: "community", reason: "Özel başvuru açıklaması, yalnız platform içindir.", ...fields });
    let general;
    await t.test("aktif hesap, girdi sınırları ve açık genel konuda tek kayıt", async () => {
      await assert.rejects(cases.own(null), denied(401));
      await db.userList.update({ where: { id: "inactive" }, data: { status: "deleted" } });
      await assert.rejects(submit("inactive"), denied(401));
      for (const fields of [{ kind: "toString" }, { reason: "kısa" }, { reason: "x".repeat(1501) }, { reason: "Görünmez\u200bkarakter içeriyor" }, { communitySlug: "missing" }]) await assert.rejects(submit("member", fields), error => error instanceof CommunityError);
      general = await submit("member", { status: "resolved", applicantId: "other", reviewerId: "owner" });
      const duplicate = await submit("member", { reason: "Yeni metin eskisini ezmemeli." }); assert.equal(duplicate.id, general.id); assert.equal(duplicate.duplicate, true);
      const stored = await db.platformCommunityCase.findUniqueOrThrow({ where: { id: general.id } });
      assert.equal(stored.applicantId, "member"); assert.equal(stored.status, "pending"); assert.equal(stored.reviewerId, null);
      assert.match(stored.reason, /Özel başvuru/); assert.equal(await db.platformCommunityCaseEvent.count(), 1);
    });
    await t.test("yalnız kendi liste/bağlam; topluluk yönetiminden ayrı ve global rol doğrulaması", async () => {
      assert.equal((await cases.own("other")).total, 0); assert.equal((await cases.own("member")).total, 1);
      assert.equal((await communities.detail(slug, "owner", 1)).reports.length, 0);
      for (const id of ["owner", "member", "moderator"]) {
        if (id === "owner") assert.equal((await cases.queue({ kind: "account", id })).total, 0);
        else await assert.rejects(cases.queue({ kind: "account", id }), denied(403));
      }
      assert.equal((await cases.queue(staff)).total, 1); assert.equal((await cases.queue(rootActor)).total, 1);
      const own = JSON.stringify(await cases.own("member"));
      for (const field of ["reviewerId", "applicantId", "subjectKey", "events", "sourceDecisionId"]) assert.equal(own.includes(`"${field}"`), false);
      await assert.rejects(cases.queue(staff, "101"), denied(400)); await assert.rejects(cases.queue(staff, "1", "invalid"), denied(400));
    });
    await t.test("kendi incelenmiş şikâyetine tek itiraz; yabancı/bekleyen rapor reddedilir", async () => {
      const post = (await communities.mutate(slug, "owner", { action: "create-post", title: "Örnek konu", body: "Şikâyet hedefi olan geçici konu." })).post;
      await communities.mutate(slug, "member", { action: "report", postId: post.id, reason: "Örnek neden" });
      const report = await db.communityReport.findFirstOrThrow();
      await assert.rejects(submit("member", { kind: "report_appeal", sourceReportId: report.id }), denied(404));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "staff2", operation: "promote" });
      await communities.mutate(slug, "staff2", { action: "resolve-report", reportId: report.id });
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "staff2", operation: "demote" });
      await assert.rejects(submit("other", { kind: "report_appeal", sourceReportId: report.id }), denied(404));
      const appeal = await submit("member", { kind: "report_appeal", sourceReportId: report.id });
      assert.equal((await submit("member", { kind: "report_appeal", sourceReportId: report.id })).id, appeal.id);
      assert.equal((await cases.queue(secondStaff)).cases.some(item => item.id === appeal.id), false); // Original reviewer is still excluded after demotion.
      assert.equal((await cases.own("other", "1", slug)).context.reports.length, 0);
      assert.equal((await cases.own("member", "1", slug)).context.reports[0].id, report.id);
    });
    await t.test("uzaklaştırılan/arşiv üyesi başvurabilir; ban itirazı rolü değiştirmez", async () => {
      await assert.rejects(submit("other", { kind: "ban_appeal" }), denied(409));
      await communities.mutate(slug, "owner", { action: "moderate-member", userId: "member", operation: "ban" });
      const ban = await submit("member", { kind: "ban_appeal" });
      assert.equal((await cases.own("member", "1", slug)).context.canAppealBan, true);
      await createCommunityLifecycle(db).mutate(slug, "owner", { action: "archive", confirmation: "TOPLULUĞU ARŞİVLE" });
      await cases.review(staff, { id: ban.id, status: "resolved", response: "İtiraz incelendi; bu kayıt tek başına uzaklaştırma kararını değiştirmez.", expectedVersion: 0 });
      assert.equal((await db.communityMember.findUniqueOrThrow({ where: { communityId_userId: { communityId: row.id, userId: "member" } } })).status, "banned");
      assert.equal((await submit("member", { kind: "ban_appeal" })).id, ban.id);
    });
    await t.test("karar, yanıt ve audit atomik; eski sürüm ikinci karar veya not ezmesi yapmaz", async () => {
      await db.$executeRawUnsafe("CREATE TRIGGER fail_platform_audit BEFORE INSERT ON PlatformCommunityCaseEvent WHEN NEW.action = 'resolved' BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END");
      await assert.rejects(cases.review(staff, { id: general.id, status: "resolved", response: "İnceleme tamamlandı, başvurana açıklanan sonuç.", expectedVersion: 0 }));
      let current = await db.platformCommunityCase.findUniqueOrThrow({ where: { id: general.id } }); assert.equal(current.status, "pending"); assert.equal(current.version, 0);
      await db.$executeRawUnsafe("DROP TRIGGER fail_platform_audit");
      await assert.rejects(cases.review({ kind: "account", id: "owner" }, { id: general.id, status: "resolved", response: "Kendi yönettiğim topluluğu inceleyemem.", expectedVersion: 0 }), denied(409));
      await cases.review(staff, { id: general.id, status: "resolved", response: "İnceleme tamamlandı, başvurana açıklanan sonuç.", expectedVersion: 0 });
      await assert.rejects(cases.review(secondStaff, { id: general.id, status: "dismissed", response: "Eski formdaki ikinci karar uygulanamaz.", expectedVersion: 0 }), denied(409));
      current = await db.platformCommunityCase.findUniqueOrThrow({ where: { id: general.id } }); assert.equal(current.version, 1); assert.equal(current.reviewerId, "staff");
      assert.equal(await db.platformCommunityCaseEvent.count({ where: { caseId: general.id } }), 2);
      assert.match((await cases.own("member")).cases.find(item => item.id === general.id).response, /İnceleme tamamlandı/);
    });
    await t.test("iki bağlantıda eşzamanlı karar yalnız bir yanıt ve audit üretir", async () => {
      const application = await submit();
      const peer = new PrismaClient({ datasources: { db: { url: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}` } } });
      try {
        const outcomes = await Promise.allSettled([
          cases.review(staff, { id: application.id, status: "resolved", response: "Birinci bağımsız inceleme yanıtı.", expectedVersion: 0 }),
          createPlatformCommunityCases(peer).review(secondStaff, { id: application.id, status: "dismissed", response: "İkinci bağımsız inceleme yanıtı.", expectedVersion: 0 }),
        ]);
        assert.equal(outcomes.filter(item => item.status === "fulfilled").length, 1);
        const failure = outcomes.find(item => item.status === "rejected");
        assert.equal(failure.reason instanceof CommunityError, true); assert.equal(failure.reason.status, 409);
        assert.equal((await db.platformCommunityCase.findUniqueOrThrow({ where: { id: application.id } })).version, 1);
        assert.equal(await db.platformCommunityCaseEvent.count({ where: { caseId: application.id } }), 2);
      } finally { await peer.$disconnect(); }
    });
    await t.test("kişinin kendi başvurusu global admin kuyruğuna girmez; yetki geri alımı sunucuda işler", async () => {
      const ownCase = await submit("staff"); assert.equal((await cases.queue(staff)).cases.some(item => item.id === ownCase.id), false);
      await db.userList.update({ where: { id: "staff" }, data: { role: "member" } }); await assert.rejects(cases.queue(staff), denied(403));
      await assert.rejects(cases.review(staff, { id: ownCase.id, status: "resolved", response: "Yetki geri alınmışken yazma kapalıdır.", expectedVersion: 0 }), denied(403));
      await db.userList.update({ where: { id: "staff" }, data: { role: "admin" } });
    });
    await t.test("sayfalama aynı tarihte kayıt kaybetmez; hesap silme kendi başvuru ve audit'ini temizler", async () => {
      await db.platformCommunityCase.createMany({ data: Array.from({ length: 25 }, (_, i) => ({ applicantId: "other", communityId: row.id, subjectKey: `fixture-${i}`, kind: "community", reason: "Salt sayfalama için geçici kapanmış fixture.", status: "resolved", response: "Geçici fixture yanıtı.", createdAt: new Date("2026-10-17T10:00:00Z") })) });
      const first = await cases.own("other", "1"), second = await cases.own("other", "2"); assert.equal(first.cases.length, 20); assert.equal(second.cases.length, 5);
      assert.equal(new Set([...first.cases, ...second.cases].map(item => item.id)).size, 25);
      const memberCases = await db.platformCommunityCase.findMany({ where: { applicantId: "member" }, select: { id: true } });
      await deleteAccountData(db, "member", "verified-test-hash", false);
      assert.equal(await db.platformCommunityCase.count({ where: { applicantId: "member" } }), 0);
      assert.equal(await db.platformCommunityCaseEvent.count({ where: { caseId: { in: memberCases.map(item => item.id) } } }), 0);
      assert.equal(await db.platformCommunityCase.count({ where: { applicantId: "other" } }), 25);
    });
  } finally { await db.$disconnect(); await rm(dir, { recursive: true, force: true }); }
});

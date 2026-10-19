import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createCommunities, communityInput, communityPostInput, communityPage, CommunityError } from "../lib/communities.ts";

const input = { name: "Kutu Oyuncuları", description: "Birlikte oyun konuşuyoruz.", category: "interest", rules: "Saygılı ol, kişisel bilgileri paylaşma." };
const denied = (status) => error => error instanceof CommunityError && error.status === status;
const reviewInput = { type: "review", title: "Film incelemem", body: "Bu film hakkında ayrıntılı görüşüm.", reviewKind: "movie", subjectTitle: "Inception", rating: 8, spoiler: true, sourceUrl: "https://www.wikidata.org/wiki/Q25188" };
test("inceleme türü, puan, spoiler ve dış bağlantı doğrulaması", () => {
  for (const reviewKind of ["music", "tv", "movie", "book", "game", "boardgame"]) assert.equal(communityPostInput({ ...reviewInput, reviewKind }).rating, 8);
  for (const fields of [{ type: "unknown" }, { reviewKind: "toString" }, { rating: "8" }, { rating: 0 }, { rating: 11 }, { rating: 8.5 }, { spoiler: "false" }, { body: "kısa" }, { subjectTitle: " " }, { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "http://openlibrary.org/works/OL1W" }, { sourceUrl: "https://www.wikidata.org.evil.test/wiki/Q1" }, { sourceUrl: "https://user:pass@www.wikidata.org/wiki/Q1" }, { sourceUrl: "https://127.0.0.1/admin" }]) assert.throws(() => communityPostInput({ ...reviewInput, ...fields }), denied(400));
  const legacy = communityPostInput({ title: "Eski sohbet", body: "Açıklama", rating: 9, sourceUrl: "javascript:bad" });
  assert.equal(legacy.type, "discussion"); assert.equal(legacy.rating, null); assert.equal(legacy.sourceUrl, null);
  assert.equal(communityPostInput({ ...reviewInput, sourceUrl: "" }).sourceUrl, null);
  assert.equal(communityPostInput({ ...reviewInput, spoiler: undefined }).spoiler, false);
});
test("topluluk girdileri ve sayfa sınırları", () => {
  assert.equal(communityInput({ ...input, name: "  Kutu Oyuncuları  " }).name, input.name);
  for (const body of [{ ...input, category: "toString" }, { ...input, name: "ab" }, { ...input, rules: "a" }, { ...input, description: 3 }]) assert.throws(() => communityInput(body), denied(400));
  assert.equal(communityPage(null), 1); assert.equal(communityPage("100"), 100);
  for (const value of ["0", "-1", "1.5", "101", "01", "1x"]) assert.throws(() => communityPage(value), denied(400));
});

test("topluluk SQLite üyelik, erişim ve moderasyon sınırları", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-communities-test-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    await db.$executeRawUnsafe('CREATE TABLE "UserList" ("id" TEXT PRIMARY KEY, "ownerName" TEXT NOT NULL, "slug" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT \'active\')');
    await db.$executeRawUnsafe('CREATE TABLE "UserBlock" ("id" TEXT PRIMARY KEY, "blockerId" TEXT NOT NULL, "blockedId" TEXT NOT NULL, "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE("blockerId", "blockedId"))');
    for (const id of ["owner", "member", "other", "mod", "mod2", "inactive"]) await db.$executeRaw`INSERT INTO UserList (id, ownerName, slug, status) VALUES (${id}, ${id}, ${id}, ${id === "inactive" ? "deleted" : "active"})`;
    const migration = await readFile(new URL("../prisma/migrations/20261009120000_communities/migration.sql", import.meta.url), "utf8");
    for (const statement of migration.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    const legacyCommunity = { id: "legacy-community" };
    await db.$executeRaw`INSERT INTO Community (id, name, description, category, rules, ownerId, slug) VALUES (${legacyCommunity.id}, ${input.name}, ${input.description}, ${input.category}, ${input.rules}, 'owner', 'legacy')`;
    await db.$executeRaw`INSERT INTO CommunityPost (id, communityId, authorId, title, body, updatedAt) VALUES ('legacy-post', ${legacyCommunity.id}, 'owner', 'Eski sohbet', 'Eski metin', CURRENT_TIMESTAMP)`;
    const reviewMigration = await readFile(new URL("../prisma/migrations/20261012120000_community_reviews/migration.sql", import.meta.url), "utf8");
    for (const statement of reviewMigration.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    const referenceMigration = await readFile(new URL("../prisma/migrations/20261012220000_review_library_reference/migration.sql", import.meta.url), "utf8");
    for (const statement of referenceMigration.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    for (const folder of ["20261013000000_community_events", "20261013010000_event_rsvp", "20261015140000_community_distribution", "20261015180000_community_discovery", "20261017120000_community_moderation_history", "20261017160000_community_lifecycle", "20261017230000_community_review_edits", "20261018010000_community_post_reactions"]) {
      const sql = await readFile(new URL(`../prisma/migrations/${folder}/migration.sql`, import.meta.url), "utf8");
      for (const statement of sql.split(";").map(x => x.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    }
    await t.test("inceleme migration'ı eski sohbetleri korur", async () => {
      const legacy = await db.communityPost.findUniqueOrThrow({ where: { id: "legacy-post" } });
      assert.equal(legacy.body, "Eski metin"); assert.equal(legacy.type, "discussion"); assert.equal(legacy.spoiler, false); assert.equal(legacy.rating, null); assert.equal(legacy.subjectTitle, null);
      assert.equal(legacy.distribution, "community");
      assert.equal(legacy.revision, 0); assert.equal(legacy.editedAt, null);
    });
    await db.community.delete({ where: { id: legacyCommunity.id } });
    const service = createCommunities(db);
    const { slug } = await service.create("owner", input);
    const second = await service.create("other", { ...input, name: "Diğer Topluluk" });
    let postId, commentId;
    await t.test("incelemeler sohbet yetkilerini kullanır ve spoiler önizlemesi sızmaz", async () => {
      await assert.rejects(service.mutate(second.slug, "member", { action: "create-post", ...reviewInput }), denied(403));
      const created = await service.mutate(second.slug, "other", { action: "create-post", ...reviewInput, authorId: "owner" });
      const listing = await service.detail(second.slug, null, 1);
      assert.equal(listing.posts[0].excerpt, ""); assert.equal(Object.hasOwn(listing.posts[0], "body"), false);
      assert.equal(listing.posts[0].type, "review"); assert.equal(listing.posts[0].rating, 8); assert.equal(listing.posts[0].author.id, "other");
      const detail = await service.post(second.slug, created.post.id, null, 1);
      assert.equal(detail.post.body, reviewInput.body); assert.equal(detail.post.subjectTitle, reviewInput.subjectTitle);
      await assert.rejects(service.mutate(slug, "owner", { action: "remove-post", postId: created.post.id }), denied(404));
      await service.mutate(second.slug, "other", { action: "remove-post", postId: created.post.id });
      await assert.rejects(service.post(second.slug, created.post.id, null, 1), denied(404));
    });
    await t.test("kurucu atomik atanır; herkese açık okuma özel yetkileri sızdırmaz", async () => {
      const owner = await service.detail(slug, "owner", 1);
      assert.equal(owner.membership.role, "owner"); assert.equal(owner.community.memberCount, 1); assert.equal(owner.canModerate, true);
      const visitor = await service.detail(slug, null, 1);
      assert.equal(visitor.membership, null); assert.equal(visitor.canModerate, false); assert.deepEqual(visitor.members, []); assert.deepEqual(visitor.reports, []);
      assert.equal(Object.hasOwn(visitor.community, "ownerId"), false);
      await assert.rejects(service.create("inactive", input), denied(401));
      await assert.rejects(service.mutate(slug, "owner", { action: "leave" }), denied(409));
      await assert.rejects(service.directory(null, "", "", 1, true), denied(401));
    });
    await t.test("üye olmayan yazamaz; tekrar katılım rolü veya sayıyı bozmaz", async () => {
      await assert.rejects(service.mutate(slug, "member", { action: "create-post", title: "Oyun önerisi", body: "Birlikte ne oynayalım?" }), denied(403));
      for (const id of ["member", "mod", "mod2"]) await service.mutate(slug, id, { action: "join" });
      await service.mutate(slug, "owner", { action: "join" }); await service.mutate(slug, "member", { action: "join" });
      const owner = await service.detail(slug, "owner", 1);
      assert.equal(owner.community.memberCount, 4); assert.equal(owner.membership.role, "owner");
      postId = (await service.mutate(slug, "member", { action: "create-post", title: "Oyun önerisi", body: "Birlikte ne oynayalım?", authorId: "owner" })).post.id;
      assert.equal((await service.post(slug, postId, null, 1)).post.author.id, "member");
      await service.mutate(slug, "owner", { action: "comment", postId, body: "Catan olabilir." });
      commentId = (await service.post(slug, postId, "owner", 1)).comments[0].id;
      assert.equal((await service.detail(second.slug, null, 1)).posts.length, 0);
      await assert.rejects(service.post(second.slug, postId, null, 1), denied(404));
      await assert.rejects(service.mutate(second.slug, "other", { action: "remove-post", postId }), denied(404));
    });
    await t.test("bildirim tekildir; üyeler yönetim verisini göremez", async () => {
      await assert.rejects(service.mutate(slug, "member", { action: "remove-comment", postId, commentId }), denied(403));
      await assert.rejects(service.mutate(slug, "member", { action: "report", postId, reason: "Kendi içeriğim" }), denied(400));
      for (let i = 0; i < 2; i++) await service.mutate(slug, "member", { action: "report", postId, commentId, reason: "Uygun olmayan yorum" });
      assert.equal(await db.communityReport.count(), 1);
      assert.deepEqual((await service.detail(slug, "member", 1)).reports, []);
      const report = (await service.detail(slug, "owner", 1)).reports[0]; assert.equal(report.postId, postId);
      await assert.rejects(service.mutate(second.slug, "other", { action: "resolve-report", reportId: report.id }), denied(404));
      await assert.rejects(service.mutate(slug, "member", { action: "resolve-report", reportId: report.id }), denied(403));
      await service.mutate(slug, "owner", { action: "remove-comment", postId, commentId });
      assert.equal((await service.post(slug, postId, null, 1)).comments.length, 0);
      assert.equal((await service.detail(slug, "owner", 1)).reports.length, 0);
    });
    await t.test("moderatör sınırları; uzaklaştırma yeniden katılmayla aşılamaz", async () => {
      for (const userId of ["mod", "mod2"]) await service.mutate(slug, "owner", { action: "moderate-member", userId, operation: "promote" });
      await service.mutate(slug, "mod", { action: "join" }); assert.equal((await service.detail(slug, "mod", 1)).membership.role, "moderator");
      for (const userId of ["owner", "mod", "mod2"]) await assert.rejects(service.mutate(slug, "mod", { action: "moderate-member", userId, operation: "ban" }), denied(403));
      await assert.rejects(service.mutate(slug, "mod", { action: "moderate-member", userId: "member", operation: "promote" }), denied(403));
      await service.mutate(slug, "mod", { action: "moderate-member", userId: "member", operation: "ban" });
      for (const action of ["join", "leave", "create-post", "comment"]) await assert.rejects(service.mutate(slug, "member", { action, title: "Başlık", body: "Yorum", postId }), denied(403));
      await service.mutate(slug, "owner", { action: "moderate-member", userId: "member", operation: "unban" });
      await service.mutate(slug, "member", { action: "leave" });
      await assert.rejects(service.mutate(slug, "member", { action: "comment", postId, body: "Yorum" }), denied(403));
      await service.mutate(slug, "member", { action: "join" });
    });
    await t.test("iki yönlü engelleme ve kaldırılmış içerik korunur", async () => {
      await db.userBlock.create({ data: { blockerId: "owner", blockedId: "member" } });
      assert.equal((await service.detail(slug, "owner", 1)).posts.length, 0);
      await assert.rejects(service.post(slug, postId, "owner", 1), denied(404));
      const ownerPost = (await service.mutate(slug, "owner", { action: "create-post", title: "Kurucu konusu", body: "Açıklama" })).post.id;
      await assert.rejects(service.post(slug, ownerPost, "member", 1), denied(404));
      await service.mutate(slug, "mod", { action: "comment", postId, body: "İkinci yorum" });
      const childId = (await service.post(slug, postId, "member", 1)).comments[0].id;
      await service.mutate(slug, "member", { action: "report", postId, commentId: childId, reason: "Yorum bildirimi" });
      await service.mutate(slug, "member", { action: "remove-post", postId });
      assert.equal(await db.communityReport.count({ where: { status: "pending" } }), 0);
      await assert.rejects(service.post(slug, postId, null, 1), denied(404));
      await assert.rejects(service.mutate(slug, "member", { action: "comment", postId, body: "Yorum" }), denied(404));
    });
    await t.test("liste ve sohbetler sınırlı, sıralı ve filtrelenebilir", async () => {
      const found = await service.directory("member", "Kutu", "interest", 1, true); assert.equal(found.total, 1);
      const community = await db.community.findUniqueOrThrow({ where: { slug } });
      for (let i = 0; i < 22; i++) await db.communityPost.create({ data: { communityId: community.id, authorId: "member", title: `Sohbet ${i}`, body: "Kısa açıklama" } });
      const first = await service.detail(slug, null, 1), next = await service.detail(slug, null, 2);
      assert.equal(first.posts.length, 20); assert.equal(first.hasMore, true); assert.equal(next.posts.length, 3); assert.equal(next.hasMore, false);
      assert.equal(new Set([...first.posts, ...next.posts].map(x => x.id)).size, 23);
      for (let i = 0; i < 41; i++) await db.communityComment.create({ data: { postId: first.posts[0].id, authorId: "member", body: `Yorum ${i}` } });
      assert.equal((await service.post(slug, first.posts[0].id, null, 1)).comments.length, 40);
      assert.equal((await service.post(slug, first.posts[0].id, null, 2)).comments.length, 1);
      assert.equal((await db.$queryRawUnsafe("PRAGMA quick_check"))[0].quick_check, "ok");
    });
  } finally {
    await db.$disconnect();
    // Only this test's unique OS temporary directory is removed.
    await rm(directory, { recursive: true, force: true });
  }
});

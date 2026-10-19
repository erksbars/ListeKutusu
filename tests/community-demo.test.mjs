import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedCommunityDemo, demoCounts, assertLocalDemoEnvironment } from "../scripts/seed-community-demo.mjs";
import { demoUsers, demoCommunities, demoMembers, demoPosts } from "../scripts/community-demo-data.mjs";
import { createCommunities } from "../lib/communities.ts";

test("demo seed üretim ve uzak ortama yazmayı engeller", () => {
  const local = { DATABASE_URL: "file:./test.db", APP_URL: "http://127.0.0.1:3000" };
  assert.doesNotThrow(() => assertLocalDemoEnvironment(local));
  for (const change of [{ NODE_ENV: "production" }, { APP_URL: "https://example.com" }, { DATABASE_URL: "postgresql://example" }]) assert.throws(() => assertLocalDemoEnvironment({ ...local, ...change }));
});

test("demo seed SQLite koruma, çakışma rollback ve tekrar çalıştırma", async t => {
  const directory = await mkdtemp(path.join(tmpdir(), "listekutusu-demo-seed-test-"));
  const db = new PrismaClient({ datasources: { db: { url: `file:${path.join(directory, "test.db").replaceAll("\\", "/")}` } } });
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const folder of (await readdir(root, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort()) {
      const sql = await readFile(new URL(`${folder}/migration.sql`, root), "utf8");
      for (const statement of sql.split(";").map(item => item.trim()).filter(Boolean)) await db.$executeRawUnsafe(statement);
    }
    const original = await db.userList.create({ data: { ownerName: "Mevcut Kullanıcı", slug: "original-user", bio: "Korunacak biyografi" } });
    const community = await db.community.create({ data: { ownerId: original.id, slug: demoCommunities[0].slug, name: "Mevcut topluluk", description: "Korunacak açıklama", category: "interest", rules: "Korunacak kurallar" } });
    await t.test("ayrılmış demo kimliği başka kayda aitse bütün işlem geri alınır", async () => {
      await assert.rejects(seedCommunityDemo(db), /kimliği mevcut bir kayıtla çakışıyor/);
      assert.equal(await db.userList.count(), 1); assert.equal(await db.community.count(), 1);
      assert.deepEqual(await db.userList.findUnique({ where: { id: original.id } }), original);
    });
    await db.community.update({ where: { id: community.id }, data: { slug: "original-community" } });
    await t.test("tüm örnekler ürün kurallarıyla uyumludur, hesaplar girişe kapalıdır", async () => {
      assert.deepEqual(await seedCommunityDemo(db), demoCounts);
      assert.equal(await db.userList.count(), 9); assert.equal(await db.community.count(), 9);
      assert.equal(await db.communityPost.count(), 32); assert.equal(await db.communityComment.count(), 64);
      assert.equal(await db.communityMember.count(), 40);
      const users = await db.userList.findMany({ where: { id: { in: demoUsers.map(user => user.id) } } });
      assert.ok(users.every(user => user.passwordHash === null && user.role === "member" && user.ownerName.startsWith("Demo ·")));
      const service = createCommunities(db);
      for (const fixture of demoCommunities) {
        const detail = await service.detail(fixture.slug, fixture.ownerId, 1);
        assert.equal(detail.community.memberCount, 5); assert.equal(detail.membership.role, "owner"); assert.equal(detail.posts.length, 4);
      }
      for (const post of demoPosts) assert.ok(demoMembers.some(member => member.communityId === post.communityId && member.userId === post.authorId));
      const kinds = new Set((await db.communityPost.findMany({ where: { type: "review" } })).map(post => post.reviewKind));
      assert.equal(kinds.size, 6);
    });
    await t.test("ikinci çalıştırma kayıt çoğaltmaz, kullanıcı değişikliklerini geri almaz", async () => {
      await db.userList.update({ where: { id: demoUsers[0].id }, data: { bio: "Demo üzerinde kendi düzenlemem" } });
      await db.communityPost.update({ where: { id: demoPosts[0].id }, data: { status: "removed" } });
      const member = demoMembers.find(item => item.role === "member");
      await db.communityMember.update({ where: { communityId_userId: { communityId: member.communityId, userId: member.userId } }, data: { status: "banned" } });
      await seedCommunityDemo(db);
      assert.equal(await db.communityPost.count(), 32); assert.equal(await db.communityComment.count(), 64); assert.equal(await db.userList.count(), 9);
      assert.equal((await db.userList.findUnique({ where: { id: demoUsers[0].id } })).bio, "Demo üzerinde kendi düzenlemem");
      assert.equal((await db.communityPost.findUnique({ where: { id: demoPosts[0].id } })).status, "removed");
      assert.equal((await db.communityMember.findUnique({ where: { communityId_userId: { communityId: member.communityId, userId: member.userId } } })).status, "banned");
      assert.deepEqual(await db.userList.findUnique({ where: { id: original.id } }), original);
      assert.equal((await db.community.findUnique({ where: { id: community.id } })).description, community.description);
      assert.equal((await db.$queryRawUnsafe("PRAGMA quick_check"))[0].quick_check, "ok");
    });
  } finally {
    await db.$disconnect();
    // Only the unique directory created by this test is removed.
    await rm(directory, { recursive: true, force: true });
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { socialSearch } from "../lib/socialSearch.ts";
import { searchPath, searchQuery, searchScope } from "../lib/socialSearchTypes.ts";

function database(rows = {}) {
  const calls = [];
  const db = Object.fromEntries(["userList", "community", "feedPost", "communityPost", "communityEvent"].map(model => [model, { findMany: async options => { calls.push({ model, ...options }); return rows[model] ?? []; } }]));
  return { db, calls };
}
test("ortak arama URL'si tek hedefi ve sınırlı tür/sayfa sözleşmesini korur", () => {
  assert.equal(searchQuery("  film   kulübü  "), "film kulübü");
  assert.equal(searchQuery("x".repeat(120)).length, 100);
  assert.equal(searchScope("__proto__"), "all");
  assert.equal(searchScope("people"), "people");
  const url = new URL(searchPath("a&b /?", "communities", 2), "https://local.invalid");
  assert.equal(url.pathname, "/search"); assert.equal(url.searchParams.get("q"), "a&b /?");
  assert.equal(url.searchParams.get("type"), "communities"); assert.equal(url.searchParams.get("page"), "2");
  assert.equal(searchPath("", "all", 51), "/search");
});
test("iki karakterden kısa sorgu DB çalıştırmaz; öneriler yalnız kimlik arar", async () => {
  const { db, calls } = database();
  await socialSearch(db, null, "a"); assert.equal(calls.length, 0);
  await socialSearch(db, null, "film", "all", 1, true);
  assert.deepEqual(calls.map(item => item.model), ["userList", "community"]);
  assert.ok(calls.every(item => item.take === 4 && item.skip === 0));
});
test("genel arama engel, gizleme, topluluğa özel dağıtım ve spoiler sınırlarını uygular", async () => {
  const { db, calls } = database();
  await socialSearch(db, "viewer", "film");
  const people = calls.find(item => item.model === "userList");
  assert.equal(people.where.status, "active");
  assert.deepEqual(people.where.blocksInitiated, { none: { blockedId: "viewer" } });
  assert.deepEqual(people.where.blocksReceived, { none: { blockerId: "viewer" } });
  const music = calls.find(item => item.model === "feedPost");
  assert.deepEqual(music.where.hides, { none: { userId: "viewer" } });
  const posts = calls.find(item => item.model === "communityPost");
  assert.equal(posts.where.distribution, "general"); assert.equal(posts.where.status, "published");
  assert.equal(posts.where.community.status, "active");
  assert.ok(posts.where.OR.filter(item => item.body).every(item => item.spoiler === false));
  const events = calls.find(item => item.model === "communityEvent");
  assert.equal(events.where.distribution, "general"); assert.equal(events.where.status, "scheduled");
  assert.ok(events.where.startsAt.gt instanceof Date);
  for (const call of calls) {
    assert.ok(call.select); assert.equal(call.select.email, undefined); assert.equal(call.select.passwordHash, undefined);
    assert.equal(call.select.participants, undefined); assert.equal(call.select.location, undefined);
  }
});
test("spoiler gövdesi DTO'ya çıkmaz; müzik, inceleme, etkinlik tek sonuçta güvenli hedeflerle birleşir", async () => {
  const author = { ownerName: "İsim", slug: "kişi/?" }, community = { name: "Sinema", slug: "film/?" };
  const { db } = database({
    feedPost: [{ id: "m1", trackName: "Parça", artistName: "Sanatçı", note: "Not", createdAt: new Date("2026-01-01"), author }],
    communityPost: [{ id: "p1", title: "İnceleme", body: "GİZLİ SPOILER", spoiler: true, type: "review", createdAt: new Date("2026-01-03"), author, community }],
    communityEvent: [{ id: "e1", title: "Etkinlik", description: "Açık duyuru", createdAt: new Date("2026-01-02"), organizer: author, community }],
  });
  const result = await socialSearch(db, null, "film");
  assert.deepEqual(result.posts.map(item => item.kind), ["review", "event", "music"]);
  assert.ok(!JSON.stringify(result).includes("GİZLİ SPOILER"));
  assert.equal(result.posts[0].href, "/communities/film%2F%3F?post=p1");
  assert.equal(result.posts[0].authorHref, "/u/ki%C5%9Fi%2F%3F");
});
test("tür daraltma gereksiz veri kaynaklarını sorgulamaz ve sayfalama sınırlıdır", async () => {
  const { db, calls } = database({ community: Array.from({ length: 11 }, (_, i) => ({ id: String(i), slug: String(i), name: "Film", description: "", _count: { members: 1 } })) });
  const result = await socialSearch(db, null, "film", "communities", 2);
  assert.equal(calls.length, 1); assert.equal(calls[0].model, "community");
  assert.equal(calls[0].skip, 10); assert.equal(calls[0].take, 11);
  assert.equal(result.communities.length, 10); assert.equal(result.hasMore, true);
  assert.equal((await socialSearch(db, null, "film", "communities", 50)).hasMore, false);
});

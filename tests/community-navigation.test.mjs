import assert from "node:assert/strict";
import test from "node:test";
import { communityNavigationFromParams as read, communityNavigationParams as patch } from "../lib/communityNavigation.ts";
const params = query => new URLSearchParams(query);
test("topluluk gezinme varsayılanı ve eski bağlantılar", () => {
  assert.deepEqual(read(params("")), { section: "posts", postId: null, eventId: null, page: 1, commentPage: 1, eventPage: 1, eventFilter: "upcoming", postType: "all", reviewKind: "all", savedOnly: false, cursor: null, kind: "all" });
  assert.equal(read(params("post=abc_123")).postId, "abc_123");
  assert.equal(read(params("event=evt-42")).section, "events");
  assert.equal(read(params("event=evt-42")).kind, "event");
  assert.equal(read(params("postType=review")).kind, "review");
  assert.equal(read(params("kind=discussion&section=events")).kind, "discussion");
  assert.equal(read(params("section=events&post=abc&event=evt-42")).postId, null);
});
test("kimlik ve sayfa sınırları güvenli varsayılana döner", () => {
  for (const value of ["0", "101", "-1", "1.5", "01", "999999", "NaN"]) {
    const valueRead = read(params(`page=${value}&commentsPage=${value}&eventPage=${value}`));
    assert.equal(valueRead.page, 1); assert.equal(valueRead.commentPage, 1); assert.equal(valueRead.eventPage, 1);
  }
  for (const value of ["../other", "<script>", "x".repeat(101)]) assert.equal(read(new URLSearchParams({ post: value })).postId, null);
  assert.equal(read(params("page=100&filter=invalid")).page, 100); assert.equal(read(params("filter=invalid")).eventFilter, "upcoming");
});
test("liste sayfası/filtre detayda kalır; sekme değişimi çakışan hedefi temizler", () => {
  const listing = params("section=events&filter=cancelled&eventPage=2&page=3&ref=keep");
  const detail = patch(listing, { eventId: "evt" });
  assert.equal(read(detail).eventPage, 2); assert.equal(read(detail).eventFilter, "cancelled");
  const returned = patch(detail, { eventId: null }); assert.deepEqual(read(returned), read(listing));
  const post = patch(detail, { section: "posts", postId: "abc", commentPage: 2 });
  assert.equal(read(post).eventId, null); assert.equal(read(post).commentPage, 2); assert.equal(post.get("ref"), "keep");
  assert.equal(patch(post, { section: "events" }).has("post"), false);
});
test("normalizasyon tekrarlı sorguyu ve geçersiz state'i temizler; varsayılanlar URL'ye yazılmaz", () => {
  const value = patch(params("page=2&page=3&post=abc&commentsPage=2"), { page: 999, postId: "../bad", commentPage: 1 });
  assert.equal(read(value).page, 1); assert.equal(value.getAll("page").length, 0); assert.equal(value.has("post"), false); assert.equal(value.has("commentsPage"), false);
  assert.equal(patch(params(""), { section: "posts", page: 1 }).toString(), "");
});

test("karma liste konumu detay/yorum ve geri dönüşte korunur", () => {
  const cursor = Buffer.from(JSON.stringify({ kind: "post", id: "post-42", createdAt: "2026-10-30T12:00:00.000Z" })).toString("base64url");
  const listing = new URLSearchParams({ cursor, page: "3", ref: "keep" });
  const detail = patch(listing, { postId: "post-42", commentPage: 2 });
  assert.equal(read(detail).cursor, cursor); assert.equal(read(detail).page, 3);
  assert.equal(read(detail).commentPage, 2); assert.equal(detail.get("ref"), "keep");
  const returned = patch(detail, { postId: null, commentPage: 1 });
  assert.deepEqual(read(returned), read(listing));
  const events = new URLSearchParams({ section: "events", filter: "cancelled", eventPage: "4", cursor });
  const eventDetail = patch(events, { eventId: "event-42" });
  assert.equal(read(eventDetail).cursor, cursor); assert.equal(read(eventDetail).eventPage, 4);
  assert.deepEqual(read(patch(eventDetail, { eventId: null })), read(events));
  const mixedEvent = patch(listing, { section: "events", eventId: "event-42" });
  assert.equal(read(mixedEvent).kind, "all"); assert.equal(mixedEvent.get("kind"), "all");
  assert.equal(read(mixedEvent).cursor, cursor); assert.equal(read(mixedEvent).page, 3);
  assert.deepEqual(read(patch(mixedEvent, { section: "posts", eventId: null })), read(listing));
  const eventPost = patch(events, { section: "posts", postId: "post-42" });
  assert.equal(read(eventPost).kind, "event"); assert.equal(read(eventPost).cursor, cursor);
  assert.deepEqual(read(patch(eventPost, { section: "events", postId: null })), read(events));
});

test("liste kapsamı değiştiğinde eski konum ve aktif bölüm sayfası temizlenir", () => {
  const cursor = "dGltZWxpbmUtNDI";
  const changes = [
    { query: "page=3", update: { section: "events" }, pageKey: "eventPage" },
    { query: "section=events&eventPage=3", update: { section: "posts" }, pageKey: "page" },
    { query: "page=3", update: { postType: "review" }, pageKey: "page" },
    { query: "page=3", update: { kind: "discussion" }, pageKey: "page" },
    { query: "page=3&postType=review", update: { reviewKind: "book" }, pageKey: "page" },
    { query: "page=3", update: { savedOnly: true }, pageKey: "page" },
    { query: "section=events&eventPage=3", update: { eventFilter: "past" }, pageKey: "eventPage" },
  ];
  for (const { query, update, pageKey } of changes) {
    const initial = params(query); initial.set("cursor", cursor);
    const next = patch(initial, { ...update, cursor });
    assert.equal(read(next).cursor, null, JSON.stringify(update));
    assert.equal(next.has("cursor"), false); assert.equal(read(next)[pageKey], 1);
  }
  const unchanged = params(`page=3&postType=review&reviewKind=book&cursor=${cursor}`);
  assert.equal(read(patch(unchanged, { postType: "review", reviewKind: "book" })).cursor, cursor);
  assert.equal(read(patch(unchanged, { postType: "review", reviewKind: "book" })).page, 3);
  const modern = params(`kind=all&section=events&page=3&cursor=${cursor}`);
  assert.equal(read(patch(modern, { section: "events" })).kind, "event");
  assert.equal(read(patch(modern, { section: "events" })).cursor, null);
  assert.equal(read(patch(modern, { kind: "all", section: "events" })).cursor, cursor);
});

test("konum URL değeri sınırlıdır; bozuk ve tekrarlı değerler normalize edilir", () => {
  for (const cursor of ["", "a".repeat(401), "../bad", "a+b", "a/b", "a=b", "a b", "şifre", "<script>"]) {
    const query = new URLSearchParams({ cursor });
    assert.equal(read(query).cursor, null);
    assert.equal(patch(query, {}).has("cursor"), false);
    assert.equal(patch(params(""), { cursor }).has("cursor"), false);
  }
  const boundary = "a".repeat(400);
  assert.equal(read(new URLSearchParams({ cursor: boundary })).cursor, boundary);
  const repeated = params("cursor=first_42&cursor=second-42&page=3");
  const next = patch(repeated, {});
  assert.deepEqual(next.getAll("cursor"), ["first_42"]); assert.equal(read(next).page, 3);
  assert.equal(read(patch(params(""), { cursor: null })).cursor, null);
  assert.equal(read(params("kind=toString&section=events")).kind, "event");
  assert.equal(read(params("kind=invalid&postType=review")).kind, "review");
  assert.equal(patch(params("kind=invalid"), {}).has("kind"), false);
});

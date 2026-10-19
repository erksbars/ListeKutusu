import assert from "node:assert/strict";
import test from "node:test";
import { communityNavigationFromParams as read, communityNavigationParams as patch } from "../lib/communityNavigation.ts";
const params = query => new URLSearchParams(query);
test("topluluk gezinme varsayılanı ve eski bağlantılar", () => {
  assert.deepEqual(read(params("")), { section: "posts", postId: null, eventId: null, page: 1, commentPage: 1, eventPage: 1, eventFilter: "upcoming", postType: "all", reviewKind: "all", savedOnly: false });
  assert.equal(read(params("post=abc_123")).postId, "abc_123");
  assert.equal(read(params("event=evt-42")).section, "events");
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

import test from "node:test";
import assert from "node:assert/strict";
import { isFeedComment, parseFeedCommentList } from "../lib/feedCommentPayload.ts";
import { parseCommentHandoff, COMMENT_HANDOFF_TTL } from "../lib/commentHandoff.ts";

const root = { id: "root", postId: "post", parentId: null, authorId: "owner", body: "Yorum", createdAt: "2026-10-27T12:00:00Z", author: { id: "owner", ownerName: "Yazar", slug: "yazar", profileTheme: "cyan" }, replies: [] };
test("read payload normalizes Prisma reply leaves without mutating the response", () => {
  const reply = { ...root, id: "reply", parentId: "root" }; delete reply.replies;
  const data = { comments: [{ ...root, replies: [reply] }], total: 2 };
  assert.deepEqual(parseFeedCommentList(data, "post").comments[0].replies[0].replies, []);
  assert.equal(reply.replies, undefined);
});
test("invalid render data and mismatched or duplicate thread records are rejected", () => {
  for (const value of [null, {}, { ...root, createdAt: "invalid" }, { ...root, author: null }, { ...root, replies: [{}] }]) assert.equal(isFeedComment(value), false);
  for (const data of [{ comments: [root, root], total: 2 }, { comments: [root], total: 0 }, { comments: [{ ...root, postId: "other" }], total: 1 }, { comments: [{ ...root, replies: [{ ...root, id: "child", parentId: "wrong" }] }], total: 2 }]) assert.equal(parseFeedCommentList(data, "post"), null);
  assert.equal(isFeedComment(root, true), true);
});
const handoff = { viewerId: "owner", postId: "post", body: "Korunan metin", createdAt: 1000, reply: { id: "root", ownerName: "Yazar" } };
test("login handoff is bound to the same account and post and expires after fifteen minutes", () => {
  const raw = JSON.stringify(handoff);
  assert.deepEqual(parseCommentHandoff(raw, "owner", "post", 1001), handoff);
  assert.equal(parseCommentHandoff(raw, "other", "post", 1001), null);
  assert.equal(parseCommentHandoff(raw, "owner", "other", 1001), null);
  assert.equal(parseCommentHandoff(raw, "owner", "post", 1000 + COMMENT_HANDOFF_TTL + 1), null);
  assert.equal(parseCommentHandoff(raw, "owner", "post", 999), null);
});
test("malformed or oversized handoffs cannot populate the composer", () => {
  for (const raw of [null, "{", "null", JSON.stringify({ ...handoff, body: "a".repeat(801) }), JSON.stringify({ ...handoff, reply: {} }), "x".repeat(12001)]) assert.equal(parseCommentHandoff(raw, "owner", "post", 1001), null);
});

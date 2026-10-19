import test from "node:test";
import assert from "node:assert/strict";
import { commentReplyTransition, removeCommentFromList } from "../lib/commentDraft.ts";

test("reply switching, cancellation and root-to-reply require explicit discard when text exists", () => {
  for (const [current, next] of [[null, "a"], ["a", "b"], ["a", null]]) assert.equal(commentReplyTransition(current, next, "Korunacak taslak", false), "confirm");
  assert.equal(commentReplyTransition("a", "a", "Taslak", false), "unchanged");
  assert.equal(commentReplyTransition(null, "a", "", false), "apply");
  assert.equal(commentReplyTransition("a", "b", "", true), "blocked");
});
test("removal counts root and replies without mutating the original list", () => {
  const items = [{ id: "a", body: "Korunur", replies: [{ id: "a1" }, { id: "a2" }] }, { id: "b", replies: [] }];
  assert.deepEqual(removeCommentFromList(items, "a"), { removedCount: 3, comments: [items[1]] });
  assert.equal(removeCommentFromList(items, "a1").removedCount, 1);
  assert.deepEqual(removeCommentFromList(items, "a1").comments[0].replies, [{ id: "a2" }]);
  assert.equal(items[0].replies.length, 2);
  assert.equal(removeCommentFromList(items, "missing").removedCount, 0);
});

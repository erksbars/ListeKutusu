import test from "node:test";
import assert from "node:assert/strict";
import { draftHistoryScope, installDraftHistoryGuard } from "../lib/draftHistory.ts";

const base = "http://127.0.0.1:3000";
test("history scopes distinguish safe hash/comment pages, local context and page exits", () => {
  assert.equal(draftHistoryScope(`${base}/p/a`, `${base}/p/a#comments`), "none");
  assert.equal(draftHistoryScope(`${base}/communities/a?post=p`, `${base}/communities/a?post=p&commentsPage=2`), "none");
  assert.equal(draftHistoryScope(`${base}/communities/a?post=p`, `${base}/communities/a?section=events`), "local");
  assert.equal(draftHistoryScope(`${base}/communities/a`, `${base}/communities/b`), "page");
  assert.equal(draftHistoryScope(`${base}/account?tab=profile`, `${base}/account?tab=security`), "page");
});

function fixture() {
  const entries = [0, 1, 2].map(index => ({ key: `k${index}`, index, url: `${base}/p/${index}`, sameDocument: true }));
  const navigation = Object.assign(new EventTarget(), { currentEntry: entries[1], entries: () => entries });
  const callbacks = [], moves = [], delivered = [];
  let busy = false;
  const host = Object.assign(new EventTarget(), { history: { go: delta => moves.push(delta) } });
  const cleanup = installDraftHistoryGuard(host, navigation, () => true, proceed => { if (!busy) callbacks.push(proceed); });
  host.addEventListener("popstate", () => delivered.push(navigation.currentEntry.key));
  function traverse(index) {
    navigation.currentEntry = entries[index];
    navigation.dispatchEvent(Object.assign(new Event("currententrychange"), { navigationType: "traverse" }));
    host.dispatchEvent(new Event("popstate"));
  }
  return { entries, navigation, callbacks, moves, delivered, cleanup, traverse, setBusy: value => { busy = value; } };
}
test("back is parked without dispatching downstream; cancel keeps the active entry and replay uses its original destination", () => {
  const f = fixture();
  f.traverse(0); assert.deepEqual(f.moves, [1]); assert.deepEqual(f.delivered, []);
  f.traverse(1); assert.equal(f.callbacks.length, 1); assert.deepEqual(f.delivered, []);
  // Cancelling simply does not invoke the callback. A later Forward remains independent.
  f.traverse(2); f.traverse(1);
  f.callbacks[1](); assert.deepEqual(f.moves, [1, -1, 1]);
  f.traverse(2); assert.deepEqual(f.delivered, ["k2"]);
  f.cleanup();
});
test("busy rejection restores the current entry and cleanup removes the guard", () => {
  const f = fixture(); f.setBusy(true); f.traverse(0); f.traverse(1);
  assert.equal(f.callbacks.length, 0); assert.deepEqual(f.delivered, []);
  f.cleanup(); f.traverse(0); assert.deepEqual(f.delivered, ["k0"]);
});
test("push/replace updates the active entry and multi-entry jumps are restored by their exact delta", () => {
  const f = fixture(); f.navigation.currentEntry = f.entries[2];
  f.navigation.dispatchEvent(Object.assign(new Event("currententrychange"), { navigationType: "push" }));
  f.traverse(0); assert.deepEqual(f.moves, [2]);
  f.traverse(2); f.callbacks[0](); assert.deepEqual(f.moves, [2, -2]);
  f.traverse(0); assert.deepEqual(f.delivered, ["k0"]); f.cleanup();
});

test("a second traversal during restoration schedules a fresh exact return instead of leaving the guard parked", () => {
  const f = fixture();
  f.navigation.currentEntry = f.entries[2];
  f.navigation.dispatchEvent(Object.assign(new Event("currententrychange"), { navigationType: "push" }));
  f.traverse(1); f.traverse(0);
  assert.deepEqual(f.moves, [1, 2]); assert.deepEqual(f.delivered, []);
  f.traverse(2); assert.equal(f.callbacks.length, 1);
  f.callbacks[0](); assert.deepEqual(f.moves, [1, 2, -1]);
  f.traverse(1); assert.deepEqual(f.delivered, ["k1"]); f.cleanup();
});

test("a removed destination cannot replay into an unrelated history entry", () => {
  const f = fixture(); f.traverse(0); f.traverse(1);
  f.navigation.entries = () => f.entries.slice(1);
  f.callbacks[0](); assert.deepEqual(f.moves, [1]); f.cleanup();
});

test("cross-document traversals are left to the existing unload protection", () => {
  const f = fixture(); f.entries[0].sameDocument = false; f.traverse(0);
  assert.deepEqual(f.moves, []); assert.deepEqual(f.delivered, ["k0"]); f.cleanup();
});

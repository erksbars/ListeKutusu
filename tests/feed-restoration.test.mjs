import test from "node:test";
import assert from "node:assert/strict";
import { FEED_RETURN_PAGE_BUDGET, feedReturnPhase, readFeedAnchor } from "../lib/feedRestoration.ts";

const base = { target: "#post-community-post-example", ready: true, found: false, loading: false, error: null, cursor: "page-2", requests: 0, seen: [] };

test("return anchors accept only bounded public card identifiers", () => {
  assert.equal(readFeedAnchor("#post-community-event-abc"), "#post-community-event-abc");
  assert.equal(readFeedAnchor("#post-music-id"), "#post-music-id");
  for (const hash of ["", "#comments", "#post-", "#post-../secret", "#post-abc?token=x", `#post-${"a".repeat(161)}`]) assert.equal(readFeedAnchor(hash), null);
});

test("no requests without source or current data; an already visible card wins", () => {
  assert.equal(feedReturnPhase({ ...base, target: null }), "idle");
  assert.equal(feedReturnPhase({ ...base, target: "#comments" }), "idle");
  assert.equal(feedReturnPhase({ ...base, ready: false }), "idle");
  assert.equal(feedReturnPhase({ ...base, found: true, requests: 3, error: "old" }), "found");
});

test("automatic return lookup is limited to three additional pages", () => {
  assert.equal(FEED_RETURN_PAGE_BUDGET, 3);
  for (let requests = 0; requests < FEED_RETURN_PAGE_BUDGET; requests++) assert.equal(feedReturnPhase({ ...base, requests }), "searching");
  for (const requests of [3, 4, 100]) assert.equal(feedReturnPhase({ ...base, requests }), "paused");
  assert.equal(feedReturnPhase({ ...base, requests: 3, loading: true }), "searching");
});

test("end, errors and repeated cursor stop lookup instead of looping", () => {
  assert.equal(feedReturnPhase({ ...base, cursor: null }), "missing");
  assert.equal(feedReturnPhase({ ...base, error: "offline" }), "error");
  assert.equal(feedReturnPhase({ ...base, seen: ["page-2"] }), "stalled");
  assert.equal(feedReturnPhase({ ...base, requests: 3, cursor: null }), "missing");
});

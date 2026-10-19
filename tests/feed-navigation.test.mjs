import test from "node:test";
import assert from "node:assert/strict";
import { parseFeedLocation, feedLocationPath, feedReturnPath, feedPostPath } from "../lib/feedNavigation.ts";

test("feed filters are normalized and topic only applies to a music view", () => {
  assert.deepEqual(parseFeedLocation(new URLSearchParams("scope=trending&kind=event&topic= ROCK ")), { scope: "trending", kind: "all", topic: "rock" });
  assert.equal(feedLocationPath({ scope: "all", kind: "music", topic: "Rock" }), "/?kind=music&topic=rock");
  assert.equal(parseFeedLocation(new URLSearchParams("kind=review&topic=rock")).topic, null);
  assert.deepEqual(parseFeedLocation(new URLSearchParams("scope=bad&kind=bad")), { scope: "all", kind: "all", topic: null });
  assert.equal(parseFeedLocation(new URLSearchParams({ topic: "x".repeat(65), kind: "music" })).topic, null);
});
test("detail return accepts only whitelisted root filters and a public card anchor", () => {
  assert.equal(feedReturnPath("/?kind=music&topic=rock&token=private#post-abc"), "/?kind=music&topic=rock#post-abc");
  for (const value of ["https://evil.test", "//evil.test", "/\\evil", "/account", "/%2f/evil", "/\n?kind=music", null]) assert.equal(feedReturnPath(value), "/");
  assert.equal(feedReturnPath("/#comments"), "/");
  assert.equal(feedReturnPath("/?scope=saved&next=//evil"), "/?scope=saved");
});
test("detail and comment links keep the same canonical source card", () => {
  const result = new URL(feedPostPath("public-id", "/?kind=music&topic=Rock", true), "https://example.test");
  assert.equal(result.pathname, "/p/public-id");
  assert.equal(result.hash, "#comments");
  assert.equal(result.searchParams.get("from"), "/?kind=music&topic=rock#post-public-id");
});

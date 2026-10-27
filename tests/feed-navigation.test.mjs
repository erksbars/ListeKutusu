import test from "node:test";
import assert from "node:assert/strict";
import { parseFeedLocation, feedLocationPath, feedReturnPath, feedPostPath, communityFeedAnchor, communityFeedPath, communityFeedReturn } from "../lib/feedNavigation.ts";
import { communityNavigationParams } from "../lib/communityNavigation.ts";

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

test("community post and event links use separate anchors and preserve only feed filters", () => {
  for (const kind of ["post", "event"]) {
    const link = new URL(communityFeedPath("oyun kulübü", kind, "same-id", "/?scope=following&kind=event&token=private#post-other"), "https://example.test");
    assert.equal(link.pathname, "/communities/oyun%20kul%C3%BCb%C3%BC");
    assert.equal(link.searchParams.get(kind === "event" ? "event" : "post"), "same-id");
    assert.equal(link.searchParams.get("from"), `/?scope=following&kind=event#post-community-${kind}-same-id`);
    assert.equal(communityFeedReturn(link.searchParams), link.searchParams.get("from"));
  }
  assert.notEqual(communityFeedAnchor("post", "same-id"), communityFeedAnchor("event", "same-id"));
  assert.equal(communityFeedAnchor("post", "../bad"), "");
  assert.equal(communityFeedAnchor("post", "x".repeat(101)), "");
});

test("community return rejects external, non-feed and unrelated detail sources", () => {
  for (const from of ["https://evil.test/#post-community-post-abc", "//evil.test/#post-community-post-abc", "/account#post-community-post-abc", "/#post-abc", "/#post-community-post-other", "/#post-community-event-abc", "/?kind=review"]) {
    assert.equal(communityFeedReturn(new URLSearchParams({ post: "abc", from })), null);
  }
  assert.equal(communityFeedReturn(new URLSearchParams({ post: "abc", section: "events", from: "/#post-community-post-abc" })), null);
  assert.equal(communityFeedReturn(new URLSearchParams({ post: "abc", from: "/?kind=review&secret=drop#post-community-post-abc" })), "/?kind=review#post-community-post-abc");
  assert.equal(communityFeedReturn(new URLSearchParams({ from: "/#post-community-post-abc" })), null);
});

test("local detail paging retains source but list and target changes detach it", () => {
  const link = new URL(communityFeedPath("games", "post", "abc", "/?kind=discussion"), "https://example.test");
  assert.equal(communityFeedReturn(communityNavigationParams(link.searchParams, { commentPage: 2 })), "/?kind=discussion#post-community-post-abc");
  assert.equal(communityFeedReturn(communityNavigationParams(link.searchParams, { postId: null })), null);
  assert.equal(communityFeedReturn(communityNavigationParams(link.searchParams, { postId: "other" })), null);
  assert.equal(communityFeedReturn(communityNavigationParams(link.searchParams, { section: "events" })), null);
  const event = new URL(communityFeedPath("games", "event", "abc", "/?kind=event"), "https://example.test");
  assert.equal(communityFeedReturn(communityNavigationParams(event.searchParams, { eventId: null })), null);
});

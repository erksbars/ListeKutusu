import test from "node:test";
import assert from "node:assert/strict";
import { validCommunityTimelinePage as valid } from "../lib/communityTimelinePayload.ts";

const slug = "test-community";
const post = () => ({ kind: "post", id: "post-1", title: "Sohbet", createdAt: "2026-10-30T12:00:00.000Z", community: { slug, name: "Topluluk" }, author: { slug: "test-user", ownerName: "Deniz" }, type: "discussion", spoiler: false, content: "Metin", excerpt: "Metin", likeCount: 0, commentCount: 2, canLike: true, canSave: true, viewerLiked: false, viewerSaved: false });
const event = () => ({ ...post(), kind: "event", id: "event-1", startsAt: "2026-11-07T16:00:00.000Z", timeZone: "Europe/Istanbul", city: "İstanbul", venue: "Kamusal mekân", capacity: 12, status: "scheduled" });
const page = (...items) => ({ items, nextCursor: null });

test("valid bounded mixed cards include optional old counts and unlimited events", () => {
  assert.equal(valid(page(post(), event()), slug), true);
  const older = post(); delete older.commentCount;
  assert.equal(valid(page(older, { ...event(), capacity: null }), slug), true);
  assert.equal(valid(page(), slug), true);
});
test("incomplete identity and invalid dates cannot crash the card renderer", () => {
  for (const item of [{ ...post(), author: { slug: "test-user" } }, { ...post(), author: null }, { ...post(), createdAt: "bad" }, { ...event(), startsAt: "bad" }, { ...event(), timeZone: "bad-zone" }, { ...event(), venue: null }]) assert.equal(valid(page(item), slug), false);
});
test("spoiler text, foreign scopes, duplicate cards and malformed pages are rejected", () => {
  assert.equal(valid(page({ ...post(), spoiler: true }), slug), false);
  assert.equal(valid(page({ ...post(), spoiler: true, content: "", excerpt: "" }), slug), true);
  assert.equal(valid(page(post()), "other-community"), false);
  assert.equal(valid(page(post(), post()), slug), false);
  for (const value of [null, {}, { items: [], nextCursor: 2 }, { items: Array.from({ length: 11 }, post), nextCursor: null }]) assert.equal(valid(value, slug), false);
});
test("invalid counters, action capabilities and review values are not applied", () => {
  for (const item of [{ ...post(), likeCount: -1 }, { ...post(), commentCount: "2" }, { ...post(), canSave: "true" }, { ...post(), type: "review", subjectTitle: "Eser", rating: 11 }]) assert.equal(valid(page(item), slug), false);
});

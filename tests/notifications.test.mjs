import assert from "node:assert/strict";
import test from "node:test";
import {
  groupNotifications,
  messageForNotificationGroup,
} from "../lib/notificationPresentation.ts";

function notification(overrides = {}) {
  return {
    id: "notification-1",
    type: "feed_like",
    readAt: null,
    createdAt: "2026-07-23T10:00:00.000Z",
    actor: {
      id: "user-1",
      ownerName: "Deniz",
      slug: "deniz",
      profileTheme: "aurora",
    },
    post: {
      id: "post-1",
      trackName: "Nightcall",
      artistName: "Kavinsky",
    },
    forumThread: null,
    ...overrides,
  };
}

test("aynı hedefteki benzer bildirimler tek grupta birleşir", () => {
  const groups = groupNotifications([
    notification(),
    notification({
      id: "notification-2",
      actor: {
        id: "user-2",
        ownerName: "Ece",
        slug: "ece",
        profileTheme: "pulse",
      },
    }),
    notification({
      id: "notification-3",
      type: "feed_add",
    }),
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].unreadIds, ["notification-1", "notification-2"]);
  assert.equal(
    messageForNotificationGroup(groups[0]),
    "Deniz ve 1 kişi, Nightcall beğendi."
  );
});

test("okunmuş bildirim grup sayısını korur ancak okunmamış listesine girmez", () => {
  const [group] = groupNotifications([
    notification({ readAt: "2026-07-23T10:05:00.000Z" }),
    notification({ id: "notification-2" }),
  ]);

  assert.equal(group.items.length, 2);
  assert.deepEqual(group.unreadIds, ["notification-2"]);
});


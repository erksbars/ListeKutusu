import assert from "node:assert/strict";
import test from "node:test";
import { calculateAchievements } from "../lib/achievements.ts";

test("başarımlar eşiklere göre açılır", () => {
  const result = calculateAchievements({ posts: 1, likes: 1, adds: 0, followers: 1 });
  assert.deepEqual(
    result.unlocked.map((item) => item.id),
    ["first-share", "first-like", "first-follower"]
  );
  assert.equal(result.unlockedCount, 3);
});

test("sıradaki başarım en yüksek ilerlemeye göre seçilir", () => {
  const result = calculateAchievements({ posts: 7, likes: 4, adds: 0, followers: 0 });
  assert.equal(result.next?.id, "steady-curator");
  assert.equal(result.next?.progress, 70);
});

test("başarım ilerlemesi yüzde yüzü aşmaz", () => {
  const result = calculateAchievements({ posts: 100, likes: 100, adds: 100, followers: 100 });
  assert.equal(result.items.every((item) => item.progress === 100 && item.unlocked), true);
  assert.equal(result.next, null);
});

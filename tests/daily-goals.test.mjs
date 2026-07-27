import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailyGoals,
  calculateActivityStreak,
  istanbulDayKey,
} from "../lib/dailyGoals.ts";

test("İstanbul gün sınırı UTC+3 ile hesaplanır", () => {
  assert.equal(istanbulDayKey(new Date("2026-07-14T20:59:00.000Z")), "2026-07-14");
  assert.equal(istanbulDayKey(new Date("2026-07-14T21:01:00.000Z")), "2026-07-15");
});

test("günlük hedefler mevcut aktiviteye göre tamamlanır", () => {
  const result = buildDailyGoals({ shares: 1, likes: 2, adds: 1, follows: 0 });
  assert.equal(result.completedCount, 2);
  assert.equal(result.goals.find((goal) => goal.id === "like")?.progress, 67);
  assert.equal(result.allCompleted, false);
});

test("aktif gün serisi bugünden geriye doğru sayılır", () => {
  const now = new Date("2026-07-14T12:00:00.000Z");
  const streak = calculateActivityStreak(
    [
      new Date("2026-07-14T08:00:00.000Z"),
      new Date("2026-07-13T08:00:00.000Z"),
      new Date("2026-07-12T08:00:00.000Z"),
    ],
    now
  );
  assert.equal(streak, 3);
});

test("bugün boşsa seri dünden devam edebilir", () => {
  const streak = calculateActivityStreak(
    [new Date("2026-07-13T08:00:00.000Z"), new Date("2026-07-12T08:00:00.000Z")],
    new Date("2026-07-14T12:00:00.000Z")
  );
  assert.equal(streak, 2);
});

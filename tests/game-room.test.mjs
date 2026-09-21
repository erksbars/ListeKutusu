import assert from "node:assert/strict";
import test from "node:test";
import { getNextAvailableSeat, getRoomStaleBefore, isRoomReady, isRoomStale } from "../lib/games/room.ts";

test("iki ve dort oyunculu odalarda ilk bos koltugu bulur", () => {
  assert.equal(getNextAvailableSeat([1], 2), 2);
  assert.equal(getNextAvailableSeat([1, 2, 4], 4), 3);
  assert.equal(getNextAvailableSeat([1, 2, 3, 4], 4), null);
});

test("oda ancak butun koltuklar doldugunda baslar", () => {
  assert.equal(isRoomReady(1, 2), false);
  assert.equal(isRoomReady(2, 2), true);
  assert.equal(isRoomReady(3, 4), false);
  assert.equal(isRoomReady(4, 4), true);
});

test("bekleyen ve aktif odalar farkli surelerde zaman asimina ugrar", () => {
  const now = new Date("2026-07-29T12:00:00.000Z");
  assert.equal(getRoomStaleBefore("waiting", now).toISOString(), "2026-07-29T11:45:00.000Z");
  assert.equal(getRoomStaleBefore("active", now).toISOString(), "2026-07-29T11:30:00.000Z");
  assert.equal(isRoomStale("waiting", new Date("2026-07-29T11:44:59.000Z"), now), true);
  assert.equal(isRoomStale("active", new Date("2026-07-29T11:45:00.000Z"), now), false);
});

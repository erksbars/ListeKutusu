import assert from "node:assert/strict";
import test from "node:test";
import { completedProfileGames, profileGamePresentation } from "../lib/profileGames.ts";

test("profil geçmişi katılımcıyı ve eski oda sahibini kapsar, ziyaretçide gizli odaları dışlar", () => {
  assert.deepEqual(completedProfileGames("guest", true), {
    status: "completed", OR: [{ ownerId: "guest" }, { players: { some: { userId: "guest" } } }], visibility: "public",
  });
  assert.equal(completedProfileGames("owner").visibility, undefined);
});

test("oyun geçmişi doğru oyun rotasına gider ve bilinmeyen kod güvenli kalır", () => {
  assert.equal(profileGamePresentation("backgammon", "room").href, "/games/backgammon/room");
  assert.equal(profileGamePresentation("song-elimination", "room").title, "Şarkı Düellosu");
  assert.equal(profileGamePresentation("unknown", "room").href, "/games");
});

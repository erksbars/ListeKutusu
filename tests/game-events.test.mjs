import assert from "node:assert/strict";
import test from "node:test";
import { describeBackgammonAction, describeBackgammonMove, describeDuelDecision, describeDuelVote } from "../lib/games/events.ts";

test("tavla zar ve hamle olaylarini okunabilir metne cevirir", () => {
  assert.deepEqual(describeBackgammonAction("Barış", { type: "roll" }), {
    eventType: "dice_rolled",
    summary: "Barış zar attı.",
  });
  assert.deepEqual(describeBackgammonAction("Barış", { type: "move", from: "bar", to: 20 }), {
    eventType: "checker_moved",
    summary: "Barış, bar konumundan 20. hane konumuna oynadı.",
    metadata: { from: "bar", to: 20 },
  });
});

test("gecici tas secimi mac gunlugune eklenmez", () => {
  assert.equal(describeBackgammonAction("Barış", { type: "point", point: 4 }), null);
  assert.equal(describeBackgammonAction("Barış", { type: "cancel" }), null);
});

test("vurma hamlesini olay metni ve metadata ile ayirir", () => {
  const event = describeBackgammonMove("Barış", { from: 1, to: 3, hit: true });
  assert.equal(event.eventType, "checker_moved");
  assert.equal(event.summary.includes("rakip taşı kırdı"), true);
  assert.deepEqual(event.metadata, { from: 1, to: 3, hit: true });
});

test("pas ve cekilme olaylari ayri turlerde tutulur", () => {
  assert.equal(describeBackgammonAction("Barış", { type: "pass" })?.eventType, "turn_passed");
  assert.equal(describeBackgammonAction("Barış", { type: "resign" })?.eventType, "player_resigned");
});

test("duello oyu sonuc aciklanmadan secilen sarkiyi gizler", () => {
  const event = describeDuelVote("Barış");
  assert.equal(event.eventType, "vote_cast");
  assert.equal(event.summary, "Barış bu eşleşmede oy verdi.");
  assert.equal(event.summary.includes("track-secret"), false);
});

test("duello eslesmesi tamamlandiginda yalniz kazanan parcayi aciklar", () => {
  assert.deepEqual(describeDuelDecision("Teardrop", false), {
    eventType: "matchup_decided",
    summary: "Teardrop bir sonraki tura geçti.",
  });
  assert.equal(describeDuelDecision("Teardrop", true).summary, "Teardrop turnuvayı kazandı.");
});

test("tavla hamlesi animasyon icin pul rengini metadata icinde tasir", () => {
  const event = describeBackgammonMove("Oyuncu", { from: 1, to: 3, hit: true }, "white");
  assert.deepEqual(event.metadata, { from: 1, to: 3, hit: true, color: "white" });
});

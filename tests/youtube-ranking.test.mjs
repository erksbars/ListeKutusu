import assert from "node:assert/strict";
import test from "node:test";
import { scoreYouTubeCandidate } from "../lib/youtube.ts";

test("resmi sanatci kanali yeniden yuklemelerden once gelir", () => {
  const official = scoreYouTubeCandidate(
    { channelTitle: "Scorpions", title: "Still Loving You (Official Video)" },
    "Still Loving You",
    "Scorpions",
  );
  const upload = scoreYouTubeCandidate(
    { channelTitle: "Classic Rock Vault", title: "Scorpions - Still Loving You" },
    "Still Loving You",
    "Scorpions",
  );

  assert.ok(official > upload);
  assert.ok(official >= 145);
  assert.ok(upload < 145);
});

test("VEVO ve Topic kanallari cover sonucundan once gelir", () => {
  const vevo = scoreYouTubeCandidate(
    { channelTitle: "ScorpionsVEVO", title: "Still Loving You" },
    "Still Loving You",
    "Scorpions",
  );
  const topic = scoreYouTubeCandidate(
    { channelTitle: "Scorpions - Topic", title: "Still Loving You" },
    "Still Loving You",
    "Scorpions",
  );
  const cover = scoreYouTubeCandidate(
    { channelTitle: "Guitar Covers", title: "Still Loving You - Scorpions cover tutorial" },
    "Still Loving You",
    "Scorpions",
  );

  assert.ok(vevo > cover);
  assert.ok(topic > cover);
});

test("adinda sanatci gecen hayran kanali resmi sayilmaz", () => {
  const fanUpload = scoreYouTubeCandidate(
    { channelTitle: "digitalscorpions", title: "Scorpions The Best Is Yet to Come Live" },
    "The Best Is Yet to Come",
    "Scorpions",
  );
  const artistChannel = scoreYouTubeCandidate(
    { channelTitle: "Scorpions", title: "The Best Is Yet to Come" },
    "The Best Is Yet to Come",
    "Scorpions",
  );

  assert.ok(fanUpload < 145);
  assert.ok(artistChannel >= 145);
});

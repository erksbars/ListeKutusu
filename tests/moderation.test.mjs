import test from "node:test";
import assert from "node:assert/strict";
import { groupReportsByPost } from "../lib/moderation.ts";

function report(id, postId, reason, reporter) {
  return { id, postId, reason, reporter: { ownerName: reporter, slug: reporter.toLowerCase() } };
}

test("aynı paylaşıma ait raporlar tek moderasyon vakasında gruplanır", () => {
  const grouped = groupReportsByPost([
    report("r1", "p1", "spam", "Ayşe"),
    report("r2", "p1", "abuse", "Deniz"),
    report("r3", "p2", "spam", "Ece"),
  ]);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].reportCount, 2);
  assert.deepEqual(grouped[0].reasons, ["spam", "abuse"]);
  assert.equal(grouped[0].reporters.length, 2);
});

test("aynı neden bir vaka içinde tekrarlanmaz", () => {
  const [grouped] = groupReportsByPost([
    report("r1", "p1", "spam", "Ayşe"),
    report("r2", "p1", "spam", "Deniz"),
  ]);
  assert.deepEqual(grouped.reasons, ["spam"]);
  assert.equal(grouped.reportCount, 2);
});

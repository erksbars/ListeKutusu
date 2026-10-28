import test from "node:test";
import assert from "node:assert/strict";
import { formDraftChanged } from "../lib/formDraft.ts";

test("empty/default creation fields are clean but changing a default choice is dirty", () => {
  const baseline = { name: "", category: "interest" }, data = new FormData();
  data.set("category", "interest"); assert.equal(formDraftChanged(data, baseline), false);
  data.set("category", "university"); assert.equal(formDraftChanged(data, baseline), true);
  data.set("category", "interest"); data.set("name", " "); assert.equal(formDraftChanged(data, baseline), true);
});
test("editing and reverting discovery fields compares with saved values, not non-empty text", () => {
  const baseline = { city: "İstanbul", interest: "music" }, data = new FormData();
  for (const [key, value] of Object.entries(baseline)) data.set(key, value);
  assert.equal(formDraftChanged(data, baseline), false);
  data.set("city", "Ankara"); assert.equal(formDraftChanged(data, baseline), true);
  data.set("city", "İstanbul"); assert.equal(formDraftChanged(data, baseline), false);
  data.delete("interest"); assert.equal(formDraftChanged(data, baseline), true);
});

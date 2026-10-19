import assert from "node:assert/strict";
import test from "node:test";
import { draftExitTarget } from "../lib/draftNavigation.ts";
const current = "http://127.0.0.1:3000/account?tab=profile", normal = { button: 0, modified: false };
test("all internal link exits preserve the exact destination query and fragment", () => {
  assert.equal(draftExitTarget(current, "/library?type=book#list", normal), "/library?type=book#list");
  assert.equal(draftExitTarget(current, "/account?tab=security", normal), "/account?tab=security");
  assert.equal(draftExitTarget(current, "/account?tab=profile#form", normal), null);
});
test("new tabs, downloads, mail and external documents are not hijacked", () => {
  for (const intent of [{ ...normal, modified: true }, { ...normal, button: 1 }, { ...normal, target: "_blank" }, { ...normal, target: "named-tab" }, { ...normal, download: true }]) assert.equal(draftExitTarget(current, "/library", intent), null);
  for (const href of ["https://example.org", "mailto:example@example.org", "javascript:void(0)", "//example.org"]) assert.equal(draftExitTarget(current, href, normal), null);
});

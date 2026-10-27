import assert from "node:assert/strict";
import test from "node:test";
import { draftExitScope, draftExitTarget } from "../lib/draftNavigation.ts";
const current = "http://127.0.0.1:3000/account?tab=profile", normal = { button: 0, modified: false };

test("local exits preserve mounted creation drafts while destructive editors still require confirmation", () => {
  const persistent = { dirty: true, preserveOnLocalNavigation: true }, editor = { dirty: true };
  assert.deepEqual(draftExitScope([persistent, editor], true), { dirty: [editor], busy: false });
  assert.deepEqual(draftExitScope([persistent, editor]), { dirty: [persistent, editor], busy: false });
});

test("busy work blocks even a local transition that would preserve its draft", () => {
  const persistent = { dirty: true, busy: true, preserveOnLocalNavigation: true };
  assert.deepEqual(draftExitScope([persistent], true), { dirty: [], busy: true });
  assert.deepEqual(draftExitScope([{ dirty: false }]), { dirty: [], busy: false });
});
test("all internal link exits preserve the exact destination query and fragment", () => {
  assert.equal(draftExitTarget(current, "/library?type=book#list", normal), "/library?type=book#list");
  assert.equal(draftExitTarget(current, "/account?tab=security", normal), "/account?tab=security");
  assert.equal(draftExitTarget(current, "/account?tab=profile#form", normal), null);
});
test("new tabs, downloads, mail and external documents are not hijacked", () => {
  for (const intent of [{ ...normal, modified: true }, { ...normal, button: 1 }, { ...normal, target: "_blank" }, { ...normal, target: "named-tab" }, { ...normal, download: true }]) assert.equal(draftExitTarget(current, "/library", intent), null);
  for (const href of ["https://example.org", "mailto:example@example.org", "javascript:void(0)", "//example.org"]) assert.equal(draftExitTarget(current, href, normal), null);
});

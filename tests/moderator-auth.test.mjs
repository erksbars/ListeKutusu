import assert from "node:assert/strict";
import test from "node:test";
import { isAssignableCommunityRole, isModerationRole } from "../lib/roles.ts";

test("yalnızca moderatör ve admin forum denetimine erişebilir", () => {
  assert.equal(isModerationRole("moderator"), true);
  assert.equal(isModerationRole("admin"), true);
  assert.equal(isModerationRole("member"), false);
  assert.equal(isModerationRole(null), false);
});

test("yönetim paneli yalnızca üye ve moderatör rollerini atar", () => {
  assert.equal(isAssignableCommunityRole("member"), true);
  assert.equal(isAssignableCommunityRole("moderator"), true);
  assert.equal(isAssignableCommunityRole("admin"), false);
  assert.equal(isAssignableCommunityRole("owner"), false);
});

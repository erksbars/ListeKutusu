import assert from "node:assert/strict";
import test from "node:test";
import { isPrimaryPathActive } from "../lib/primaryNavigation.ts";

test("primary navigation respects route boundaries and personal community contexts", () => {
  for (const route of ["/communities", "/communities/masa", "/community-events", "/community-saved", "/community-cases"]) {
    assert.equal(isPrimaryPathActive(route, "/communities"), true, route);
    assert.equal(isPrimaryPathActive(route, "/"), false, route);
  }
  assert.equal(isPrimaryPathActive("/control", "/library"), true);
  assert.equal(isPrimaryPathActive("/games/backgammon/new", "/games"), true);
  assert.equal(isPrimaryPathActive("/games-other", "/games"), false);
  assert.equal(isPrimaryPathActive("/u/deniz", "/"), false);
  assert.equal(isPrimaryPathActive("/account", "/library"), false);
  assert.equal(isPrimaryPathActive("/", "/"), true);
});

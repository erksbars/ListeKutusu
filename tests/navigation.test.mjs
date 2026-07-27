import assert from "node:assert/strict";
import test from "node:test";
import { accountLoginPath, safeInternalPath } from "../lib/navigation.ts";

test("yalnız uygulama içi dönüş yolları kabul edilir", () => {
  assert.equal(safeInternalPath("/discover?type=track"), "/discover?type=track");
  assert.equal(safeInternalPath("/#feed-composer"), "/#feed-composer");
  assert.equal(safeInternalPath("//example.com"), "/");
  assert.equal(safeInternalPath("https://example.com"), "/");
  assert.equal(safeInternalPath(null), "/");
});

test("giriş adresi hedef rotayı güvenli biçimde kodlar", () => {
  assert.equal(
    accountLoginPath("/suggest?code=EKLE-1234ABCD"),
    "/account?mode=login&next=%2Fsuggest%3Fcode%3DEKLE-1234ABCD"
  );
  assert.equal(accountLoginPath("//example.com"), "/account?mode=login&next=%2F");
});

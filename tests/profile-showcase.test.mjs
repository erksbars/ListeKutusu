import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PROFILE_SHOWCASE, normalizeProfileShowcase } from "../lib/profileShowcase.ts";

test("vitrin sırasını ve görünürlüğünü korur", () => {
  assert.deepEqual(normalizeProfileShowcase(["identity", "featured"]), ["identity", "featured"]);
});

test("tekrarları ve bilinmeyen modülleri temizler", () => {
  assert.deepEqual(normalizeProfileShowcase(["recent", "unknown", "recent"]), ["recent"]);
});

test("boş veya bozuk değer için varsayılan vitrini döndürür", () => {
  assert.deepEqual(normalizeProfileShowcase("bozuk"), DEFAULT_PROFILE_SHOWCASE);
  assert.deepEqual(normalizeProfileShowcase([]), DEFAULT_PROFILE_SHOWCASE);
});

test("forum katkıları küratörlü vitrin modülü olarak kullanılabilir", () => {
  assert.deepEqual(normalizeProfileShowcase(["forum", "featured"]), ["forum", "featured"]);
});

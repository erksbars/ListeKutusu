import assert from "node:assert/strict";
import test from "node:test";
import {
  createForumSlug,
  FORUM_CATEGORY_GROUPS,
  forumCategoryGroup,
  forumCategoryIdsForFilter,
  forumThreadGuidance,
  isForumCategory,
  validateForumReply,
  validateForumThread,
} from "../lib/forum.ts";

test("forum kategorileri yalnızca izin verilen değerleri kabul eder", () => {
  assert.equal(isForumCategory("gitar"), true);
  assert.equal(isForumCategory("ses-kartlari"), true);
  assert.equal(isForumCategory("rastgele"), false);
});

test("forum ana bölümü alt forumlarıyla birlikte filtrelenir", () => {
  const instrumentIds = forumCategoryIdsForFilter("enstrumanlar");
  assert.equal(FORUM_CATEGORY_GROUPS.length, 6);
  assert.equal(instrumentIds.includes("gitar"), true);
  assert.equal(instrumentIds.includes("davul"), true);
  assert.equal(forumCategoryGroup("ses-kartlari").id, "ekipman");
});

test("forum konusu uzunluk ve kategori kurallarını uygular", () => {
  assert.equal(validateForumThread({ category: "gitar", title: "Yeni gitar önerisi", body: "Evde kayıt için başlangıç seviyesinde bir gitar arıyorum." }), null);
  assert.match(validateForumThread({ category: "x", title: "Kısa", body: "az" }) ?? "", /kategori/i);
});

test("forum slug Türkçe başlıktan güvenli adres üretir", () => {
  assert.equal(createForumSlug("Başlangıç İçin Elektro Gitar", "A1B2C3"), "baslangic-icin-elektro-gitar-a1b2c3");
});

test("forum yanıtı uzunluk sınırlarını uygular", () => {
  assert.equal(validateForumReply("Katılıyorum."), null);
  assert.match(validateForumReply("x") ?? "", /2 karakter/i);
});

test("yeni konu yönlendirmesi seçilen ana bölüme göre değişir", () => {
  assert.match(forumThreadGuidance("ses-kartlari").titlePlaceholder, /bütçe/i);
  assert.match(forumThreadGuidance("gitar").bodyPlaceholder, /enstrümanı/i);
  assert.equal(forumThreadGuidance("miks-mastering").checklist.length, 3);
});

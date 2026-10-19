import assert from "node:assert/strict";
import test from "node:test";
import { communityReadKey, communityReadState, communityReadStatus } from "../lib/communityReadState.ts";

test("yanıtsız okuma yükleniyor; pasif okuma hiçbir içerik göstermez", () => {
  const key = communityReadKey("/events?filter=upcoming&page=1", 0);
  assert.deepEqual(communityReadState(null, key, true), { data: null, error: "", loading: true });
  assert.deepEqual(communityReadState(null, key, false), { data: null, error: "", loading: false });
});
test("yalnız URL ve yenileme nesli eşleşen başarı kullanılabilir", () => {
  const key = communityReadKey("/events/a", "0:1"), data = { title: "A", canManage: true, participants: ["private"] };
  const snapshot = { key, data, error: "" };
  assert.equal(communityReadState(snapshot, key, true).data, data);
  for (const changed of [communityReadKey("/events/b", "0:1"), communityReadKey("/events/a", "0:2")]) assert.deepEqual(communityReadState(snapshot, changed, true), { data: null, error: "", loading: true });
  assert.deepEqual(communityReadState(snapshot, key, false), { data: null, error: "", loading: false });
});
test("filtre ve sayfa değişiminde eski liste görünmez", () => {
  const snapshot = { key: communityReadKey("/events?filter=upcoming&page=1", 0), data: { events: ["old"] }, error: "" };
  for (const url of ["/events?filter=past&page=1", "/events?filter=upcoming&page=2"]) assert.equal(communityReadState(snapshot, communityReadKey(url, 0), true).data, null);
});
test("eski hedefin hatası yeni hedefe taşınmaz; güncel hata yeniden denemeye açıktır", () => {
  const key = communityReadKey("/posts/a?page=1", 0), snapshot = { key, data: null, error: "Eski okuma hatası" };
  assert.deepEqual(communityReadState(snapshot, key, true), { data: null, error: snapshot.error, loading: false });
  assert.deepEqual(communityReadState(snapshot, communityReadKey("/posts/b?page=1", 0), true), { data: null, error: "", loading: true });
  assert.deepEqual(communityReadState(snapshot, communityReadKey("/posts/a?page=1", 1), true), { data: null, error: "", loading: true });
});
test("anahtar URL, yorum sayfası, null ve nesil türünü çakıştırmaz", () => {
  const keys = [communityReadKey("a:b", "c"), communityReadKey("a", "b:c"), communityReadKey(null, 0), communityReadKey("null", 0), communityReadKey("/posts/a?page=1", 0), communityReadKey("/posts/a?page=2", 0), communityReadKey("/posts/a?page=1", "0")];
  assert.equal(new Set(keys).size, keys.length);
});

test("only the current enabled read exposes its HTTP status", () => {
  const key = communityReadKey("/private?page=1", 0), snapshot = { key, data: null, error: "Yetki yok", status: 403 };
  assert.equal(communityReadStatus(snapshot, key, true), 403);
  assert.equal(communityReadStatus(snapshot, key, false), null);
  assert.equal(communityReadStatus(snapshot, communityReadKey("/private?page=1", 1), true), null);
  assert.equal(communityReadStatus(null, key, true), null);
});

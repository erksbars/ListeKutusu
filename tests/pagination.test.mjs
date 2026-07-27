import test from "node:test";
import assert from "node:assert/strict";
import { paginationMeta, parsePage, parsePageSize } from "../lib/pagination.ts";

test("sayfa parametresi yalnızca pozitif tam sayı kabul eder", () => {
  assert.equal(parsePage("3"), 3);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("2.5"), 1);
  assert.equal(parsePage("metin"), 1);
});

test("sayfa boyutu güvenli üst sınıra çekilir", () => {
  assert.equal(parsePageSize("25"), 25);
  assert.equal(parsePageSize("500", 20, 50), 50);
  assert.equal(parsePageSize("-1", 20, 50), 20);
});

test("istenen sayfa toplam sayfa sayısını aşamaz", () => {
  assert.deepEqual(paginationMeta(81, 12, 20), { page: 5, pageSize: 20, total: 81, totalPages: 5 });
  assert.deepEqual(paginationMeta(0, 3, 20), { page: 1, pageSize: 20, total: 0, totalPages: 1 });
});

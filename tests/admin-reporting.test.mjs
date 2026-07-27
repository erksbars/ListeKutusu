import test from "node:test";
import assert from "node:assert/strict";
import { buildAdminAuditCsv, csvCell, parseAdminReportRange } from "../lib/adminReporting.ts";

test("yönetim raporu varsayılan olarak son 30 günü kapsar", () => {
  const range = parseAdminReportRange(null, null, new Date("2026-07-17T12:00:00.000Z"));
  assert.equal(range.fromDate, "2026-06-18");
  assert.equal(range.toDate, "2026-07-17");
});

test("geçersiz ve çok uzun rapor tarihleri reddedilir", () => {
  assert.throws(() => parseAdminReportRange("2026-08-01", "2026-07-01"));
  assert.throws(() => parseAdminReportRange("2024-01-01", "2026-07-01"));
});

test("CSV hücreleri virgül ve çift tırnakları güvenli biçimde saklar", () => {
  assert.equal(csvCell('Şarkı, "özel"'), '"Şarkı, ""özel"""');
  const csv = buildAdminAuditCsv([{
    createdAt: new Date("2026-07-17T10:00:00.000Z"),
    action: "suggestion.approve",
    targetType: "suggestion",
    targetId: "abc",
    targetLabel: "Parça, Sanatçı",
    metadata: '{"source":"panel"}',
  }]);
  assert.match(csv, /^\uFEFF/);
  assert.match(csv, /"Parça, Sanatçı"/);
  assert.match(csv, /suggestion\.approve/);
});

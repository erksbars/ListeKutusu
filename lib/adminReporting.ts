const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

export type AdminReportRange = {
  from: Date;
  to: Date;
  fromDate: string;
  toDate: string;
};

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function parseAdminReportRange(fromValue?: string | null, toValue?: string | null, now = new Date()): AdminReportRange {
  const defaultTo = formatDate(now);
  const defaultFromDate = new Date(now);
  defaultFromDate.setUTCDate(defaultFromDate.getUTCDate() - 29);
  const defaultFrom = formatDate(defaultFromDate);
  const fromDate = fromValue && DATE_PATTERN.test(fromValue) ? fromValue : defaultFrom;
  const toDate = toValue && DATE_PATTERN.test(toValue) ? toValue : defaultTo;
  const from = new Date(`${fromDate}T00:00:00.000Z`);
  const to = new Date(`${toDate}T23:59:59.999Z`);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new Error("Geçerli bir tarih aralığı seç.");
  }
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * 86_400_000) {
    throw new Error("Rapor aralığı en fazla 366 gün olabilir.");
  }
  return { from, to, fromDate, toDate };
}

export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildAdminAuditCsv(rows: Array<{
  createdAt: Date;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string | null;
  metadata: string | null;
}>) {
  const header = ["Tarih", "İşlem", "Hedef türü", "Hedef kimliği", "Hedef", "Ayrıntı"];
  const lines = rows.map((row) => [
    row.createdAt.toISOString(),
    row.action,
    row.targetType,
    row.targetId,
    row.targetLabel,
    row.metadata,
  ].map(csvCell).join(","));
  return `\uFEFF${header.map(csvCell).join(",")}\r\n${lines.join("\r\n")}`;
}

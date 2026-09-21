export function parsePage(value: string | null | undefined, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePageSize(value: string | null | undefined, fallback = 20, maximum = 50) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function paginationMeta(total: number, requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  return { page, pageSize, total, totalPages };
}

export function parseOffsetCursor(value: string | null | undefined, maximum = 100) {
  if (!value?.startsWith("offset:")) return 0;
  const parsed = Number(value.slice("offset:".length));
  if (!Number.isInteger(parsed) || parsed < 0) return 0;
  return Math.min(parsed, maximum);
}

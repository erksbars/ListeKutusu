export function safeInternalPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function accountLoginPath(next: string) {
  return `/account?mode=login&next=${encodeURIComponent(safeInternalPath(next))}`;
}

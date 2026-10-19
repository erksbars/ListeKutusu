export function safeInternalPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/u.test(value)) return fallback;
  return value;
}

export function accountLoginPath(next: string) {
  return `/account?mode=login&next=${encodeURIComponent(safeInternalPath(next))}`;
}

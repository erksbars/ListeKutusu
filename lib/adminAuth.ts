export function isAdminLoginKeyValid(key: string | null | undefined) {
  const expected = process.env.ADMIN_LOGIN_KEY;

  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }

  return key === expected;
}

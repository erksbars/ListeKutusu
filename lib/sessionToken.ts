import crypto from "crypto";

export const ACCOUNT_SESSION_TOKEN_BYTES = 32;

export function createAccountSessionToken() {
  return crypto.randomBytes(ACCOUNT_SESSION_TOKEN_BYTES).toString("hex");
}

export function isAccountSessionToken(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

export function hashAccountSessionToken(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

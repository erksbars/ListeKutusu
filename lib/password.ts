import crypto from "crypto";

const ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordValidationError(password: string) {
  if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (password.length > 128) return "Şifre en fazla 128 karakter olabilir.";
  return null;
}

function deriveKey(password: string, salt: string, iterations: number) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await deriveKey(password, salt, ITERATIONS)).toString("hex");
  return `pbkdf2:${ITERATIONS}:${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [method, iterationsRaw, salt, originalHash] = storedHash.split(":");
  if (method !== "pbkdf2" || !iterationsRaw || !salt || !originalHash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  const hash = (await deriveKey(password, salt, iterations)).toString("hex");

  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(originalHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

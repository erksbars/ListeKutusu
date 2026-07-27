import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const tokenFile = path.join(process.cwd(), "app", "styles", "tokens.css");
const source = fs.readFileSync(tokenFile, "utf8");
const failures = [];
const results = [];

function themeBlock(theme) {
  const pattern = new RegExp(`\\[data-theme=["']${theme}["']\\]\\s*\\{([\\s\\S]*?)\\n\\}`, "u");
  const match = source.match(pattern);
  if (!match) throw new Error(`${theme} tema token bloğu bulunamadı.`);
  return match[1];
}

function hexTokens(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/giu)].map((match) => [match[1], match[2]])
  );
}

function rgb(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function linear(channel) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [red, green, blue] = rgb(hex).map(linear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const checks = [
  ["ui-text", "ui-bg", 4.5, "ana metin / sayfa"],
  ["ui-text", "ui-surface", 4.5, "ana metin / kart"],
  ["ui-text-muted", "ui-bg", 4.5, "ikincil metin / sayfa"],
  ["ui-text-muted", "ui-surface", 4.5, "ikincil metin / kart"],
  ["ui-text-subtle", "ui-surface", 4, "yardımcı metin / kart"],
  ["ui-text-inverse", "ui-primary", 4.5, "buton metni / birincil"],
  ["ui-danger", "ui-surface", 4.5, "hata metni / kart"],
  ["ui-warning", "ui-surface", 4.5, "uyarı metni / kart"],
  ["ui-success", "ui-surface", 4.5, "başarı metni / kart"],
  ["ui-focus", "ui-bg", 3, "odak halkası / sayfa"],
];

for (const theme of ["dark", "light"]) {
  const tokens = hexTokens(themeBlock(theme));
  for (const [foregroundToken, backgroundToken, minimum, label] of checks) {
    const foreground = tokens[foregroundToken];
    const background = tokens[backgroundToken];
    if (!foreground || !background) {
      failures.push(`${theme}: ${label} için gerekli token eksik.`);
      continue;
    }
    const ratio = contrast(foreground, background);
    results.push(`${theme}: ${label} ${ratio.toFixed(2)}:1 (en az ${minimum}:1)`);
    if (ratio < minimum) failures.push(`${theme}: ${label} kontrastı ${ratio.toFixed(2)}:1; en az ${minimum}:1 olmalı.`);
  }
}

if (failures.length > 0) {
  console.error("\nTema kontrast denetimi başarısız:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Tema kontrast denetimi geçti.");
results.forEach((result) => console.log(`- ${result}`));

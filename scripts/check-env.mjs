const production = process.argv.includes("--production");
const errors = [];
const warnings = [];

function valueFor(name) {
  return (process.env[name] || "").trim();
}

function requireSecret(name, minimumLength) {
  const value = valueFor(name);
  if (!value || value.includes("change_this") || value.length < minimumLength) {
    const message = `${name} en az ${minimumLength} karakterlik rastgele bir deger olmali.`;
    if (production) errors.push(message);
    else warnings.push(message);
  }
}

requireSecret("SESSION_SECRET", 32);
requireSecret("ADMIN_LOGIN_KEY", 16);

if (valueFor("SESSION_SECRET") && valueFor("SESSION_SECRET") === valueFor("ADMIN_LOGIN_KEY")) {
  errors.push("SESSION_SECRET ve ADMIN_LOGIN_KEY farkli degerler olmali.");
}

for (const name of ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"]) {
  const value = valueFor(name);
  if (!value || value.startsWith("your_")) errors.push(`${name} ayarlanmamis.`);
}

const redirectRaw = valueFor("SPOTIFY_REDIRECT_URI");
try {
  const redirect = new URL(redirectRaw);
  if (redirect.pathname !== "/api/auth/callback") {
    errors.push("SPOTIFY_REDIRECT_URI /api/auth/callback yoluyla bitmeli.");
  }
  if (production && redirect.protocol !== "https:") {
    errors.push("Uretimde SPOTIFY_REDIRECT_URI HTTPS kullanmali.");
  }
} catch {
  errors.push("SPOTIFY_REDIRECT_URI gecerli bir URL olmali.");
}

const databaseUrl = valueFor("DATABASE_URL");
if (!databaseUrl) errors.push("DATABASE_URL ayarlanmamis.");
if (production && databaseUrl.startsWith("file:")) {
  warnings.push("Uretimde SQLite kullaniliyor; duzenli yedek ve tek sunucu zorunlu.");
}

const appUrlRaw = valueFor("APP_URL");
let appUrl;
try {
  appUrl = new URL(appUrlRaw);
  if (appUrl.pathname !== "/" || appUrl.search || appUrl.hash) {
    errors.push("APP_URL yalnizca uygulama origin adresi olmali; path, query veya hash icermemeli.");
  }
  if (production && appUrl.protocol !== "https:") {
    errors.push("Uretimde APP_URL HTTPS kullanmali.");
  }
} catch {
  errors.push("APP_URL gecerli bir URL olmali.");
}

if (production && appUrl && redirectRaw) {
  try {
    const redirect = new URL(redirectRaw);
    if (redirect.origin !== appUrl.origin) {
      errors.push("SPOTIFY_REDIRECT_URI ve APP_URL ayni origin adresini kullanmali.");
    }
  } catch {
    // Redirect URI hatasi yukarida ayrica raporlanir.
  }
}

const managedPlaylistLimit = Number(valueFor("MANAGED_PLAYLIST_LIMIT") || "10000");
if (!Number.isInteger(managedPlaylistLimit) || managedPlaylistLimit < 1 || managedPlaylistLimit > 10000) {
  errors.push("MANAGED_PLAYLIST_LIMIT 1 ile 10000 arasinda bir tam sayi olmali.");
}

for (const warning of warnings) console.warn(`UYARI: ${warning}`);
for (const error of errors) console.error(`HATA: ${error}`);

if (errors.length > 0) process.exit(1);
console.log(`Ortam kontrolu basarili${production ? " (uretim)" : ""}.`);

import { isIP } from "node:net";
const placeholder = value => /change[_ -]?this|^your_|^replace[_ -]|^local-development-session-secret/i.test(value);
function localHost(raw) {
  const host = raw.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (host === "localhost" || /\.(localhost|local|test|invalid)$/.test(host)) return true;
  if (isIP(host) === 4) { const [a, b] = host.split(".").map(Number); return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168); }
  if (isIP(host) === 6) {
    if (host === "::" || host === "::1" || /^(fc|fd|fe[89ab])/.test(host)) return true;
    const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(host);
    if (mapped) { const bytes = [parseInt(mapped[1], 16) >> 8, parseInt(mapped[1], 16) & 255, parseInt(mapped[2], 16) >> 8, parseInt(mapped[2], 16) & 255]; return localHost(bytes.join(".")); }
  }
  return false;
}
// Pure validation: never return credentials, addresses, contacts or exception text.
export function checkEnvironment(env, production = false) {
  const errors = [], warnings = [];
  const value = name => typeof env[name] === "string" ? env[name].trim() : "";
  const add = (target, code, field, message) => target.push({ code, field, message });
  if (production && value("NODE_ENV") && value("NODE_ENV") !== "production") add(errors, "NODE_ENV_MISMATCH", "NODE_ENV", "Üretim sürecinde NODE_ENV production olmalı.");
  for (const [name, minimum] of [["SESSION_SECRET", 32], ["ADMIN_LOGIN_KEY", 16]]) {
    const secret = value(name);
    if (secret.length < minimum || placeholder(secret) || new Set(secret).size < 8) add(production ? errors : warnings, "WEAK_SECRET", name, `${name} yeterli uzunlukta, farklı karakterli ve örnek olmayan rastgele bir değer olmalı.`);
  }
  if (value("SESSION_SECRET") && value("SESSION_SECRET") === value("ADMIN_LOGIN_KEY")) add(errors, "REUSED_SECRET", "ADMIN_LOGIN_KEY", "Oturum ve yönetici sırları birbirinden farklı olmalı.");
  for (const name of ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"]) if (!value(name) || placeholder(value(name))) add(errors, "SPOTIFY_NOT_CONFIGURED", name, `${name} yapılandırılmamış.`);
  function address(name, callback = false) {
    try {
      const url = new URL(value(name));
      if (/[\u0000-\u001f\u007f]/.test(value(name)) || !["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== (callback ? "/api/auth/callback" : "/")) throw new Error();
      if (production && (url.protocol !== "https:" || localHost(url.hostname))) add(errors, "PUBLIC_HTTPS_REQUIRED", name, `${name} üretimde yerel/özel olmayan bir HTTPS adresi kullanmalı.`);
      return url;
    } catch { add(errors, "INVALID_URL", name, `${name} geçerli HTTP(S), kimlik bilgisi/query/hash içermeyen ${callback ? "callback" : "origin"} adresi olmalı.`); return null; }
  }
  const app = address("APP_URL"), redirect = address("SPOTIFY_REDIRECT_URI", true);
  if (production && app && redirect && app.origin !== redirect.origin) add(errors, "ORIGIN_MISMATCH", "SPOTIFY_REDIRECT_URI", "Spotify callback ve uygulama aynı origin kullanmalı.");
  const database = value("DATABASE_URL");
  if (!/^file:.+/.test(database) || /^file:[\\/]{2}/.test(database) || /[?#\u0000\r\n]/.test(database)) add(errors, "SQLITE_URL_REQUIRED", "DATABASE_URL", "Mevcut şema sade yerel SQLite file: adresi gerektirir; sağlayıcı geçişi ayrı migration işidir.");
  else if (production) add(warnings, "SQLITE_OPERATIONS_REQUIRED", "DATABASE_URL", "Üretimde SQLite için tek sunucu, yedek ve eşzamanlı yük provası gerekli.");
  const limit = value("MANAGED_PLAYLIST_LIMIT") || "10000";
  if (!/^[1-9]\d{0,4}$/.test(limit) || Number(limit) > 10000) add(errors, "INVALID_PLAYLIST_LIMIT", "MANAGED_PLAYLIST_LIMIT", "Playlist sınırı 1–10000 arasında tam sayı olmalı.");
  const interval = value("GAME_MAINTENANCE_INTERVAL_MS") || "20000";
  if (!/^\d+$/.test(interval) || !Number.isSafeInteger(Number(interval)) || Number(interval) < 5000) add(errors, "INVALID_GAME_INTERVAL", "GAME_MAINTENANCE_INTERVAL_MS", "Oyun bakım aralığı en az 5000 ms tam sayı olmalı.");
  const catalog = value("MEDIA_CATALOG_ENABLED");
  if (catalog && catalog !== "true" && catalog !== "false") add(errors, "INVALID_CATALOG_FLAG", "MEDIA_CATALOG_ENABLED", "Katalog özelliği true veya false olmalı.");
  if (catalog === "true" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("OPEN_LIBRARY_CONTACT")) || value("OPEN_LIBRARY_CONTACT").length > 254 || placeholder(value("OPEN_LIBRARY_CONTACT")))) add(errors, "CATALOG_CONTACT_REQUIRED", "OPEN_LIBRARY_CONTACT", "Açık kitap kataloğu için geçerli operatör iletişim e-postası gerekli.");
  return { mode: production ? "production" : "development", errors, warnings };
}

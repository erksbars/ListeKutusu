import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
import { createRehearsalDirectory, copyRehearsalSource, removeRehearsalDirectory, rehearsalEnvironment } from "./lib/http-rehearsal-isolation.mjs";
import { startRehearsalChild, initializeRehearsalDatabase } from "./lib/http-worker-rehearsal.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
let directory, child, passed = false, stopped = true;
try {
  if (process.argv.length !== 2) throw new Error();
  directory = await createRehearsalDirectory(root); await copyRehearsalSource(root, directory);
  const env = { ...rehearsalEnvironment(), NODE_ENV: "production", DATABASE_URL: await initializeRehearsalDatabase(directory), APP_URL: "http://127.0.0.1:1", SPOTIFY_REDIRECT_URI: "http://127.0.0.1:1/api/auth/callback" };
  console.error("İzole production derlemesi: yalnız geçici kaynak ve sentetik DB kullanılıyor.");
  child = startRehearsalChild("build", directory, env);
  passed = (await child.ready).built === true;
  if (!passed) throw new Error();
} catch {
  console.error("İzole derleme başarısız; mevcut .next/DB değiştirilmedi. Oluştuysa geçici tanı dizini korunuyor."); process.exitCode = 1;
} finally {
  if (child) stopped = await child.stop();
  if (directory && passed && stopped) await removeRehearsalDirectory(directory, root);
  else if (directory && child) await writeFile(path.join(directory, "build.log"), child.diagnostics(), { mode: 0o600 });
  if (!stopped) { passed = false; process.exitCode = 1; }
  console.log(JSON.stringify({ ok: passed && stopped, scope: "isolated-source-production-build", deploymentApproved: false, temporaryRetained: Boolean(directory && (!passed || !stopped)) }));
}

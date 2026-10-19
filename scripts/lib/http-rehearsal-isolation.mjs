import { cp, lstat, mkdir, mkdtemp, readdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

// Deliberately no dotenv, target URL, inherited application settings or DB fallback.
export function rehearsalEnvironment(source = process.env) {
  const env = {};
  for (const key of ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "COMSPEC", "PATHEXT", "HOME", "USERPROFILE", "LOCALAPPDATA", "APPDATA"]) {
    if (source[key]) env[key] = source[key];
  }
  return { ...env, NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1", MEDIA_CATALOG_ENABLED: "false",
    SESSION_SECRET: randomBytes(32).toString("hex"), ADMIN_LOGIN_KEY: randomBytes(24).toString("hex") };
}

export async function assertRehearsalDirectory(directory, root) {
  const parent = path.join(root, "tmp");
  if (path.dirname(directory) !== parent || !/^http-rehearsal-[a-zA-Z0-9_-]+$/.test(path.basename(directory))) throw new Error("UNSAFE_REHEARSAL_DIRECTORY");
  for (const target of [root, parent, directory]) {
    if (!(await lstat(target)).isDirectory() || (await lstat(target)).isSymbolicLink()) throw new Error("UNSAFE_REHEARSAL_DIRECTORY");
  }
  if (await realpath(directory) !== path.join(await realpath(parent), path.basename(directory))) throw new Error("UNSAFE_REHEARSAL_DIRECTORY");
}

export async function createRehearsalDirectory(root) {
  const parent = path.join(root, "tmp");
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error("UNSAFE_REHEARSAL_DIRECTORY");
  await mkdir(parent, { recursive: true });
  for (const target of [root, parent]) {
    const info = await lstat(target);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("UNSAFE_REHEARSAL_DIRECTORY");
  }
  if (await realpath(parent) !== path.join(await realpath(root), "tmp")) throw new Error("UNSAFE_REHEARSAL_DIRECTORY");
  return mkdtemp(path.join(parent, "http-rehearsal-"));
}

export async function copyRehearsalSource(root, directory) {
  await assertRehearsalDirectory(directory, root);
  // Only source trees/configuration: never copy .env, DB, backups, .next or sessions.
  const files = ["package.json", "tsconfig.json", "next.config.mjs", "middleware.ts", "postcss.config.js", "tailwind.config.ts"];
  const allowed = /\.(?:ts|tsx|js|mjs|json|css|svg|ico)$/i;
  async function copy(source, destination) {
    if (path.basename(source).startsWith(".env")) return;
    const info = await lstat(source);
    if (info.isSymbolicLink()) throw new Error("SOURCE_LINK_NOT_ALLOWED");
    if (info.isDirectory()) {
      await mkdir(destination, { recursive: true });
      for (const entry of await readdir(source)) await copy(path.join(source, entry), path.join(destination, entry));
    } else if (info.isFile() && allowed.test(source)) await cp(source, destination, { errorOnExist: true, force: false });
  }
  for (const name of [...files, "app", "lib", "types"]) await copy(path.join(root, name), path.join(directory, name));
}

export async function removeRehearsalDirectory(directory, root) {
  await assertRehearsalDirectory(directory, root);
  await rm(directory, { recursive: true });
}

import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, open, readFile, writeFile, unlink } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { createRehearsalDirectory, copyRehearsalSource, rehearsalEnvironment, removeRehearsalDirectory } from "./lib/http-rehearsal-isolation.mjs";
import { initializeRehearsalDatabase, startRehearsalChild, rehearsalHttpClient, expectRehearsalStatus } from "./lib/http-worker-rehearsal.mjs";

// Fixed credentials are ONLY fixtures in a fresh, generated database. No target/env override.
const root = fileURLToPath(new URL("../", import.meta.url));
const runtimeFile = path.join(root, "output", "playwright", "draft-acceptance-runtime.json");
let directory, child, db, runtimeHandle, runtimeOwned = false, complete = false, stopped = true, removed = false;
let stage = "initialize";
try {
  if (process.argv.length !== 2) throw new Error("NO_ARGUMENTS_ALLOWED");
  await mkdir(path.dirname(runtimeFile), { recursive: true });
  runtimeHandle = await open(runtimeFile, "wx", 0o600); runtimeOwned = true;
  directory = await createRehearsalDirectory(root);
  await copyRehearsalSource(root, directory);
  const commandFile = path.join(directory, "browser-command.txt");
  await writeFile(commandFile, "", { flag: "wx", mode: 0o600 });
  const databaseURL = await initializeRehearsalDatabase(directory);
  const env = { ...rehearsalEnvironment(), DATABASE_URL: databaseURL };
  child = startRehearsalChild("server", directory, env);
  const { port } = await child.ready;
  if (!Number.isInteger(port) || port < 1 || port === 3000) throw new Error("INVALID_ISOLATED_PORT");
  const baseURL = `http://127.0.0.1:${port}`, http = rehearsalHttpClient(baseURL);
  stage = "register-fixtures";
  const accounts = [];
  for (const role of ["owner", "author"]) {
    const response = await http("/api/accounts", "", "POST", { email: `acceptance-${role}@example.test`, password: "Local-Draft-Acceptance-2026!", ownerName: role === "owner" ? "İzole Kabul" : "İzole Yazar", playlistName: "Geçici Kabul Listesi" });
    expectRehearsalStatus(response, 200, "REGISTER");
    if (typeof response.data?.list?.id !== "string") throw new Error("INVALID_ACCOUNT_FIXTURE");
    accounts.push(response.data.list.id);
  }
  db = new PrismaClient({ datasources: { db: { url: databaseURL } } });
  const post = await db.feedPost.create({ data: { authorId: accounts[1], trackId: "isolated-acceptance-track", trackName: "İzole Kabul Parçası", artistName: "Sentetik Sanatçı", note: "Yalnız geçici veritabanında kabul kontrolü.", source: "manual" } });
  await runtimeHandle.writeFile(JSON.stringify({ baseURL, postId: post.id, ownerId: accounts[0], directory, commandFile, isolated: true }));
  await runtimeHandle.close(); runtimeHandle = null;
  console.log(JSON.stringify({ ready: true, baseURL, postId: post.id, scope: "fresh-isolated-draft-acceptance", runtimeFile }));
  stage = "browser-acceptance";
  const command = await new Promise(resolve => {
    const timer = setTimeout(() => finish("timeout"), 20 * 60_000);
    const poll = setInterval(() => { void readFile(commandFile, "utf8").then(value => {
      if (["finish", "abort"].includes(value.trim())) finish(value.trim());
    }).catch(() => finish("abort")); }, 250);
    const finish = value => { clearTimeout(timer); clearInterval(poll); resolve(value); };
    process.once("SIGINT", () => finish("abort"));
    process.once("SIGTERM", () => finish("abort"));
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", value => { if (["finish", "abort"].includes(value.trim())) finish(value.trim()); });
    process.stdin.resume();
  });
  if (command !== "finish") throw new Error("ACCEPTANCE_NOT_FINISHED");
  stage = "database-postconditions";
  const owner = await db.userList.findUnique({ where: { id: accounts[0] }, select: { profileStatus: true } });
  const comments = await db.feedComment.findMany({ where: { postId: post.id, status: "published" }, select: { body: true, authorId: true } });
  const community = await db.community.findFirst({ where: { ownerId: accounts[0], name: "İzole Kabul Topluluğu" }, select: { id: true, city: true } });
  const decision = community && await db.communityModerationLog.findFirst({ where: { communityId: community.id, action: "resolve-report", note: "İzole karar notu" }, select: { id: true } });
  const pending = community && await db.communityReport.count({ where: { communityId: community.id, status: "pending" } });
  if (owner?.profileStatus !== "İzole kaydedilen profil" || comments.length !== 1 || comments[0].body !== "İzole oturum taslağı" || comments[0].authorId !== accounts[0] || community?.city !== "İstanbul" || !decision || pending !== 1) throw new Error("POSTCONDITIONS_FAILED");
  complete = true;
} catch {
  console.error(JSON.stringify({ ok: false, stage, scope: "isolated-draft-acceptance" }));
  process.exitCode = 1;
} finally {
  if (child) stopped = await child.stop();
  if (db) await db.$disconnect();
  if (runtimeHandle) await runtimeHandle.close();
  if (directory && stopped) {
    try { await removeRehearsalDirectory(directory, root); removed = true; }
    catch { process.exitCode = 1; }
  }
  if (runtimeOwned && (removed || !directory)) await unlink(runtimeFile).catch(error => { if (error.code !== "ENOENT") throw error; });
  if (!stopped) process.exitCode = 1;
  console.log(JSON.stringify({ ok: complete && stopped && removed, isolatedServerStopped: Boolean(child) && stopped, temporaryRemoved: removed, productionAcceptance: false }));
  process.stdin.pause();
}

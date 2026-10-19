// Private child entry point. Never starts against the caller's normal workspace.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { assertRehearsalDirectory } from "./http-rehearsal-isolation.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url)), directory = process.cwd();
await assertRehearsalDirectory(directory, root);
if (!process.send || process.env.DATABASE_URL !== `file:${path.join(directory, "synthetic-http.db").replaceAll("\\", "/")}`) throw new Error("INVALID_REHEARSAL_CHILD");
const role = process.argv[2];
if (role === "server") {
  const { default: next } = await import("next");
  let app, stopping = false;
  const server = createServer((req, res) => app.getRequestHandler()(req, res));
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  process.env.APP_URL = `http://127.0.0.1:${port}`;
  process.env.SPOTIFY_REDIRECT_URI = `${process.env.APP_URL}/api/auth/callback`;
  app = next({ dev: true, dir: directory, hostname: "127.0.0.1", port });
  await app.prepare();
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    await app.close(); process.exit(0);
  };
  process.on("message", message => { if (message === "stop") void stop(); });
  process.on("disconnect", () => void stop());
  process.send({ ready: true, port });
} else if (role === "build") {
  if (process.env.NODE_ENV !== "production") throw new Error("INVALID_BUILD_ENVIRONMENT");
  // This is the installed Next CLI's own build implementation, scoped to the copied source.
  const build = (await import("next/dist/build/index.js")).default.default;
  await build(directory);
  process.send({ ready: true, built: true }, () => process.exit(0));
} else if (role === "worker") {
  process.argv = process.argv.slice(0, 2);
  await import("../event-notification-worker.mjs");
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true; process.emit("SIGTERM"); if (process.connected) process.disconnect();
  };
  process.on("message", message => { if (message === "stop") stop(); });
  process.on("disconnect", stop);
  process.send({ ready: true });
} else throw new Error("INVALID_REHEARSAL_ROLE");

import { fileURLToPath } from "node:url";
import { superviseWorker } from "./lib/event-worker-supervisor.mjs";

if (process.argv.length !== 2) throw new Error("Gözetmen ek argüman kabul etmez.");
const cwd = fileURLToPath(new URL("../", import.meta.url));
const supervisor = superviseWorker({ command: process.execPath, args: ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--env-file=.env", "--experimental-strip-types", "scripts/event-notification-worker.mjs"], cwd });
process.once("SIGINT", () => supervisor.stop());
process.once("SIGTERM", () => supervisor.stop());

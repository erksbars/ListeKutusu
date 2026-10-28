import path from "node:path";
import { fileURLToPath } from "node:url";
import { lstat, readFile, writeFile } from "node:fs/promises";
import { assertRehearsalDirectory } from "./lib/http-rehearsal-isolation.mjs";

const command = process.argv[2], root = fileURLToPath(new URL("../", import.meta.url));
try {
  if (process.argv.length !== 3 || !["finish", "abort"].includes(command)) throw new Error();
  const runtime = JSON.parse(await readFile(path.join(root, "output", "playwright", "draft-acceptance-runtime.json"), "utf8"));
  await assertRehearsalDirectory(runtime.directory, root);
  const file = path.join(runtime.directory, "browser-command.txt"), info = await lstat(file);
  if (!runtime.isolated || runtime.commandFile !== file || !info.isFile() || info.isSymbolicLink()) throw new Error();
  await writeFile(file, `${command}\n`, { flag: "r+" });
  console.log(JSON.stringify({ commandSent: command, isolatedOnly: true }));
} catch {
  console.error("İzole kabul komutu gönderilemedi; geçerli çalışma ve yalnız finish/abort gerekir.");
  process.exitCode = 1;
}

import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

test("ops örnekleri sır içermez; ayrı yetkisiz roller ve birbiriyle eşleşen timer hedefleri", async () => {
  const directory = new URL("../deploy/systemd/", import.meta.url), names = await readdir(directory);
  assert.equal(names.length, 7);
  for (const name of names) {
    const source = await readFile(new URL(name, directory), "utf8");
    assert.doesNotMatch(source, /SESSION_SECRET=|ADMIN_LOGIN_KEY=|BACKUP_PASSPHRASE=|SPOTIFY_CLIENT_SECRET=|migrate deploy|rm -rf|sudo /);
    if (name.endsWith(".service.example")) {
      for (const line of ["User=listekutusu", "WorkingDirectory=/srv/listekutusu/app", "EnvironmentFile=/etc/listekutusu/app.env", "NoNewPrivileges=true", "ProtectSystem=strict", "UMask=0077"]) assert.ok(source.includes(line), `${name}: ${line}`);
    } else {
      const target = /^Unit=(.+)$/m.exec(source)?.[1]; assert.ok(names.includes(`${target}.example`));
    }
  }
  const web = await readFile(new URL("listekutusu-web.service.example", directory), "utf8");
  assert.match(web, /--hostname 127\.0\.0\.1/); assert.doesNotMatch(web, /next dev/);
  const worker = await readFile(new URL("listekutusu-events.service.example", directory), "utf8");
  assert.match(worker, /Restart=always/); assert.match(worker, /KillSignal=SIGTERM/); assert.doesNotMatch(worker, /supervisor/);
  const backup = await readFile(new URL("listekutusu-backup.service.example", directory), "utf8");
  assert.match(backup, /EnvironmentFile=\/etc\/listekutusu\/backup.env/);
});

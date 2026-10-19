import { rehearseHttpWorker } from "./lib/http-worker-rehearsal.mjs";

if (process.argv.length !== 2) {
  console.error("Bu komut seçenek, URL veya veritabanı hedefi kabul etmez."); process.exitCode = 1;
} else {
  let step = "START";
  try {
    const report = await rehearseHttpWorker(value => { step = value; console.error(`Prova: ${value}`); });
    console.log(JSON.stringify(report, null, 2)); if (!report.ok) process.exitCode = 1;
  } catch (error) {
    const issue = /^(?:[A-Z_]+(?:_STATUS_\d{3})?)$/.test(error?.message ?? "") ? error.message : "REHEARSAL_FAILED";
    console.error(JSON.stringify({ ok: false, step, issue })); process.exitCode = 1;
  }
}

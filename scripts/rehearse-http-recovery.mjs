import { rehearseHttpRecovery } from "./lib/http-recovery-rehearsal.mjs";

if (process.argv.length !== 2) {
  console.error("Kurtarma provası seçenek, URL veya DB hedefi kabul etmez."); process.exitCode = 1;
} else {
  let step = "START";
  try {
    const report = await rehearseHttpRecovery(value => { step = value; console.error(`Kurtarma: ${value}`); });
    console.log(JSON.stringify(report, null, 2)); if (!report.ok) process.exitCode = 1;
  } catch (error) {
    const issue = /^[A-Z_]+(?:_STATUS_\d{3})?$/.test(error?.message ?? "") ? error.message : "RECOVERY_REHEARSAL_FAILED";
    console.error(JSON.stringify({ ok: false, step, issue })); process.exitCode = 1;
  }
}

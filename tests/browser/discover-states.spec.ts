import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const emptyDiscover = { tracks: [], people: [], lists: [], tags: [], curators: [], totals: { posts: 0, tracks: 0, tags: 0, curators: 0, lists: 0 } };

for (const scope of ["people", "lists"] as const) {
  test(`discover ${scope} distinguishes unavailable, error, login, restricted and real empty`, async ({ page }) => {
    let mode: number | "invalid" | "empty" = 503;
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.route("**/api/accounts/me?view=summary", route => route.fulfill({ status: 401, json: {} }));
    await page.route("**/api/discover", route => route.fulfill(typeof mode === "number" ? { status: mode, contentType: "text/html", body: "<html>upstream unavailable</html>" } : { json: mode === "invalid" ? {} : emptyDiscover }));
    await page.goto(`/discover?q=sentetik&type=${scope}`);
    for (const step of [503, 500, 401, 403, "invalid", "empty"] as const) {
      if (mode !== step) { mode = step; await page.reload(); }
      const main = page.locator("main");
      const state = main.locator(".ui-content-state");
      await expect(main.locator(".ui-content-state-loading")).toHaveCount(0);
      if (step === "empty") {
        await expect(main.getByRole("heading", { name: scope === "people" ? "Kullanıcı bulunamadı" : "Liste bulunamadı", exact: true })).toBeVisible();
        await expect(main.locator(".ui-content-state-error, .ui-content-state-unavailable, .ui-content-state-login")).toHaveCount(0);
      } else {
        await expect(state).toHaveClass(new RegExp(`ui-content-state-${step === 401 ? "login" : step === 503 || step === 403 ? "unavailable" : "error"}`));
        await expect(main.getByRole("heading", { name: /^(Kullanıcı bulunamadı|Liste bulunamadı|Bu aramayla eşleşen sonuç yok)$/ })).toHaveCount(0);
        await expect(state.getByRole("link", { name: "Giriş yap", exact: true })).toHaveCount(step === 401 ? 1 : 0);
        await expect(state.getByRole("button", { name: "Yeniden dene", exact: true })).toHaveCount(step === 401 || step === 403 ? 0 : 1);
        await expect(main.getByText("Sonuç sayısı bilinmiyor", { exact: true })).toBeVisible();
        await expect(main.getByRole("tab", { name: /^Kullanıcılar/ })).toContainText("—");
        await expect(state).not.toContainText("<html>");
        if (step === 401) {
          const href = await state.getByRole("link").getAttribute("href");
          expect(new URLSearchParams(href!.split("?")[1]).get("next")).toBe(`/discover?q=sentetik&type=${scope}`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
}

test("discover retry keeps unknown totals until successful empty response", async ({ page }) => {
  let succeed = false, requests = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/accounts/me?view=summary", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/discovery/random?**", route => route.fulfill({ json: { tracks: [] } }));
  await page.route("**/api/discover", async route => {
    requests++;
    if (succeed) await gate;
    await route.fulfill(succeed ? { json: emptyDiscover } : { status: 500, json: { error: "Keşfet geçici hatası." } });
  });
  await page.goto("/discover");
  const main = page.locator("main");
  await expect(main.locator(".ui-content-state-error")).toBeVisible();
  await expect(main.locator(".discover-stat strong")).toHaveText(["—", "—", "—", "—"]);
  succeed = true;
  await main.locator(".ui-content-state-error").getByRole("button", { name: "Yeniden dene", exact: true }).click();
  try {
    await expect(main.locator(".ui-content-state-loading")).toBeVisible();
    await expect(main.locator(".ui-content-state-empty")).toHaveCount(0);
    await expect(main.locator(".discover-stat strong")).toHaveText(["—", "—", "—", "—"]);
  } finally { release(); }
  await expect(main.locator(".ui-content-state-empty")).toContainText("Keşfet akışı henüz boş");
  await expect(main.locator(".discover-stat strong")).toHaveText(["0", "0", "0", "0"]);
  expect(requests).toBe(2);
  expect((await new AxeBuilder({ page }).include(".ui-content-state-empty").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

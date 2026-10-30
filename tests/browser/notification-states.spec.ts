import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const preferences = { follows: true, likes: true, adds: true };
const item = { id: "notice-test", type: "community_event_updated", readAt: null, createdAt: "2026-10-17T12:00:00Z", actor: null, post: null, forumThread: null, communityEvent: { id: "event-test", title: "Sentetik özel etkinlik", status: "scheduled", community: { slug: "masa" } } };
const payload = { notifications: [item], unreadCount: 1, nextCursor: null, preferences };
async function setup(page: Page) {
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/accounts/me?view=summary", route => route.fulfill({ json: { list: { id: "notice-user", ownerName: "Bildirim Testi", slug: "notice-user" } } }));
  await page.route("**/api/discover", route => route.fulfill({ json: { tracks: [], people: [], lists: [], tags: [], curators: [], totals: {} } }));
}

test("notifications distinguish failure, invalid response, loading, empty and expired session", async ({ page }) => {
  await setup(page);
  let mode = "error";
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/notifications**", async route => {
    expect(route.request().method()).toBe("GET");
    if (mode === "error") return route.fulfill({ status: 500, contentType: "text/html", body: "<html>failure</html>" });
    if (mode === "service") return route.fulfill({ status: 503, json: { error: "Bildirim servisi kullanılamıyor." } });
    if (mode === "invalid") return route.fulfill({ json: {} });
    if (mode === "expired") return route.fulfill({ status: 401, json: { error: "Oturum süresi doldu." } });
    if (mode === "empty") await gate;
    return route.fulfill({ json: { ...payload, notifications: [], unreadCount: 0 } });
  });
  await page.goto("/discover?q=bildirim&type=people");
  await page.getByTestId("notification-trigger").click();
  const panel = page.getByTestId("notification-panel");
  await expect(panel.locator(".ui-content-state-error")).toBeVisible();
  await expect(panel.getByRole("button", { name: /^Okunmamış/ })).toContainText("—");
  await expect(panel.getByRole("button", { name: "Bildirim tercihleri", exact: true })).toBeDisabled();
  mode = "service";
  await panel.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(panel.locator(".ui-content-state-unavailable")).toContainText("Bildirim servisi kullanılamıyor.");
  await expect(panel.locator(".ui-content-state-login, .ui-content-state-empty")).toHaveCount(0);
  mode = "invalid";
  await panel.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(panel.locator(".ui-content-state-error")).toContainText("Bildirim yanıtı doğrulanamadı.");
  mode = "empty";
  await panel.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  try {
    await expect(panel.locator(".ui-content-state-loading")).toBeVisible();
    await expect(panel.locator(".ui-content-state-empty")).toHaveCount(0);
  } finally { release(); }
  await expect(panel.locator(".ui-content-state-empty")).toContainText("Şimdilik sessiz");
  await expect(panel.getByRole("button", { name: /^Okunmamış/ })).toContainText("0");
  mode = "expired";
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(panel.locator(".ui-content-state-login")).toBeVisible();
  await expect(panel.locator(".ui-content-state-empty")).toHaveCount(0);
  const href = await panel.getByRole("link", { name: "Giriş yap", exact: true }).getAttribute("href");
  expect(new URLSearchParams(href!.split("?")[1]).get("next")).toBe("/discover?q=bildirim&type=people");
  expect((await new AxeBuilder({ page }).include('[data-testid="notification-panel"]').withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("notification-trigger")).toBeFocused();
});

test("notification mutations survive a late poll and preferences roll back on error", async ({ page }) => {
  await setup(page);
  let delayedPolls = 0, delayPoll = false, patches = 0, failRead = true, failPreferences = true, expireWrite = false;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/notifications**", async route => {
    if (route.request().method() === "PATCH") {
      patches++;
      const body = route.request().postDataJSON();
      if (expireWrite) return route.fulfill({ status: 403, json: { error: "Erişim kapandı." } });
      if (body.preferences) return route.fulfill(failPreferences ? { status: 503, json: { error: "Geçici hata." } } : { json: { preferences: body.preferences } });
      return route.fulfill(failRead ? { status: 500, json: { error: "Okundu işlemi başarısız." } } : { json: { updated: 1 } });
    }
    if (delayPoll) { delayedPolls++; await gate; }
    await route.fulfill({ json: payload }).catch(() => {});
  });
  await page.goto("/discover?q=bildirim&type=people");
  const trigger = page.getByTestId("notification-trigger");
  await expect(trigger).toHaveAttribute("aria-label", "1 okunmamış bildirim");
  await trigger.click();
  const panel = page.getByTestId("notification-panel");
  await expect(panel.locator(".notification-item")).toContainText("Sentetik özel etkinlik");
  await panel.getByRole("button", { name: "Tümünü okundu yap", exact: true }).click();
  await expect(panel.locator(".ui-content-state-error")).toContainText("okundu olarak işaretlenemedi");
  await expect(trigger).toHaveAttribute("aria-label", "1 okunmamış bildirim");
  await expect(panel.locator(".notification-item-unread")).toHaveCount(1);
  failRead = false;
  delayPoll = true;
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect.poll(() => delayedPolls).toBe(1);
  await panel.getByRole("button", { name: "Tümünü okundu yap", exact: true }).click();
  await expect(trigger).toHaveAttribute("aria-label", "Bildirimler");
  delayPoll = false; release();
  await expect(panel.locator(".notification-item-unread")).toHaveCount(0);
  await panel.getByRole("button", { name: "Bildirim tercihleri", exact: true }).click();
  const follows = panel.getByRole("checkbox", { name: "Yeni takipçiler", exact: true });
  await follows.uncheck();
  await expect(panel.locator(".ui-content-state-error")).toContainText("Önceki tercihin korundu.");
  await expect(follows).toBeChecked();
  failPreferences = false;
  await follows.uncheck();
  await expect(follows).not.toBeChecked();
  await expect(follows).toBeEnabled();
  await expect(panel.locator(".ui-content-state-error")).toHaveCount(0);
  expireWrite = true;
  await follows.check();
  await expect(panel.locator(".ui-content-state-unavailable")).toContainText("Bu alana erişimin yok");
  await expect(panel.locator(".notification-item, .notification-preferences")).toHaveCount(0);
  await expect(panel.getByRole("button", { name: /^Okunmamış/ })).toContainText("—");
  await expect(panel.getByRole("link", { name: "Giriş yap", exact: true })).toHaveCount(0);
  expect(patches).toBe(5);
});

test("notification read request can finish after client navigation unmounts the panel", async ({ page }) => {
  await setup(page);
  let patches = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/library?**", route => route.fulfill({ status: 401, json: { error: "Sentetik oturum." } }));
  await page.route("**/api/notifications**", async route => {
    if (route.request().method() !== "PATCH") return route.fulfill({ json: payload });
    patches++; await gate;
    await route.fulfill({ json: { updated: 1 } });
  });
  await page.goto("/discover?q=bildirim&type=people");
  await page.getByTestId("notification-trigger").click();
  await page.getByTestId("notification-panel").getByRole("button", { name: "Tümünü okundu yap", exact: true }).click();
  await expect.poll(() => patches).toBe(1);
  await page.locator("#account-menu-trigger").click();
  await page.getByRole("menu").getByRole("menuitem", { name: "Kitaplığım", exact: true }).click();
  try {
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByTestId("notification-panel")).toHaveCount(0);
  } finally {
    const completed = page.waitForEvent("requestfinished", request => new URL(request.url()).pathname === "/api/notifications" && request.method() === "PATCH");
    release(); await completed;
  }
  expect(patches).toBe(1);
});

test("notification history failure retains the first page but revoked access clears it", async ({ page }) => {
  await setup(page);
  let revoke = false;
  await page.route("**/api/notifications**", route => {
    if (new URL(route.request().url()).searchParams.has("cursor")) return route.fulfill({ status: revoke ? 401 : 503, json: { error: "Eski bildirimler yüklenemedi." } });
    return route.fulfill({ json: { ...payload, nextCursor: "20" } });
  });
  await page.goto("/discover?q=bildirim&type=people");
  await page.getByTestId("notification-trigger").click();
  const panel = page.getByTestId("notification-panel");
  await expect(panel.getByRole("button", { name: "Yeniden dene", exact: true })).toBeVisible();
  await expect(panel.locator(".notification-item")).toContainText("Sentetik özel etkinlik");
  revoke = true;
  await panel.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(panel.locator(".ui-content-state-login")).toBeVisible();
  await expect(panel.locator(".notification-item, .feed-load-sentinel")).toHaveCount(0);
  await expect(page.getByTestId("notification-trigger")).toHaveAttribute("aria-label", "Bildirimler");
});

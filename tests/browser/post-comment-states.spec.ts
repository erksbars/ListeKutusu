import { expect, test } from "@playwright/test";

test("existing public post comments separate unknown counts, read errors and real empty", async ({ page }) => {
  // Read an existing public post only; never seed a user or a session for this check.
  const response = await page.request.get("/api/feed?take=1");
  const publicFeed = await response.json().catch(() => null);
  const id = publicFeed?.posts?.[0]?.id;
  test.skip(!response.ok() || typeof id !== "string", "Existing public fixture is absent; do not seed the database.");
  let mode: number | "invalid" = 503;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/feed/*/comments", async route => {
    expect(route.request().method()).toBe("GET");
    if (mode === "invalid") return route.fulfill({ json: {} });
    if (mode === 200) { await gate; return route.fulfill({ json: { comments: [], total: 0 } }); }
    return route.fulfill({ status: mode, json: { error: "Sentetik yorum okuma hatası." } });
  });
  await page.goto(`/p/${encodeURIComponent(id)}`);
  const comments = page.locator("#comments");
  await expect(comments.locator(".ui-content-state-unavailable")).toBeVisible();
  await expect(comments.locator("#post-comments-title span")).toHaveText("—");
  await expect(comments.getByRole("textbox", { name: "Yorumun", exact: true })).toBeDisabled();
  mode = 500;
  await comments.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(comments.locator(".ui-content-state-error")).toBeVisible();
  await expect(comments.locator(".ui-content-state-empty")).toHaveCount(0);
  mode = "invalid";
  await comments.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  await expect(comments.locator(".ui-content-state-error")).toContainText("Yorum yanıtı doğrulanamadı.");
  mode = 200;
  await comments.getByRole("button", { name: "Yeniden dene", exact: true }).click();
  try {
    await expect(comments.locator(".ui-content-state-loading")).toBeVisible();
    await expect(comments.locator("#post-comments-title span")).toHaveText("—");
  } finally { release(); }
  await expect(comments.locator(".ui-content-state-empty")).toBeVisible();
  await expect(comments.locator("#post-comments-title span")).toHaveText("0");
});

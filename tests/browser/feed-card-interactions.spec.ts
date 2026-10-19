import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("mixed cards share hierarchy while keeping spoilers and event participation separate", async ({ page }, testInfo) => {
  let writes = 0;
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const shared = { createdAt: "2026-10-17T12:00:00Z", community: { name: "Uzun Adlı İlgi Alanları Topluluğu", slug: "mixed-design" }, author: { ownerName: "Topluluk Yazarı", slug: "mixed-author" }, excerpt: "Genel akışa açık kısa içerik.", likeCount: 0, viewerLiked: false, viewerSaved: false, canLike: false, canSave: false };
  const communityItems = [
    { ...shared, id: "review-design", kind: "post", type: "review", title: "Bir kitabın uzun yolculuğunu konuşalım", subjectTitle: "Sentetik Kitap", reviewKind: "book", rating: 8, spoiler: true, excerpt: "SPOILER_ASLA_GOSTERME", referenceProvider: null },
    { ...shared, id: "discussion-design", kind: "post", type: "discussion", title: "Bu hafta ne keşfettik?", spoiler: false },
    { ...shared, id: "event-design", kind: "event", title: "Kutu oyunu buluşması", startsAt: "2026-12-20T14:00:00Z", timeZone: "Europe/Istanbul", city: "İstanbul", venue: "Uzun Bir Mekân Adı ".repeat(5), capacity: null, status: "cancelled" },
  ];
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/**", route => {
    if (route.request().method() !== "GET") { writes++; return route.fulfill({ status: 500, json: {} }); }
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/accounts/me") return route.fulfill({ status: 401, json: {} });
    if (path === "/api/feed/mixed") return route.fulfill({ json: { posts: [], communityItems, nextCursor: null } });
    return route.fulfill({ json: { users: [], tracks: [], totals: {}, goals: [], achievements: [], highlights: [] } });
  });
  await page.goto("/");
  const feed = page.locator("#feed-posts");
  await expect(feed.locator(".feed-post-card")).toHaveCount(3);
  await expect(feed.getByText("SPOILER_ASLA_GOSTERME", { exact: true })).toHaveCount(0);
  await expect(feed.locator('[data-feed-kind="review"]')).toContainText("8/10");
  await expect(feed.locator('[data-feed-kind="event"]')).toContainText("Etkinlik iptal edildi.");
  await expect(feed.locator('[data-feed-kind="event"]')).toContainText("Katılımcı sınırı yok");
  await expect(feed.getByRole("button", { name: /Katıl/ })).toHaveCount(0);
  for (const kind of ["review", "discussion", "event"]) {
    const card = feed.locator(`[data-feed-kind="${kind}"]`);
    await expect(card.locator(".feed-post-header")).toBeVisible();
    await expect(card.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(card.locator(".feed-content-kind")).toBeVisible();
  }
  expect((await new AxeBuilder({ page }).include("#feed-posts").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mixed-card-hierarchy.png"), fullPage: true });
  expect(writes).toBe(0); expect(errors).toEqual([]);
});

test("feed card menu supports keyboard focus and note disclosure semantics", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  let writes = 0;
  const post = { id: "keyboard-card", trackId: "synthetic", trackName: "Klavye Denemesi", artistName: "Sentetik Sanatçı", albumName: null, externalUrl: null, note: "Uzun bir paylaşım açıklaması. ".repeat(12), tags: ["Keşif"], createdAt: "2026-10-17T12:00:00Z", likeCount: 2, addCount: 0, commentCount: 1, likedByMe: false, addedByMe: false, savedByMe: false, followingAuthor: false, isMine: false, recommendationReason: null, author: { id: "keyboard-author", ownerName: "Klavye Yazarı", slug: "keyboard-author" } };
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== "GET") { writes++; return route.fulfill({ status: 500, json: { error: "Bu test yazma yapmaz." } }); }
    if (path === "/api/accounts/me") return route.fulfill({ status: 401, json: {} });
    if (path === "/api/feed/mixed") return route.fulfill({ json: { posts: [post], communityItems: [], nextCursor: null, emptyReason: null } });
    return route.fulfill({ json: { users: [], tracks: [], totals: {}, goals: [], achievements: [], highlights: [] } });
  });
  await page.goto("/");
  const card = page.locator('[data-feed-id="music:keyboard-card"]');
  const trigger = card.getByRole("button", { name: "Paylaşım menüsü - Klavye Denemesi", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = card.getByRole("menu", { name: "Paylaşım işlemleri", exact: true });
  const first = menu.getByRole("menuitem", { name: "Daha sonra kaydet", exact: true });
  await expect(first).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-controls", await menu.getAttribute("id") as string);
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "İlgilenmiyorum", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(menu.getByRole("menuitem", { name: "Şikâyet et", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(menu.getByRole("menuitem", { name: "Şikâyet et", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(first).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menu).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe("BODY");
  const more = card.getByRole("button", { name: "Devamını gör", exact: true });
  await expect(more).toHaveAttribute("aria-expanded", "false");
  await more.click();
  const less = card.getByRole("button", { name: "Daha az göster", exact: true });
  await expect(less).toHaveAttribute("aria-expanded", "true");
  await expect(less).toHaveAttribute("aria-controls", await card.locator(".feed-post-note").getAttribute("id") as string);
  await less.click();
  await expect(more).toHaveAttribute("aria-expanded", "false");
  expect((await new AxeBuilder({ page }).include('[data-feed-id="music:keyboard-card"]').withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  expect(writes).toBe(0); expect(errors).toEqual([]);
});

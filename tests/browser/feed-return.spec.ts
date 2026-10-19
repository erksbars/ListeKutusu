import { expect, test, type Page } from "@playwright/test";

async function mockFeed(page: Page, actualId = "synthetic-target") {
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  const posts = Array.from({ length: 15 }, (_, index) => ({ id: index === 8 ? actualId : `return-card-${index}`, trackId: `track-${index}`, trackName: `Dönüş denemesi ${index}`, artistName: "Sentetik Sanatçı", albumName: null, externalUrl: null, note: "Akış konumunu korumak için uzun açıklama. ".repeat(5), tags: ["Rock"], createdAt: "2026-10-17T12:00:00Z", likeCount: 0, addCount: 0, commentCount: 0, likedByMe: false, addedByMe: false, savedByMe: false, followingAuthor: false, isMine: false, recommendationReason: null, author: { id: "return-author", ownerName: "Dönüş Yazarı", slug: "return-author" } }));
  await page.route("**/api/**", route => {
    expect(route.request().method()).toBe("GET");
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/accounts/me") return route.fulfill({ status: 401, json: {} });
    if (path === "/api/feed/mixed" || path === "/api/feed") return route.fulfill({ json: { posts, communityItems: [], nextCursor: null } });
    if (path.endsWith("/comments")) return route.fulfill({ json: { comments: [], total: 0 } });
    return route.fulfill({ json: { users: [], tracks: [], totals: {}, goals: [], achievements: [], highlights: [] } });
  });
}

test("feed scope kind and topic survive reload and incompatible changes clear hidden filters", async ({ page }) => {
  await mockFeed(page);
  await page.goto("/?scope=trending&topic=rock");
  await expect(page.getByRole("tab", { name: "Yükselen", exact: true })).toHaveAttribute("aria-selected", "true");
  const topics = page.getByRole("group", { name: "Akışı etikete göre süz", exact: true });
  await expect(topics.getByRole("button", { name: "rock", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Yeni", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("combobox", { name: "Akış içerik türü", exact: true }).selectOption("music");
  await topics.getByRole("button", { name: "rock", exact: true }).click();
  await expect(page).toHaveURL(/\?kind=music&topic=rock$/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Akış içerik türü", exact: true })).toHaveValue("music");
  await expect(topics.getByRole("button", { name: "rock", exact: true })).toHaveAttribute("aria-pressed", "true");
  const homeLogin = new URL(await page.getByRole("link", { name: "Giriş yap", exact: true }).first().getAttribute("href") as string, page.url());
  expect(homeLogin.searchParams.get("next")).toBe("/?kind=music&topic=rock");
  await page.getByRole("combobox", { name: "Akış içerik türü", exact: true }).selectOption("review");
  await expect(page).toHaveURL(/\?kind=review$/);
  await page.getByRole("tab", { name: "Takip", exact: true }).click();
  await expect(page).toHaveURL(/\/account\?mode=login&next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/?scope=following");
});

test("music detail back link and browser back restore source filters and visible card", async ({ page }) => {
  const response = await page.request.get("/api/feed?take=1");
  const data = await response.json().catch(() => null), id = data?.posts?.[0]?.id;
  test.skip(!response.ok() || typeof id !== "string", "Existing public post is absent; never seed or create a session.");
  await mockFeed(page, id);
  await page.goto("/?kind=music&topic=rock");
  const card = page.locator(`[data-feed-id="music:${id}"]`);
  const detail = card.getByRole("heading").getByRole("link");
  await detail.click();
  await expect(page).toHaveURL(/\/p\//);
  const back = page.getByRole("link", { name: "Akışa dön", exact: true });
  await expect(back).toHaveAttribute("href", `/?kind=music&topic=rock#post-${id}`);
  const commentLogin = await page.getByRole("link", { name: "Tartışmaya katılmak için giriş yap", exact: true }).getAttribute("href");
  const loginNext = new URL(commentLogin as string, page.url()).searchParams.get("next");
  expect(loginNext).toBe(`/p/${id}?from=${encodeURIComponent(`/?kind=music&topic=rock#post-${id}`)}#comments`);
  await back.click();
  await expect(page).toHaveURL(new RegExp(`kind=music&topic=rock#post-${id}$`));
  await expect(page.getByRole("combobox", { name: "Akış içerik türü", exact: true })).toHaveValue("music");
  await expect(card).toBeInViewport();
  await expect(card.locator(".feed-post-permalink")).toBeFocused();
  await detail.click();
  await expect(page).toHaveURL(/\/p\//);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`kind=music&topic=rock#post-${id}$`));
  await expect(card).toBeInViewport();
  await page.goto(`/p/${id}?from=${encodeURIComponent("//evil.test")}`);
  await expect(back).toHaveAttribute("href", "/");
});

import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("mixed timeline preserves music actions, kind filters, following and stale-request safety", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local mixed feed integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  page.setDefaultTimeout(20_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(index => `mixed-${index}-${suffix}@example.test`);
  const author = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  try {
    for (const [index, client] of [context, author].entries()) {
      const registered = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: index ? "Karma Akış Yazarı" : "Karma Akış Okuru", playlistName: "Geçici test", email: emails[index], password: `Test-${suffix}-42` } });
      expect(registered.status()).toBe(200);
    }
    const owner = await db.userList.findUniqueOrThrow({ where: { email: emails[1] }, select: { id: true } });
    const community = await author.request.post("/api/communities", { headers: { Origin: baseURL }, data: { name: "Karma Akış Denemesi", category: "interest", description: "Yalnız otomatik karma akış testidir.", rules: "Gerçek etkinlik veya gerçek kullanıcı verisi değildir." } });
    expect(community.status()).toBe(201); const { slug } = await community.json();
    const api = `/api/communities/${slug}`;
    const reviewResponse = await author.request.post(api, { headers: { Origin: baseURL }, data: { action: "create-post", title: "Karma akış incelemesi", body: "Bu spoiler metni karma akışa sızmamalıdır.", type: "review", reviewKind: "book", subjectTitle: "Kurgusal kitap", rating: 8, spoiler: true, distribution: "general" } });
    expect(reviewResponse.status()).toBe(200); const { post: review } = await reviewResponse.json();
    const privateResponse = await author.request.post(api, { headers: { Origin: baseURL }, data: { action: "create-post", title: "Yalnız topluluk paylaşımı", body: "Karma akışa çıkmayan örnek." } });
    expect(privateResponse.status()).toBe(200);
    const eventResponse = await author.request.post(`${api}/events`, { headers: { Origin: baseURL }, data: { title: "Karma akış etkinliği", description: "Kurgusal duyurudur. Gerçek bir buluşma veya rezervasyon değildir.", localStart: new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16), city: "Örnek şehir", venue: "Kurgusal kamusal mekân", publicLocationConfirmed: true, distribution: "general" } });
    expect(eventResponse.status()).toBe(201); const { event } = await eventResponse.json();
    const music = await db.feedPost.create({ data: { authorId: owner.id, trackId: `local-${suffix}`, trackName: "Karma akış test şarkısı", artistName: "Kurgusal sanatçı", source: "local-test", note: "Dış sağlayıcı çağrısı yok.", createdAt: new Date(Date.now() - 2000) } });
    await db.communityPost.update({ where: { id: review.id }, data: { createdAt: new Date(Date.now() - 1000) } });
    const eventDate = new Date(); await db.communityEvent.update({ where: { id: event.id }, data: { createdAt: eventDate } });
    // A second user's cookie is real; fixture metadata never calls Spotify.
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.route("**/api/discovery/random**", route => route.fulfill({ json: { sourceName: "Yerel test seçkisi", total: 0, tracks: [] } }));
    await page.goto("/");
    const feed = page.locator("#feed-posts");
    await expect(feed.locator("[data-feed-id]").first()).toHaveAttribute("data-feed-id", `event:${event.id}`, { timeout: 30_000 });
    await expect.poll(() => feed.locator("[data-feed-id]").evaluateAll(nodes => nodes.slice(0, 3).map(node => node.getAttribute("data-feed-id")))).toEqual([`event:${event.id}`, `post:${review.id}`, `music:${music.id}`]);
    await expect(feed.getByText("Yalnız topluluk paylaşımı", { exact: true })).toHaveCount(0);
    await expect(feed.getByText("Bu spoiler metni karma akışa sızmamalıdır.", { exact: true })).toHaveCount(0);
    const musicCard = feed.locator(`[data-feed-id="music:${music.id}"]`);
    await musicCard.getByRole("button", { name: "Beğen", exact: true }).click();
    await expect(musicCard.getByRole("button", { name: "Beğeniyi kaldır", exact: true })).toHaveAttribute("aria-pressed", "true");
    await musicCard.getByRole("button", { name: "Daha sonra kaydet", exact: true }).click();
    await expect(musicCard.getByRole("button", { name: "Kaydı kaldır", exact: true })).toHaveAttribute("aria-pressed", "true");
    const kinds = page.getByRole("combobox", { name: "Akış içerik türü", exact: true });
    await kinds.selectOption("review");
    await expect(feed.locator("[data-feed-kind]")).toHaveCount(1);
    await expect(feed.locator("[data-feed-kind]")).toHaveAttribute("data-feed-kind", "review");
    await kinds.selectOption("music");
    await expect(musicCard).toBeVisible();
    await expect(feed.locator('[data-feed-kind="review"]')).toHaveCount(0);
    await expect(musicCard.getByRole("button", { name: "Beğeniyi kaldır", exact: true })).toBeVisible();
    await expect(musicCard.getByRole("button", { name: "Kaydı kaldır", exact: true })).toBeVisible();
    // Delay a stale response deliberately, then switch kinds before it arrives.
    let markStarted!: () => void, release!: () => void;
    const started = new Promise<void>(resolve => { markStarted = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/feed/mixed?*", async route => {
      if (new URL(route.request().url()).searchParams.get("filter") !== "event") return route.continue();
      const response = await route.fetch(); markStarted(); await gate;
      await route.fulfill({ response }).catch(() => {});
    });
    await kinds.selectOption("event"); await started;
    await kinds.selectOption("review"); release();
    await expect(feed.locator("[data-feed-kind]")).toHaveCount(1);
    await expect(feed.locator("[data-feed-kind]")).toHaveAttribute("data-feed-kind", "review");
    await page.unroute("**/api/feed/mixed?*");
    await kinds.selectOption("all");
    await expect(feed.locator(`[data-feed-id="event:${event.id}"]`)).toBeVisible();
    await page.getByRole("tab", { name: "Takip", exact: true }).click();
    await expect(page.getByText("Takip akışın boş", { exact: true })).toBeVisible();
    expect((await context.request.post("/api/profiles/follow", { headers: { Origin: baseURL }, data: { profileId: owner.id } })).status()).toBe(200);
    await page.getByRole("button", { name: "Akışı yenile", exact: true }).click();
    await expect(feed.locator("[data-feed-id]")).toHaveCount(3);
    expect(await feed.locator("[data-feed-id]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-feed-id")))).toEqual([`event:${event.id}`, `post:${review.id}`, `music:${music.id}`]);
    await feed.evaluate(element => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 140, behavior: "instant" }); });
    await page.screenshot({ path: "test-results/browser/mixed-feed-desktop.png", fullPage: false, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("tab", { name: "Kaydedilen", exact: true }).click();
    await expect(musicCard).toBeVisible();
    await expect(page.getByText("Bu görünüm yalnız müzik paylaşımlarını kapsar.", { exact: false })).toBeVisible();
    await expect(feed.locator('[data-feed-kind="event"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await author.close().catch(() => {});
    try {
      const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email: { in: emails } } });
    } finally { await db.$disconnect(); }
  }
});

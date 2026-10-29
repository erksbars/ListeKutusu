import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("public community labels and upcoming events are searchable without private-profile matching", async ({ page, context, browser, request, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local discovery integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(index => `discovery-${index}-${suffix}@example.test`);
  const reader = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const readerPage = await reader.newPage(); readerPage.setDefaultTimeout(25_000);
  const errors: string[] = []; for (const target of [page, readerPage]) target.on("pageerror", error => errors.push(error.message));
  const school = "Örnek Kampüs Üniversitesi", privateSchool = "Gizli Profil Üniversitesi";
  try {
    for (const [index, client] of [context, reader].entries()) {
      const response = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[index], password: `Test-${suffix}-42`, ownerName: index ? "Keşif Okuru" : "Keşif Kurucusu", playlistName: "Geçici test" } });
      expect(response.status()).toBe(200);
    }
    expect((await context.request.patch("/api/accounts/settings", { headers: { Origin: baseURL }, data: { action: "update-profile", university: { name: privateSchool, public: false } } })).status()).toBe(200);
    for (const target of [page, readerPage]) await target.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto("/communities/create");
    await page.getByRole("textbox", { name: "Topluluk adı", exact: true }).fill("Kampüs Keşif Denemesi");
    await page.getByRole("combobox", { name: "Kategori", exact: true }).selectOption("university");
    await page.getByRole("textbox", { name: "Topluluk üniversitesi (isteğe bağlı)", exact: true }).fill(school);
    await page.getByRole("textbox", { name: "Topluluk şehri (isteğe bağlı)", exact: true }).fill("Ankara");
    await page.getByRole("combobox", { name: "Topluluğun ilgi alanı", exact: true }).selectOption("boardgame");
    await page.getByRole("textbox", { name: "Açıklama", exact: true }).fill("Gerçek kurum bağlantısı olmayan otomatik keşif topluluğu.");
    await page.getByRole("textbox", { name: "Topluluk kuralları", exact: true }).fill("Gerçek bir buluşma veya kurum değildir; yalnız test verisidir.");
    await page.getByRole("button", { name: "Topluluk oluştur", exact: true }).click();
    await expect(page).toHaveURL(/\/communities\/kampus-kesif-denemesi-/, { timeout: 30_000 });
    const slug = new URL(page.url()).pathname.split("/").at(-1)!;
    const api = `/api/communities/${slug}`;
    await expect(page.getByText(`Üniversite: ${school} · Topluluk beyanı`, { exact: true })).toBeVisible();
    const input = { title: "Kamusal keşif etkinliği", description: "Gerçek buluşma değildir; yalnız otomatik keşif testi duyurusudur.", localStart: new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000).toISOString().slice(0, 16), city: "İstanbul", venue: "Kurgusal kamusal mekân", publicLocationConfirmed: true, distribution: "general" };
    const eventResponse = await context.request.post(`${api}/events`, { headers: { Origin: baseURL }, data: input });
    expect(eventResponse.status()).toBe(201); const { event } = await eventResponse.json();
    expect((await context.request.post(`${api}/events`, { headers: { Origin: baseURL }, data: { ...input, title: "Yalnız topluluk etkinliği", distribution: "community" } })).status()).toBe(201);
    expect((await reader.request.post(api, { headers: { Origin: baseURL }, data: { action: "update-discovery", city: "İzmir" } })).status()).toBe(403);
    const filtered = async (view: string, university: string, city: string, interest: string) => {
      const response = await reader.request.get(`/api/communities?${new URLSearchParams({ view, university, city, interest })}`);
      expect(response.status()).toBe(200); return response.json();
    };
    expect((await filtered("communities", "ornek kampus", "ANKARA", "boardgame")).communities.some((item: { slug: string }) => item.slug === slug)).toBe(true);
    expect((await filtered("communities", privateSchool, "ANKARA", "boardgame")).total).toBe(0);
    expect((await filtered("events", "ornek kampus", "ANKARA", "boardgame")).total).toBe(0);
    expect((await filtered("events", "ornek kampus", "ISTANBUL", "boardgame")).events.map((item: { id: string }) => item.id)).toEqual([event.id]);
    await readerPage.goto(`/search?${new URLSearchParams({ q: school })}`);
    await readerPage.getByRole("link", { name: "Kampüs Keşif Denemesi", exact: true }).click();
    await expect(readerPage).toHaveURL(new RegExp(`/communities/${slug}$`));
    await readerPage.goto(`/search?${new URLSearchParams({ q: input.title, type: "posts" })}`);
    await readerPage.getByRole("link", { name: input.title, exact: true }).click();
    await expect(readerPage).toHaveURL(new RegExp(`event=${event.id}`));
    await expect(readerPage.getByRole("heading", { name: input.title, exact: true })).toBeVisible();
    await expect(readerPage.getByRole("button", { name: "Katılacağım", exact: true })).toHaveCount(0);
    await readerPage.goBack(); await expect(readerPage).toHaveURL(/\/search\?/);
    await page.getByText("Keşif bilgilerini düzenle", { exact: true }).click();
    const editor = page.getByRole("form", { name: "Topluluk keşif bilgileri", exact: true });
    await editor.getByRole("combobox", { name: "Topluluğun ilgi alanı", exact: true }).selectOption("book");
    const saved = page.waitForResponse(value => new URL(value.url()).pathname === api && value.request().method() === "POST");
    await editor.getByRole("button", { name: "Keşif bilgilerini kaydet", exact: true }).click(); expect((await saved).status()).toBe(200);
    await expect(page.getByText("İlgi alanı: Kitap", { exact: true })).toBeVisible();
    expect((await filtered("events", "ornek kampus", "ISTANBUL", "boardgame")).total).toBe(0);
    expect((await filtered("events", "ornek kampus", "ISTANBUL", "book")).events.map((item: { id: string }) => item.id)).toEqual([event.id]);
    expect((await request.get("/api/communities?view=invalid")).status()).toBe(400);
    await readerPage.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
    await readerPage.screenshot({ path: "test-results/browser/community-discovery-desktop.png", fullPage: true, animations: "disabled" });
    expect(await readerPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const owner = await db.userList.findUniqueOrThrow({ where: { email: emails[0] }, select: { id: true } });
    expect((await reader.request.post("/api/profiles/block", { headers: { Origin: baseURL }, data: { profileId: owner.id } })).status()).toBe(200);
    const params = new URLSearchParams({ view: "events", university: "ornek kampus", city: "istanbul", interest: "book" });
    expect((await (await reader.request.get(`/api/communities?${params}`)).json()).events).toHaveLength(0);
    const publicResponse = await request.get(`/api/communities?${params}`);
    expect(publicResponse.headers()["cache-control"]).toContain("no-store");
    expect((await publicResponse.json()).events).toHaveLength(1);
    const privateResponse = await request.get(`/api/communities?view=events&university=${encodeURIComponent(privateSchool)}`);
    expect((await privateResponse.json()).events).toHaveLength(0);
    expect(errors).toEqual([]);
  } finally {
    await reader.close().catch(() => {});
    try {
      const users = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
      await db.community.deleteMany({ where: { ownerId: { in: users.map(user => user.id) } } });
      await db.userList.deleteMany({ where: { email: { in: emails } } });
    } finally { await db.$disconnect(); }
  }
});

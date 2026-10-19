import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

// Explicit opt-in: real external requests, a temporary account, and real cookie auth.
test("live catalog to private library to public showcase and withdrawal", async ({ page, context, browser, baseURL }) => {
  test.skip(process.env.MEDIA_LIVE_E2E !== "1", "Live providers are opt-in, never part of routine tests.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000);
  const db = new PrismaClient();
  const email = `media-live-${randomUUID()}@example.test`;
  const visitor = await browser.newContext({ baseURL });
  const visitorPage = await visitor.newPage();
  try {
    const registration = await context.request.post("/api/accounts", {
      headers: { Origin: baseURL },
      data: { ownerName: "Medya Deneme", playlistName: "Geçici test", email, password: `Test-${randomUUID()}-42` },
    });
    expect(registration.status()).toBe(200);
    // Cookie is obtained through the actual registration response, not a forged DB session.
    expect((await context.cookies()).some(cookie => cookie.name === "account_session")).toBe(true);
    const user = await db.userList.findUniqueOrThrow({ where: { email }, select: { id: true, slug: true } });
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    expect((await visitor.request.get("/api/library")).status()).toBe(401);
    const cases = [
      { kind: "tv", query: "Breaking Bad", label: "Dizi ara", provider: "tvmaze", status: "watched" },
      { kind: "book", query: "Crime and Punishment", label: "Kitap veya yazar ara", provider: "openlibrary", status: "read" },
      { kind: "movie", query: "Inception", label: "Film ara", provider: "wikidata", status: "watched" },
    ];
    for (const sample of cases) {
      await test.step(sample.provider, async () => {
        await page.goto(`/library?type=${sample.kind}`);
        const search = page.waitForResponse(response => response.url().includes("/api/catalog/search?"), { timeout: 30_000 });
        await page.getByLabel(sample.label, { exact: true }).fill(sample.query);
        const response = await search;
        expect(response.status(), `${sample.provider} live search status`).toBe(200);
        const { results } = await response.json();
        expect(results.length).toBeGreaterThan(0);
        const selected = results[0];
        expect(selected.provider).toBe(sample.provider);
        await page.getByRole("button", { name: "Kitaplığıma ekle", exact: true }).first().click();
        const status = page.getByLabel(`${selected.title} durumu`, { exact: true });
        await expect(status).toBeVisible();
        await status.selectOption(sample.status);
        await expect(status).toHaveValue(sample.status);
        await page.reload();
        await expect(status).toHaveValue(sample.status);
        let publicData = await (await visitor.request.get(`/api/profiles?slug=${user.slug}`)).json();
        expect(publicData.profile.mediaShowcase).toEqual([]);
        await page.getByRole("button", { name: "Profil vitrinine ekle", exact: true }).click();
        await page.getByRole("button", { name: "Herkese açık vitrine ekle", exact: true }).click();
        await expect(page.getByText("Profil vitrini için seçildi · Herkese açık")).toBeVisible();
        publicData = await (await visitor.request.get(`/api/profiles?slug=${user.slug}`)).json();
        expect(publicData.profile.mediaShowcase).toHaveLength(1);
        expect(publicData.profile.mediaShowcase[0].catalogId).toBe(selected.id);
        expect(publicData.profile.mediaShowcase[0].status).toBeUndefined();
        expect(publicData.profile.mediaShowcase[0].userId).toBeUndefined();
        await visitorPage.goto(`/u/${user.slug}`);
        const showcase = visitorPage.getByRole("region", { name: "Film, dizi ve kitap seçimleri" });
        await expect(showcase.getByRole("heading", { name: selected.title, exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Vitrinden kaldır", exact: true }).click();
        await expect(page.getByText("Özel kayıt · Yalnız sen görebilirsin")).toBeVisible();
        await visitorPage.reload();
        await expect(showcase).toHaveCount(0);
        await page.getByRole("button", { name: "Kitaplıktan kaldır", exact: true }).click();
        await page.getByRole("button", { name: "Kaldırmayı onayla", exact: true }).click();
        await expect(page.getByText("Bu raf henüz boş.")).toBeVisible();
        expect(await db.mediaLibraryEntry.count({ where: { userId: user.id } })).toBe(0);
      });
    }
  } finally {
    // Exact randomized address belongs only to this run, even if registration response failed.
    await visitor.close();
    try { await db.userList.deleteMany({ where: { email } }); }
    finally { await db.$disconnect(); }
  }
});

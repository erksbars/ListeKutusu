import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

test("public profile exposes only explicitly showcased media", async ({ page, baseURL }, testInfo) => {
  test.skip(process.env.MEDIA_SHOWCASE_E2E !== "1", "Requires a local server with MEDIA_CATALOG_ENABLED=true.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(90_000);
  const db = new PrismaClient();
  let userId: string | undefined;
  try {
    const user = await db.userList.create({ data: { ownerName: "Vitrin Testi", slug: `showcase-test-${Date.now()}` } });
    userId = user.id;
    const common = { userId, kind: "book", provider: "openlibrary", creators: '["Test Yazarı"]', year: 2020, status: "reading", sourceUrl: "https://openlibrary.org/works/OL1W" };
    const visible = await db.mediaLibraryEntry.create({ data: { ...common, catalogId: "openlibrary:book:OL1W", externalId: "OL1W", title: "Vitrindeki Kitap", showcasedAt: new Date() } });
    await db.mediaLibraryEntry.create({ data: { ...common, catalogId: "openlibrary:book:OL2W", externalId: "OL2W", title: "Özel Kitap" } });
    await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto(`/u/${user.slug}`);
    const showcase = page.getByRole("region", { name: "Film, dizi ve kitap seçimleri" });
    await expect(showcase.getByText("Vitrindeki Kitap", { exact: true })).toBeVisible();
    await expect(page.getByText("Özel Kitap", { exact: true })).toHaveCount(0);
    await expect(showcase.getByRole("link", { name: "Vitrini yönet ↗" })).toHaveCount(0);
    const response = await page.request.get(`/api/profiles?slug=${user.slug}`);
    const { profile } = await response.json();
    expect(profile.mediaShowcase).toHaveLength(1);
    expect(profile.mediaShowcase[0].status).toBeUndefined();
    expect(profile.mediaShowcase[0].userId).toBeUndefined();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await showcase.screenshot({ path: testInfo.outputPath("media-showcase-desktop.png") });
    await db.mediaLibraryEntry.update({ where: { id: visible.id }, data: { showcasedAt: null } });
    await page.reload();
    await expect(showcase).toHaveCount(0);
  } finally {
    if (userId) await db.userList.delete({ where: { id: userId } });
    await db.$disconnect();
  }
});

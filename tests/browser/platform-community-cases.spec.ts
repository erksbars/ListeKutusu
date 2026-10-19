import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("private platform appeal and independent admin response with drafts and revocation", async ({ page, context, browser, request, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local platform integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), emails = [0, 1].map(i => `platform-case-${i}-${suffix}@example.test`), ids: string[] = [], fixtureOwner = `platform-owner-${suffix}`;
  const admin = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const adminPage = await admin.newPage(); adminPage.setDefaultTimeout(25_000);
  const errors: string[] = []; for (const target of [page, adminPage]) target.on("pageerror", error => errors.push(error.message));
  const headers = { Origin: baseURL };
  try {
    for (const [i, client] of [context, admin].entries()) {
      expect((await client.request.post("/api/accounts", { headers: { ...headers, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { email: emails[i], password: `Test-${suffix}-42`, ownerName: i ? "Bağımsız Pilot Yöneticisi" : "Pilot Başvuranı", playlistName: "Geçici test" } })).status()).toBe(200);
      ids.push((await db.userList.findUniqueOrThrow({ where: { email: emails[i] } })).id);
    }
    await db.userList.update({ where: { id: ids[1] }, data: { role: "admin" } }); // Only the newly created fixture account.
    await db.userList.create({ data: { id: fixtureOwner, ownerName: "Geçici Topluluk Sahibi", slug: fixtureOwner } });
    const community = await db.community.create({ data: { slug: `platform-test-${suffix}`, name: "Platform Başvuru Denemesi", description: "Yalnız otomatik özel başvuru testi.", rules: "Gerçek kişi veya etkinlik içermez.", category: "interest", ownerId: fixtureOwner, status: "archived", archivedAt: new Date(), members: { create: [{ userId: fixtureOwner, role: "owner" }, { userId: ids[0], status: "banned" }] } } });
    await db.communityModerationLog.create({ data: { communityId: community.id, actorId: fixtureOwner, action: "ban", targetType: "member", targetId: ids[0] } });
    expect((await request.get("/api/community-cases")).status()).toBe(401);
    expect((await context.request.get("/api/admin/community-cases")).status()).toBe(401);
    expect((await context.request.post("/api/community-cases", { headers: { Origin: "https://example.invalid" }, data: {} })).status()).toBe(403);
    for (const target of [page, adminPage]) await target.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto(`/communities/${community.slug}`);
    await page.getByRole("link", { name: "Platforma bildir / itiraz et ↗", exact: true }).click();
    const form = page.getByRole("form", { name: "Platforma başvuru", exact: true });
    await form.getByRole("combobox", { name: "Başvuru türü", exact: true }).selectOption("ban_appeal");
    const reason = form.getByRole("textbox", { name: "Başvuru açıklaması", exact: true });
    await reason.fill("Uzaklaştırma kararının bağımsız incelenmesini istiyorum. Yalnız test açıklamasıdır.");
    let failSubmit = true;
    await page.route("**/api/community-cases", route => {
      if (route.request().method() !== "POST" || !failSubmit) return route.continue();
      failSubmit = false; return route.fulfill({ status: 503, json: { error: "Geçici başvuru gönderim hatası" } });
    });
    await form.getByRole("button", { name: "Platforma gönder", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Geçici başvuru gönderim hatası" })).toBeVisible();
    await expect(reason).toHaveValue(/Uzaklaştırma kararının bağımsız/);
    await form.getByRole("button", { name: "Platforma gönder", exact: true }).click();
    await expect(page.getByText("1 başvuru · Sayfa 1", { exact: true })).toBeVisible();
    await page.unroute("**/api/community-cases");
    const application = await db.platformCommunityCase.findFirstOrThrow({ where: { applicantId: ids[0] } });
    expect((await (await admin.request.get("/api/community-cases")).json()).total).toBe(0);
    await adminPage.goto("/admin/community-cases");
    const decision = adminPage.getByRole("form", { name: "Platform kararı", exact: true });
    const response = decision.getByRole("textbox", { name: "Başvurana yanıt", exact: true });
    await response.fill("Bağımsız inceleme kaydedildi. Bu pilot yanıtı kaynak kararı otomatik değiştirmez.");
    let failReview = true;
    await adminPage.route("**/api/admin/community-cases", route => {
      if (route.request().method() !== "PATCH" || !failReview) return route.continue();
      failReview = false; return route.fulfill({ status: 503, json: { error: "Geçici platform karar hatası" } });
    });
    await decision.getByRole("button", { name: "Kararı kaydet", exact: true }).click();
    await adminPage.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(adminPage.getByRole("alert").filter({ hasText: "Geçici platform karar hatası" })).toBeVisible();
    await expect(response).toHaveValue(/Bağımsız inceleme kaydedildi/);
    await decision.getByRole("button", { name: "Kararı kaydet", exact: true }).click();
    await adminPage.getByRole("dialog").getByRole("button", { name: "Onayla", exact: true }).click();
    await expect(adminPage.getByText("Bu görünümde başvuru yok.", { exact: true })).toBeVisible();
    await adminPage.unroute("**/api/admin/community-cases");
    await page.getByRole("button", { name: "Başvuruları yenile", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Platform yanıtı", exact: true })).toBeVisible();
    await expect(page.getByText("Bağımsız inceleme kaydedildi. Bu pilot yanıtı kaynak kararı otomatik değiştirmez.", { exact: true })).toBeVisible();
    const own = await context.request.get("/api/community-cases"); expect(own.headers()["cache-control"]).toContain("no-store");
    const payload = JSON.stringify(await own.json()); expect(payload).not.toContain("reviewerId"); expect(payload).not.toContain(ids[1]);
    expect((await db.communityMember.findUniqueOrThrow({ where: { communityId_userId: { communityId: community.id, userId: ids[0] } } })).status).toBe("banned");
    expect((await admin.request.patch("/api/admin/community-cases", { headers, data: { id: application.id, status: "dismissed", response: "Eski formdaki yanıtın uygulanmaması gerekir.", expectedVersion: 0 } })).status()).toBe(409);
    const exported = await (await context.request.get("/api/accounts/export")).json(); expect(exported.account.platformCommunityCases).toHaveLength(1);
    await page.screenshot({ path: "test-results/browser/platform-community-cases-desktop.png", fullPage: false, animations: "disabled" });
    await db.userList.update({ where: { id: ids[1] }, data: { role: "moderator" } });
    expect((await admin.request.get("/api/admin/community-cases")).status()).toBe(403);
    await adminPage.reload(); await expect(adminPage.getByRole("alert").filter({ hasText: "Platform yönetimi yetkin yok." })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
  } finally {
    const leftovers = await db.userList.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const ownIds = [...new Set([...ids, fixtureOwner, ...leftovers.map(row => row.id)])];
    await db.community.deleteMany({ where: { ownerId: { in: ownIds } } }); await db.userList.deleteMany({ where: { id: { in: ownIds } } });
    await db.$disconnect(); await admin.close();
  }
});

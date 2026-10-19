import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

test("university is opt-in, private in public DTO/HTML, block-aware, exportable and erased on deletion", async ({ page, context, browser, request, baseURL }) => {
  test.skip(process.env.COMMUNITY_E2E !== "1", "Local university profile integration is opt-in.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local test only");
  test.setTimeout(180_000); page.setDefaultTimeout(25_000);
  const db = new PrismaClient(), suffix = randomUUID(), password = `Test-${suffix}-42`;
  const emails = [0, 1].map(index => `university-${index}-${suffix}@example.test`), createdIds: string[] = [];
  const visitor = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const visitorPage = await visitor.newPage();
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message)); visitorPage.on("pageerror", error => errors.push(error.message));
  const school = "Örnek Test Üniversitesi";
  try {
    for (const [index, client] of [context, visitor].entries()) {
      const registered = await client.request.post("/api/accounts", { headers: { Origin: baseURL, "X-Forwarded-For": `192.0.2.${1 + parseInt(suffix.slice(0, 2), 16) % 254}` }, data: { ownerName: index ? "Üniversite Ziyaretçisi" : "Üniversite Profil Denemesi", playlistName: "Geçici test", email: emails[index], password } });
      expect(registered.status()).toBe(200); createdIds.push((await registered.json()).list.id);
    }
    const initial = (await (await context.request.get("/api/accounts/me")).json()).list;
    expect(initial.universityName).toBeNull(); expect(initial.universityPublic).toBe(false);
    const publicApi = `/api/profiles?slug=${encodeURIComponent(initial.slug)}`;
    expect((await request.patch("/api/accounts/settings", { headers: { Origin: baseURL }, data: { action: "update-profile", university: { name: school, public: true } } })).status()).toBe(401);
    expect((await context.request.patch("/api/accounts/settings", { headers: { Origin: "https://cross-site.example" }, data: { action: "update-profile", university: { name: school, public: true } } })).status()).toBe(403);
    for (const target of [page, visitorPage]) await target.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
    await page.goto("/account?tab=profile");
    const name = page.getByRole("textbox", { name: "Üniversite (isteğe bağlı)", exact: true });
    const visibility = page.getByRole("checkbox", { name: /^Üniversitemi herkese açık profilimde göster/ });
    const save = page.getByRole("button", { name: "Profili kaydet", exact: true });
    const discard = page.getByRole("button", { name: "Değişiklikleri geri al", exact: true });
    async function saveAndWait() {
      const response = page.waitForResponse(value => new URL(value.url()).pathname === "/api/accounts/settings" && value.request().method() === "PATCH");
      await save.click(); expect((await response).status()).toBe(200);
      await expect(name).toBeEnabled(); await expect(discard).toBeDisabled();
    }
    await expect(name).toHaveValue(""); await expect(visibility).toBeDisabled();
    await name.fill("Vazgeçilen Test Üniversitesi");
    await discard.click(); await page.getByRole("dialog").getByRole("button", { name: "Değişiklikleri geri al", exact: true }).click();
    await expect(name).toHaveValue("");
    await name.fill("Ö");
    await expect(page.getByText("Üniversite adı 2–120 karakter olmalı veya boş bırakılmalı.", { exact: true })).toBeVisible();
    await name.fill(school); await expect(visibility).not.toBeChecked();
    await saveAndWait();
    for (const path of ["/api/accounts/me", "/api/accounts/me?view=summary"]) {
      const own = (await (await context.request.get(path)).json()).list;
      expect(own.universityName).toBe(school); expect(own.universityPublic).toBe(false);
    }
    const privateResponse = await request.get(publicApi);
    expect(privateResponse.headers()["cache-control"]).toContain("no-store");
    expect(await privateResponse.text()).not.toContain(school);
    expect((await (await context.request.get(publicApi)).json()).profile.universityName).toBeNull();
    expect(await (await request.get(`/u/${initial.slug}`)).text()).not.toContain(school);
    const privateExport = (await (await context.request.get("/api/accounts/export")).json()).account;
    expect(privateExport.universityName).toBe(school); expect(privateExport.universityPublic).toBe(false);
    await page.reload(); await expect(name).toHaveValue(school); await visibility.check();
    await saveAndWait();
    const shared = (await (await request.get(publicApi)).json()).profile;
    expect(shared.universityName).toBe(school); expect(shared).not.toHaveProperty("universityPublic");
    await visitorPage.goto(`/u/${initial.slug}`);
    const section = visitorPage.getByRole("region", { name: "Üniversite bilgisi", exact: true });
    await expect(section.getByText(school, { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(section.getByText("Kullanıcı beyanı · Öğrencilik doğrulanmadı.", { exact: true })).toBeVisible();
    await section.scrollIntoViewIfNeeded();
    await visitorPage.screenshot({ path: "test-results/browser/profile-university-desktop.png", fullPage: false, animations: "disabled" });
    expect(await visitorPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Older clients must not silently clear the new fields; foreign IDs are ignored.
    expect((await context.request.patch("/api/accounts/settings", { headers: { Origin: baseURL }, data: { action: "update-profile", userId: createdIds[1], bio: "Yalnız geçici test açıklaması." } })).status()).toBe(200);
    expect((await (await request.get(publicApi)).json()).profile.universityName).toBe(school);
    expect((await (await visitor.request.get("/api/accounts/me?view=summary")).json()).list.universityName).toBeNull();
    const invalid = await context.request.patch("/api/accounts/settings", { headers: { Origin: baseURL }, data: { action: "update-profile", university: { name: school, public: "true" } } });
    expect(invalid.status()).toBe(400);
    expect((await (await request.get(publicApi)).json()).profile.universityName).toBe(school);
    for (const [client, targetId] of [[visitor, createdIds[0]], [context, createdIds[1]]] as const) {
      expect((await client.request.post("/api/profiles/block", { headers: { Origin: baseURL }, data: { profileId: targetId } })).status()).toBe(200);
      expect((await (await visitor.request.get(publicApi)).json()).profile.universityName).toBeNull();
      expect((await client.request.post("/api/profiles/block", { headers: { Origin: baseURL }, data: { profileId: targetId } })).status()).toBe(200);
    }
    await page.reload(); await expect(visibility).toBeChecked(); await visibility.uncheck();
    await saveAndWait();
    expect(await (await request.get(publicApi)).text()).not.toContain(school);
    await name.fill(""); await saveAndWait();
    expect((await (await context.request.get("/api/accounts/me")).json()).list.universityName).toBeNull();
    expect((await context.request.patch("/api/accounts/settings", { headers: { Origin: baseURL }, data: { action: "update-profile", university: { name: school, public: true } } })).status()).toBe(200);
    const deleted = await context.request.delete("/api/accounts/delete", { headers: { Origin: baseURL }, data: { password, confirmation: "HESABIMI SİL" } });
    expect(deleted.status()).toBe(200);
    const erased = await db.userList.findUniqueOrThrow({ where: { id: createdIds[0] } });
    expect(erased.universityName).toBeNull(); expect(erased.universityPublic).toBe(false);
    expect((await request.get(publicApi)).status()).toBe(404);
    expect(errors).toEqual([]);
  } finally {
    await visitor.close().catch(() => {});
    try {
      // Include IDs because account deletion intentionally clears the email.
      await db.userList.deleteMany({ where: { OR: [{ id: { in: createdIds } }, { email: { in: emails } }] } });
    } finally { await db.$disconnect(); }
  }
});

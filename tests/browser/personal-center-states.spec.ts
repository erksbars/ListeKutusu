import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const centers = [
  { path: "/community-saved?page=2&postType=review&reviewKind=book", api: "**/api/communities/saved?**", refresh: "Kayıtları yenile", empty: { items: [], page: 2, hasMore: false } },
  { path: "/community-events?page=2&view=past&role=organizing", api: "**/api/communities/agenda?**", refresh: "Etkinliklerimi yenile", empty: { items: [], page: 2, hasMore: false } },
  { path: "/community-cases?community=masa", api: "**/api/community-cases?**", refresh: "Başvuruları yenile", empty: { cases: [], total: 0, page: 1, hasMore: false, context: null } },
];

for (const center of centers) {
  test(`personal center separates login, failure and empty: ${center.path}`, async ({ page }, testInfo) => {
    let status = 401;
    await page.route(center.api, route => route.fulfill({ status, json: status === 200 ? center.empty : { error: status === 401 ? "Oturum gerekli." : "Geçici okuma hatası." } }));
    await page.goto(center.path);
    const login = page.locator(".ui-content-state-login");
    await expect(login).toBeVisible();
    await expect(login).toHaveAttribute("role", "status");
    await expect(login.getByRole("link", { name: "Giriş yap", exact: true })).toHaveAttribute("href", `/account?mode=login&next=${encodeURIComponent(center.path)}`);
    await expect(page.locator(".ui-content-state-empty")).toHaveCount(0);
    if (center.path.startsWith("/community-events")) {
      expect((await new AxeBuilder({ page }).include(".ui-content-state-login").withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath("agenda-login-state.png"), animations: "disabled" });
    }
    status = 500;
    await page.getByRole("button", { name: center.refresh, exact: true }).click();
    await expect(page.locator(".ui-content-state-error")).toBeVisible();
    await expect(page.locator(".ui-content-state-error").getByRole("link")).toHaveCount(0);
    await expect(page.locator(".ui-content-state-empty")).toHaveCount(0);
    status = 200;
    await page.getByRole("button", { name: "Yeniden dene", exact: true }).click();
    await expect(page.locator(".ui-content-state-empty")).toBeVisible();
    await expect(page.locator(".ui-content-state-error, .ui-content-state-login")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("staff filter changes and revoked access never keep the previous private queue", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let revoked = false;
  await page.route("**/api/admin/community-cases?**", async route => {
    if (new URL(route.request().url()).searchParams.get("status") === "resolved") {
      await gate;
      return route.fulfill({ status: 403, json: { error: "Yetkin yok." } });
    }
    return route.fulfill(revoked ? { status: 401, json: { error: "Oturum bitti." } } : { json: { total: 1, page: 1, hasMore: false, cases: [{ id: "synthetic-private-case", kind: "community", reason: "Sentetik özel kuyruk açıklaması", status: "pending", version: 0, response: null, createdAt: "2026-10-17T12:00:00Z", reviewedAt: null, community: { slug: "masa", name: "Sentetik Masa" } }] } });
  });
  await page.goto("/admin/community-cases");
  await expect(page.getByText("Sentetik özel kuyruk açıklaması", { exact: true })).toBeVisible();
  const response = page.getByRole("textbox", { name: "Başvurana yanıt", exact: true });
  await response.fill("Korunacak özel yanıt taslağı");
  await page.getByRole("button", { name: "Başvuruları yenile", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Değişiklikler kaydedilmedi", exact: true });
  await expect(dialog.getByRole("button", { name: "Kaydet ve devam et", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(response).toHaveValue("Korunacak özel yanıt taslağı");
  await page.getByRole("combobox", { name: "Başvuru durumu", exact: true }).selectOption("resolved");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Başvuru durumu", exact: true })).toHaveValue("pending");
  await expect(response).toHaveValue("Korunacak özel yanıt taslağı");
  await page.getByRole("combobox", { name: "Başvuru durumu", exact: true }).selectOption("resolved");
  await dialog.getByRole("button", { name: "Kaydetmeden çık", exact: true }).click();
  try {
    await expect(page.getByText("Sentetik özel kuyruk açıklaması", { exact: true })).toHaveCount(0);
    await expect(page.locator(".ui-content-state-loading")).toBeVisible();
  } finally { release(); }
  await expect(page.getByRole("heading", { name: "Bu alana erişimin yok", exact: true })).toBeVisible();
  await expect(page.locator(".ui-content-state-empty, .ui-content-state-login")).toHaveCount(0);
  revoked = true;
  await page.getByRole("combobox", { name: "Başvuru durumu", exact: true }).selectOption("pending");
  await expect(page.locator(".ui-content-state-login")).toBeVisible();
  await expect(page.getByText("Sentetik özel kuyruk açıklaması", { exact: true })).toHaveCount(0);
});

test("case target cancel, failed verification, confirmed switch and failed submission preserve the right draft", async ({ page }) => {
  test.setTimeout(90_000);
  let verifyFails = true, submitFails = true;
  const writes: Record<string, unknown>[] = [];
  await page.route("**/api/community-cases**", route => {
    if (route.request().method() === "POST") {
      writes.push(route.request().postDataJSON());
      return route.fulfill(submitFails ? { status: 503, json: { error: "Sentetik kayıt hatası." } } : { json: { id: "case-new", duplicate: false } });
    }
    const slug = new URL(route.request().url()).searchParams.get("community") ?? "";
    if (slug === "masa-b" && verifyFails) return route.fulfill({ status: 503, json: { error: "Geçici doğrulama hatası." } });
    return route.fulfill({ json: { cases: [], total: 0, page: 1, hasMore: false, context: slug && slug !== "missing" ? { slug, name: slug === "masa-a" ? "Masa A" : "Masa B", canAppealBan: false, reports: [] } : null } });
  });
  await page.goto("/community-cases?community=masa-a");
  const reason = page.getByRole("textbox", { name: "Başvuru açıklaması", exact: true });
  const target = page.getByRole("textbox", { name: "Topluluk kullanıcı adı", exact: true });
  await reason.fill("Masa A için korunması gereken açıklama.");
  await page.locator(".page-topbar-leading a").click();
  await expect(page.getByRole("dialog", { name: "Değişiklikler kaydedilmedi", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(reason).toHaveValue("Masa A için korunması gereken açıklama.");
  expect(await page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented;
  })).toBe(true);
  await target.fill("masa-b"); await page.getByRole("button", { name: "Topluluğu seç / listele", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(target).toHaveValue("masa-a"); await expect(reason).toHaveValue("Masa A için korunması gereken açıklama.");
  await target.fill("masa-b"); await page.getByRole("button", { name: "Topluluğu seç / listele", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yeni hedefe geç", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Geçici doğrulama hatası.");
  await page.getByRole("dialog").getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(reason).toHaveValue("Masa A için korunması gereken açıklama.");
  verifyFails = false;
  await target.fill("masa-b"); await page.getByRole("button", { name: "Topluluğu seç / listele", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yeni hedefe geç", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Masa B için başvur", exact: true })).toBeVisible();
  await expect(reason).toHaveValue("");
  await reason.fill("Yalnız Masa B hedefine ait yeni açıklama.");
  await page.getByRole("button", { name: "Platforma gönder", exact: true }).click();
  await expect(page.getByText("Sentetik kayıt hatası.", { exact: true })).toBeVisible();
  await expect(reason).toHaveValue("Yalnız Masa B hedefine ait yeni açıklama.");
  expect(writes).toEqual([{ communitySlug: "masa-b", kind: "community", sourceReportId: "", reason: "Yalnız Masa B hedefine ait yeni açıklama." }]);
  await target.fill("missing"); await page.getByRole("button", { name: "Topluluğu seç / listele", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Yeni hedefe geç", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Topluluk doğrulanamadı.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(target).toHaveValue("masa-b");
  await expect(reason).toHaveValue("Yalnız Masa B hedefine ait yeni açıklama.");
  submitFails = false;
  await page.getByRole("button", { name: "Platforma gönder", exact: true }).click();
  await expect(reason).toHaveValue("");
  await expect(page.getByText("Başvurun platform ekibine gönderildi.", { exact: true })).toBeVisible();
});

test("case subject changes validate eligibility and never carry the old reason to a different report", async ({ page }) => {
  let verifyStatus = 200, allowSecondReport = true, allowBan = true, writeMode = "failure";
  let delayVerification = false;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const writes: Record<string, unknown>[] = [];
  await page.addInitScript(() => localStorage.setItem("listekutusu-theme", "dark"));
  await page.route("**/api/community-cases**", async route => {
    if (route.request().method() === "POST") {
      writes.push(route.request().postDataJSON());
      return route.fulfill(writeMode === "failure" ? { status: 503, json: { error: "Kayıt denenemedi." } } : { json: { duplicate: writeMode === "duplicate" } });
    }
    if (delayVerification) await gate;
    if (verifyStatus !== 200) return route.fulfill({ status: verifyStatus, json: { error: "Doğrulama denenemedi." } });
    return route.fulfill({ json: { cases: [], total: 0, page: 1, hasMore: false, context: { slug: "subject-test", name: "Konu Testi", canAppealBan: allowBan, reports: [{ id: "report-a", targetType: "post", reviewedAt: null }, ...(allowSecondReport ? [{ id: "report-b", targetType: "comment", reviewedAt: null }] : [])] } } });
  });
  await page.goto("/community-cases?community=subject-test");
  const kind = page.getByRole("combobox", { name: "Başvuru türü", exact: true });
  const source = page.getByRole("combobox", { name: "İtiraz edeceğin incelenmiş şikâyet", exact: true });
  const reason = page.getByRole("textbox", { name: "Başvuru açıklaması", exact: true });
  const dialog = page.getByRole("dialog", { name: "Başvuru konusunu değiştir?", exact: true });
  await reason.fill("Topluluk konusuna ait açıklama.");
  await kind.selectOption("report_appeal");
  await dialog.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(kind).toHaveValue("community");
  await expect(reason).toHaveValue("Topluluk konusuna ait açıklama.");
  await kind.selectOption("report_appeal");
  verifyStatus = 503;
  await dialog.getByRole("button", { name: "Konuyu değiştir", exact: true }).click();
  await expect(dialog).toContainText("Doğrulama denenemedi.");
  await expect(reason).toHaveValue("Topluluk konusuna ait açıklama.");
  verifyStatus = 200;
  delayVerification = true;
  await dialog.getByRole("button", { name: "Konuyu değiştir", exact: true }).click();
  try {
    await expect(dialog).toHaveAttribute("aria-busy", "true");
    await expect(dialog.getByRole("button", { name: "Vazgeç", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
  } finally { delayVerification = false; release(); }
  await expect(source).toBeVisible();
  await expect(reason).toHaveValue("");
  await source.selectOption("report-a");
  await expect(source).toHaveValue("report-a");
  await reason.fill("Yalnız A şikâyetine ait açıklama.");
  await source.selectOption("report-b");
  await page.keyboard.press("Escape");
  await expect(source).toHaveValue("report-a");
  await expect(reason).toHaveValue("Yalnız A şikâyetine ait açıklama.");
  await source.selectOption("report-b");
  allowSecondReport = false;
  await dialog.getByRole("button", { name: "Konuyu değiştir", exact: true }).click();
  await expect(dialog).toContainText("Seçtiğin başvuru konusu artık kullanılamıyor.");
  await expect(source).toHaveValue("report-a");
  await expect(reason).toHaveValue("Yalnız A şikâyetine ait açıklama.");
  allowSecondReport = true;
  await dialog.getByRole("button", { name: "Konuyu değiştir", exact: true }).click();
  await expect(source).toHaveValue("report-b");
  await expect(reason).toHaveValue("");
  await reason.fill("Yalnız B şikâyetine ait açıklama.");
  await kind.selectOption("ban_appeal");
  allowBan = false;
  await dialog.getByRole("button", { name: "Konuyu değiştir", exact: true }).click();
  await expect(dialog).toContainText("Seçtiğin başvuru konusu artık kullanılamıyor.");
  await expect(kind).toHaveValue("report_appeal");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Platforma gönder", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Kayıt denenemedi.");
  await expect(reason).toHaveValue("Yalnız B şikâyetine ait açıklama.");
  writeMode = "duplicate";
  await page.getByRole("button", { name: "Platforma gönder", exact: true }).click();
  await expect(page.getByText(/Bu konuda daha önce açtığın başvuru zaten listende/)).toBeVisible();
  await expect(reason).toHaveValue("Yalnız B şikâyetine ait açıklama.");
  await expect(source).toHaveValue("report-b");
  writeMode = "success";
  await page.getByRole("button", { name: "Platforma gönder", exact: true }).click();
  await expect(reason).toHaveValue("");
  await expect(kind).toHaveValue("community");
  expect(writes).toEqual(Array(3).fill({ communitySlug: "subject-test", kind: "report_appeal", sourceReportId: "report-b", reason: "Yalnız B şikâyetine ait açıklama." }));
  expect(await page.evaluate(() => { const event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; })).toBe(false);
});

test("two community drafts share one exit prompt and remain intact after cancel", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  let writes = 0;
  await page.route("**/api/communities/guard-demo**", route => {
    if (route.request().method() !== "GET") { writes++; return route.fulfill({ status: 500, json: { error: "No writes in this test" } }); }
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/timeline")) return route.fulfill({ json: { items: [], nextCursor: null } });
    if (path.endsWith("/events")) return route.fulfill({ json: { events: [], page: 1, hasMore: false } });
    if (path !== "/api/communities/guard-demo") return route.fulfill({ status: 401, json: { error: "Sentetik sınır" } });
    return route.fulfill({ json: { community: { id: "guard-demo", slug: "guard-demo", name: "Taslak Denemesi", description: "Yalnız tarayıcı mock verisi", rules: "Sentetik", category: "interest", status: "active", memberCount: 2, university: null, city: null, interests: [] }, viewerId: "synthetic-viewer", membership: { status: "active", role: "member" }, canModerate: false, posts: [], page: 1, hasMore: false, members: [], reports: [] } });
  });
  await page.goto("/communities/guard-demo");
  await page.locator("summary").filter({ hasText: /^Sohbet veya inceleme paylaş$/ }).click();
  const post = page.getByRole("textbox", { name: "Paylaşım başlığı", exact: true });
  await post.fill("Korunacak sohbet taslağı");
  await page.getByRole("button", { name: "Etkinlikler", exact: true }).click();
  await page.locator("summary").filter({ hasText: /^Etkinlik oluştur$/ }).click();
  const event = page.getByRole("textbox", { name: "Etkinlik başlığı", exact: true });
  await expect(event).toBeEnabled(); await event.fill("Korunacak etkinlik taslağı");
  await page.locator(".page-topbar-leading a").click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape"); await expect(event).toHaveValue("Korunacak etkinlik taslağı");
  await event.fill("");
  await page.locator(".page-topbar-leading a").click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sohbetler", exact: true }).click();
  await expect(post).toHaveValue("Korunacak sohbet taslağı"); await post.fill("");
  await page.locator(".page-topbar-leading a").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(writes).toBe(0); expect(errors).toEqual([]);
});

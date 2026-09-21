import { expect, test, type Page } from "@playwright/test";

type PerformanceSnapshot = {
  cls: number;
  domNodes: number;
  horizontalOverflow: number;
  longTaskCount: number;
  longTaskDuration: number;
  navigationMs: number;
  resourceCount: number;
  transferBytes: number;
};

const routes = [
  ["ana-akis", "/"],
  ["forum", "/forum"],
  ["oyunlar", "/games"],
] as const;

async function installPerformanceObservers(page: Page) {
  await page.addInitScript(() => {
    const metrics = { cls: 0, longTasks: [] as number[] };
    Object.defineProperty(window, "__listeKutusuPerformance", {
      configurable: true,
      value: metrics,
    });

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            metrics.cls += (entry as PerformanceEntry & { value?: number }).value ?? 0;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // Older engines can omit layout-shift entries; the remaining budgets still apply.
    }

    try {
      new PerformanceObserver((list) => {
        metrics.longTasks.push(...list.getEntries().map((entry) => entry.duration));
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Long-task reporting is not available in every browser channel.
    }
  });
}

async function measure(page: Page, path: string): Promise<PerformanceSnapshot> {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => window.localStorage.setItem("listekutusu-theme", "dark"));

  // Warm the development/production route once so compilation is not counted as product work.
  await page.goto(path, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#main-content").waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);

  return page.evaluate(() => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const metrics = (window as Window & {
      __listeKutusuPerformance?: { cls: number; longTasks: number[] };
    }).__listeKutusuPerformance ?? { cls: 0, longTasks: [] };

    return {
      cls: metrics.cls,
      domNodes: document.getElementsByTagName("*").length,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      longTaskCount: metrics.longTasks.length,
      longTaskDuration: metrics.longTasks.reduce((total, duration) => total + duration, 0),
      navigationMs: navigation?.duration ?? 0,
      resourceCount: resources.length,
      transferBytes: resources.reduce((total, entry) => total + Math.max(0, entry.transferSize), 0),
    };
  });
}

test.describe("masaustu koyu tema performans butcesi", () => {
  test.beforeEach(async ({ page }) => installPerformanceObservers(page));

  for (const [name, path] of routes) {
    test(`${name}: akicilik ve yerlesim butcesi`, async ({ page }, testInfo) => {
      const snapshot = await measure(page, path);
      await testInfo.attach(`${name}-performance.json`, {
        body: Buffer.from(JSON.stringify(snapshot, null, 2)),
        contentType: "application/json",
      });

      expect(snapshot.horizontalOverflow, "Yatay tasma").toBeLessThanOrEqual(1);
      expect(snapshot.cls, "Kumulatif yerlesim kaymasi").toBeLessThan(0.1);
      expect(snapshot.domNodes, "DOM dugumu").toBeLessThan(2_500);
      expect(snapshot.resourceCount, "Kaynak istegi").toBeLessThan(160);
      expect(snapshot.transferBytes, "Aktarilan kaynak boyutu").toBeLessThan(8 * 1024 * 1024);
      expect(snapshot.longTaskCount, "Uzun ana is parcacigi gorevi").toBeLessThan(12);
      expect(snapshot.longTaskDuration, "Toplam uzun gorev suresi").toBeLessThan(1_200);
      expect(snapshot.navigationMs, "Isinmis sayfa gezinme suresi").toBeLessThan(4_000);
    });
  }
});


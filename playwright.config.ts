import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "msedge");

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results/browser",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 6_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.015,
      stylePath: "./tests/browser/screenshot.css",
    },
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL,
    ...(browserChannel ? { channel: browserChannel } : {}),
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    colorScheme: "dark",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "wide",
      use: { viewport: { width: 1728, height: 1050 } },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 900 } },
    },
    {
      name: "laptop",
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: "tablet",
      use: { viewport: { width: 768, height: 900 }, hasTouch: true },
    },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run start -- -H 127.0.0.1 -p 3000",
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

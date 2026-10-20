const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: /v3-(browser|expeditions)\.spec\.cjs/,
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["json", { outputFile: "tests/artifacts/v3-browser-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    actionTimeout: 15000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.V3_CHROMIUM_EXECUTABLE ||
            (process.env.CI ? undefined : "/usr/bin/chromium"),
          args: ["--no-sandbox"],
        },
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "ipad-portrait-chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.V3_CHROMIUM_EXECUTABLE ||
            (process.env.CI ? undefined : "/usr/bin/chromium"),
          args: ["--no-sandbox"],
        },
        viewport: { width: 820, height: 1180 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "ipad-landscape-chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.V3_CHROMIUM_EXECUTABLE ||
            (process.env.CI ? undefined : "/usr/bin/chromium"),
          args: ["--no-sandbox"],
        },
        viewport: { width: 1180, height: 820 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173/v3-adventure.html",
    reuseExistingServer: true,
  },
});

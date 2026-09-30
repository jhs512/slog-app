import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/rendering",
  fullyParallel: false,
  use: { baseURL: "http://localhost:3007", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/rendering/server.mjs",
      url: "http://127.0.0.1:8097",
      reuseExistingServer: false,
    },
    {
      command: "pnpm dev --webpack --port 3007",
      url: "http://localhost:3007",
      reuseExistingServer: false,
      timeout: 120_000,
      env: { NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8097" },
    },
  ],
});

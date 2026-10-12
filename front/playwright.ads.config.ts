import { defineConfig, devices } from "@playwright/test";

// 실제 광고 트래픽 없이 운영 빌드의 스크립트/슬롯과 문서 경계를 검증한다.
export default defineConfig({
  testDir: "./e2e/ads",
  workers: 1,
  use: { baseURL: "http://localhost:3007", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/rendering/server.mjs",
      url: "http://127.0.0.1:8097",
      reuseExistingServer: false,
    },
    {
      command: "pnpm start --port 3007",
      url: "http://localhost:3007",
      reuseExistingServer: false,
    },
  ],
});

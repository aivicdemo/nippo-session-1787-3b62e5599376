import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/itg-1-*.spec.ts",
  workers: 4,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "https://dev.dbs6zlsbgz3ox.amplifyapp.com" },
  reporter: "list",
});

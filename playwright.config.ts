import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "npx -y serve -l 5173 .",
    url: "http://localhost:5173/demo/index.html",
    reuseExistingServer: true,
    timeout: 60000,
  },
});

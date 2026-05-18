import { defineConfig } from "@playwright/test";

// Load environment variables from .env file
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

export default defineConfig({
  testDir: "tests",
  timeout: 120 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: !!process.env.CI,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});

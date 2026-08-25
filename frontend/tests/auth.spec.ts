import { test, expect } from "@playwright/test";
import { login } from "./helpers/test-utils";

test.describe("Authentication", () => {
  test("TC-AUTH-01 login renders calendar", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("link", { name: "Calendar" })).toBeVisible();
  });

  test("TC-AUTH-02 logout clears session", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder("Email")).toBeVisible();
  });
});

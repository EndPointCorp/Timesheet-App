import { test, expect } from "@playwright/test";
import { login } from "./helpers/test-utils";

test.describe("Calendar", () => {
  test("TC-CAL-01 navigate months", async ({ page }) => {
    await login(page);
    const monthSelect = page.locator("select").nth(1);
    const initial = await monthSelect.inputValue();
    await monthSelect.selectOption({ index: 1 });
    await expect(monthSelect).not.toHaveValue(initial);
    await monthSelect.selectOption(initial);
    await expect(monthSelect).toHaveValue(initial);
  });

  test("TC-CAL-02 click date navigates to entries", async ({ page }) => {
    await login(page);
    await page.locator('[role="grid"] >> text="15"').first().click();
    await expect(page).toHaveURL(/\/entries\/\d+\/\d+\/15/);
  });

  test("TC-CAL-03 sick vacation section visible", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Sick", { exact: true })).toBeVisible();
    await expect(page.getByText("Vacation", { exact: true })).toBeVisible();
    await expect(page.getByText("Holiday", { exact: true })).toBeVisible();
  });

  test("TC-CAL-04 bottom columns show monthly totals", async ({ page }) => {
    await login(page);
    await page.waitForSelector('[role="grid"]');
    await expect(page.locator("text=/\\d+\\.\\d{2}/").first()).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { login } from "./helpers/test-utils";

test.describe("New Entry Form", () => {
  test("TC-NEW-01 form elements visible", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "New Entry" }).click();

    await expect(page.getByPlaceholder("Type to search through work charts")).toBeVisible();
    await expect(page.getByRole("button", { name: "Quick pick" })).toBeVisible();
    await expect(page.getByPlaceholder("Description")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();
  });

  test("TC-NEW-02 time row controls visible", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "New Entry" }).click();

    await expect(page.getByTestId("time-row-delete-button-0")).toBeVisible();
    await expect(page.getByTestId("time-row-add-button")).toBeVisible();
    await expect(page.getByTestId("time-row-hours")).toBeVisible();
    await expect(page.getByTestId("time-row-minutes")).toBeVisible();
  });

  test("TC-NEW-03 cancel returns to previous page", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "New Entry" }).click();
    await expect(page).toHaveURL(/\/entries\/\d+\/\d+\/\d+\/new/);
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page).not.toHaveURL(/\/new$/);
  });

  test("TC-NEW-04 change date updates display", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "New Entry" }).click();

    await page.getByRole("button", { name: /Choose date/i }).click();
    await page.getByRole("gridcell", { name: "20" }).click();

    // Verify date picker closed and day 20 is selected (month-agnostic)
    await expect(page.getByRole("button", { name: /selected date is \w+ 20/i })).toBeVisible();
  });

  test("TC-NEW-05 save disabled without required fields", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "New Entry" }).click();

    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();

    await page.getByPlaceholder("Description").fill("E2E test entry");
    await expect(page.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

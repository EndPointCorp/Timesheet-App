import { test, expect } from "@playwright/test";
import { login, forceClickSwitch } from "./helpers/test-utils";

test.describe("Reports", () => {
  test("TC-REPORT-01 configure filters and toggles", async ({ page }) => {
    await login(page);
    await page.goto("/#/reports");

    const searchAllToggle = page.getByTestId("reports-search-all-toggle");
    await expect(searchAllToggle).not.toHaveClass(/Mui-checked/);
    await forceClickSwitch(searchAllToggle);
    await expect(searchAllToggle).toHaveClass(/Mui-checked/);

    const pdfToggle = page.getByTestId("reports-pdf-toggle");
    await expect(pdfToggle).not.toHaveClass(/Mui-checked/);
    await forceClickSwitch(pdfToggle);
    await expect(pdfToggle).toHaveClass(/Mui-checked/);

    const fullDescriptions = page.getByLabel("Display full descriptions");
    await fullDescriptions.check();
    await expect(fullDescriptions).toBeChecked();

    const openInNewWindow = page.getByLabel("Open in new window");
    await openInNewWindow.check();
    await expect(openInNewWindow).toBeChecked();

    const hoursInBank = page.getByLabel("Show hours in the bank");
    await hoursInBank.check();
    await expect(hoursInBank).toBeChecked();

    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page).toHaveURL(/\/reports/);
  });

  test("TC-REPORT-02 report type buttons visible", async ({ page }) => {
    await login(page);
    await page.goto("/#/reports");

    const reportTypes = ["Billing at leaf", "Billing", "By user", "Standard", "Break"];

    for (const type of reportTypes) {
      await expect(page.getByRole("button", { name: type, exact: true })).toBeVisible();
    }
  });

  test("TC-REPORT-03 preset dropdown available", async ({ page }) => {
    await login(page);
    await page.goto("/#/reports");

    const presetDropdown = page.locator("select").first();
    await expect(presetDropdown).toBeVisible();

    const options = await presetDropdown.locator("option").count();
    expect(options).toBeGreaterThan(0);
  });

  test("TC-REPORT-04 generate creates report output", async ({ page }) => {
    await login(page);
    await page.goto("/#/reports");

    await page.getByRole("button", { name: "Generate" }).click();

    await expect(page.getByText("Selection Parameters")).toBeVisible();
    await expect(page.getByText("Summary")).toBeVisible();
  });
});

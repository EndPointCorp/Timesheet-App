import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import { login, goToDate, TestDataManager } from "./helpers/test-utils";

test.describe("Entry Management", () => {
  const testData = new TestDataManager();

  test.afterEach(async () => {
    await testData.cleanup();
  });

  test("TC-ENTRY-01 edit entry opens form with data", async ({ page }) => {
    const testDate = dayjs().startOf("month").add(5, "day");
    await testData.seedEntries([{
      date: testDate.format("YYYY-MM-DD"),
      durationMinutes: 60,
      description: "Entry to edit",
    }]);

    await login(page);
    await goToDate(page, testDate);

    await page.getByTestId("entry-edit-button").first().click();

    await expect(page).toHaveURL(/\/entries\/\d+\/edit/);
    await expect(page.getByPlaceholder("Description")).toHaveValue("Entry to edit");
  });

  test("TC-ENTRY-02 delete entry removes it", async ({ page }) => {
    const testDate = dayjs().startOf("month").add(6, "day");
    const [entry] = await testData.seedEntries([{
      date: testDate.format("YYYY-MM-DD"),
      durationMinutes: 30,
      description: "Entry to delete",
    }]);

    await login(page);
    await goToDate(page, testDate);

    await expect(page.getByText("Entry to delete")).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByTestId("entry-delete-button").first().click();

    await expect(page.getByText("Entry to delete")).not.toBeVisible();

    // Already deleted via UI, skip cleanup
    testData.removeFromCleanup(entry.id);
  });
});

import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import { fetchDayTotals } from "./helpers/api";
import { login, formatHours, TestDataManager } from "./helpers/test-utils";

test.describe("Today Panel", () => {
  const testData = new TestDataManager();

  test.afterEach(async () => {
    await testData.cleanup();
  });

  test("TC-TODAY-01 navigate days updates totals", async ({ page }) => {
    const baseDate = dayjs().startOf("month").add(1, "day");
    const nextDate = baseDate.add(1, "day");

    await testData.seedEntries([
      {
        date: baseDate.format("YYYY-MM-DD"),
        durationMinutes: 120,
        description: "Automation base day",
      },
      {
        date: nextDate.format("YYYY-MM-DD"),
        durationMinutes: 30,
        description: "Automation next day",
      },
    ]);

    await login(page);
    await page.goto(
      `/#/entries/${baseDate.year()}/${baseDate.month() + 1}/${baseDate.date()}`,
    );

    const dayOneTotals = await fetchDayTotals(baseDate.format("YYYY-MM-DD"));

    await expect(page.getByTestId("today-total-billable")).toHaveText(
      formatHours(dayOneTotals.billable),
    );
    await expect(page.getByTestId("today-total-overall")).toHaveText(
      formatHours(dayOneTotals.total),
    );

    await page
      .getByTestId("today-day-select")
      .selectOption(nextDate.date().toString());

    const dayTwoTotals = await fetchDayTotals(nextDate.format("YYYY-MM-DD"));

    await expect(page.getByTestId("today-total-billable")).toHaveText(
      formatHours(dayTwoTotals.billable),
    );
    await expect(page.getByTestId("today-total-overall")).toHaveText(
      formatHours(dayTwoTotals.total),
    );
  });
});

import { Page, Locator, expect } from "@playwright/test";
import dayjs from "dayjs";
import {
  createWorkEntries,
  deleteWorkEntries,
  EntrySeedRequest,
  SeededEntry,
} from "./api";

// ============================================================================
// CONSTANTS
// ============================================================================

const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Copy .env.example to .env and set your test credentials.`
    );
  }
  return value;
};

export const TEST_EMAIL = getRequiredEnvVar("E2E_EMAIL");
export const TEST_PASSWORD = getRequiredEnvVar("E2E_PASSWORD");

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const login = async (page: Page) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(TEST_EMAIL);
  await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/?(calendar|$)/, { waitUntil: "networkidle" }).catch(() => {}),
    page.getByRole("button", { name: "Sign In" }).click(),
  ]);
  await expect(page.getByRole("link", { name: /Logout/i })).toBeVisible();
};

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

export const goToDate = async (page: Page, date: dayjs.Dayjs) => {
  await page.goto(`/#/entries/${date.year()}/${date.month() + 1}/${date.date()}`);
};

// ============================================================================
// UI HELPERS
// ============================================================================

export const formatHours = (minutes: number) => (minutes / 60).toFixed(2);

export const forceClickSwitch = async (toggle: Locator) => {
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click({ force: true });
};

// ============================================================================
// DATA SEEDING
// ============================================================================

export class TestDataManager {
  private seededEntryIds: number[] = [];

  async seedEntries(entries: EntrySeedRequest[]): Promise<SeededEntry[]> {
    const created = await createWorkEntries(entries);
    this.seededEntryIds.push(...created.map((entry) => entry.id));
    return created;
  }

  removeFromCleanup(id: number) {
    this.seededEntryIds = this.seededEntryIds.filter((entryId) => entryId !== id);
  }

  async cleanup() {
    if (this.seededEntryIds.length) {
      await deleteWorkEntries(this.seededEntryIds);
      this.seededEntryIds = [];
    }
  }
}

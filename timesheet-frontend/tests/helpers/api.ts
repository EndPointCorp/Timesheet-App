import { APIRequestContext, expect, request } from "@playwright/test";
import dayjs from "dayjs";
import qs from "qs";
import { TEST_EMAIL, TEST_PASSWORD } from "./test-utils";

const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3000/api/";
const ENV_WORK_CHART_ID = Number(process.env.E2E_WORK_CHART_ID || 0);

type EntrySeedInput = {
  date?: string;
  description?: string;
  durationMinutes?: number;
  workChartId?: number;
  kindCode?: string;
};

export type SeededEntry = {
  id: number;
  date: string;
  description: string;
};

export type DayTotals = {
  billable: number;
  nonbillable: number;
  pto: number;
  total: number;
};

const kindCache = new Map<number, string>();

const formatDate = (date?: string) => {
  if (date) return date;
  return dayjs().format("YYYY-MM-DD");
};

const buildDescription = (date: string, label?: string) =>
  label || `E2E entry ${date} ${Date.now()}`;

const formPayload = ({
  work_chart_id,
  description,
  date_performed,
  duration,
  kind_code,
}: {
  work_chart_id: number;
  description: string;
  date_performed: string;
  duration: number;
  kind_code: string;
}) => {
  return qs.stringify(
    {
      work_entry: {
        work_chart_id,
        description,
        date_performed,
        work_entry_fees_attributes: [{ fee: "0.00" }],
        work_entry_durations_attributes: [{ kind_code, duration }],
      },
    },
    { arrayFormat: "indices" },
  );
};

const createApiContext = async (): Promise<APIRequestContext> => {
  const apiContext = await request.newContext({
    baseURL: API_BASE_URL,
  });
  const loginResponse = await apiContext.post("users/sign_in.json", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    form: {
      "user[email]": TEST_EMAIL,
      "user[password]": TEST_PASSWORD,
      "user[remember_me]": "1",
    },
  });
  if (!loginResponse.ok()) {
    const body = await loginResponse.text();
    throw new Error(
      `Login failed (${loginResponse.status()}): ${body.substring(0, 200)}`,
    );
  }
  return apiContext;
};

let cachedWorkChartId: number | null = ENV_WORK_CHART_ID || null;

const resolveKindCode = async (
  api: APIRequestContext,
  workChartId: number,
) => {
  if (kindCache.has(workChartId)) {
    return kindCache.get(workChartId) as string;
  }
  const response = await api.get(`work_charts/${workChartId}/kinds.json`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const items: Array<{ code: string }> =
    Array.isArray(data) ? data : data?.data || data?.kinds || [];
  const code = items?.[0]?.code;
  if (!code) {
    throw new Error(
      `Unable to resolve kind code for work chart ${workChartId}`,
    );
  }
  kindCache.set(workChartId, code);
  return code;
};

const resolveDefaultWorkChartId = async (
  api: APIRequestContext,
): Promise<number> => {
  if (cachedWorkChartId) {
    return cachedWorkChartId;
  }
  const response = await api.get("work_charts/quicks.json");
  if (!response.ok()) {
    throw new Error("Unable to fetch quick picks for work charts");
  }
  const data = await response.json();
  const candidate =
    data?.clients?.[0]?.id ||
    data?.others?.[0]?.id ||
    data?.clients?.[0]?.work_chart_id ||
    data?.others?.[0]?.work_chart_id;
  if (!candidate) {
    throw new Error("No quick pick work chart id available");
  }
  cachedWorkChartId = Number(candidate);
  return cachedWorkChartId;
};

export const createWorkEntries = async (
  entries: EntrySeedInput[],
): Promise<SeededEntry[]> => {
  if (!entries.length) {
    return [];
  }
  const api = await createApiContext();
  try {
    const results: SeededEntry[] = [];
    for (const entry of entries) {
      const workChartId =
        entry.workChartId ?? (await resolveDefaultWorkChartId(api));
      const entryDate = formatDate(entry.date);
      const description = buildDescription(entryDate, entry.description);
      const minutes = entry.durationMinutes ?? 60;
      const kindCode =
        entry.kindCode || (await resolveKindCode(api, workChartId));
      const payload = formPayload({
        work_chart_id: workChartId,
        description,
        date_performed: entryDate.replace(/-/g, "/"),
        duration: minutes,
        kind_code: kindCode,
      });
      const response = await api.post("work_entries.json", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: payload,
      });
      if (!response.ok()) {
        const body = await response.text();
        throw new Error(
          `Failed to seed entry (${response.status()}): ${body.substring(
            0,
            200,
          )}`,
        );
      }
      const json = await response.json();
      const id = json?.id ?? json?.work_entry?.id;
      if (!id) {
        throw new Error("Failed to capture seeded entry ID");
      }
      results.push({
        id,
        date: entryDate,
        description,
      });
    }
    return results;
  } finally {
    await api.dispose();
  }
};

export const deleteWorkEntries = async (ids: number[]) => {
  if (!ids.length) return;
  const api = await createApiContext();
  try {
    await Promise.all(
      ids.map((id) =>
        api.delete(`work_entries/${id}.json`).then((response) => {
          expect(response.ok()).toBeTruthy();
        }),
      ),
    );
  } finally {
    await api.dispose();
  }
};

export type EntrySeedRequest = EntrySeedInput;

export const fetchDayTotals = async (date: string): Promise<DayTotals> => {
  const api = await createApiContext();
  try {
    const response = await api.get("work_entries/day.json", {
      params: { day: date },
    });
    if (!response.ok()) {
      throw new Error(`Failed to fetch entries for ${date}`);
    }
    const json = await response.json();
    const entries: any[] = Array.isArray(json) ? json : json?.entries || [];
    const reduceKey = (key: string) =>
      entries.reduce(
        (acc, entry) => acc + Number(entry?.[key] ?? 0),
        0,
      );
    return {
      billable: reduceKey("total_billable"),
      nonbillable: reduceKey("total_nonbillable"),
      pto: reduceKey("total_pto"),
      total: reduceKey("total_duration"),
    };
  } finally {
    await api.dispose();
  }
};

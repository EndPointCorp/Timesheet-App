import axios from "axios";
import { URL } from "../constants";
import qs from "qs";

// Update FeeAttribute to have a fee property
export type FeeAttribute = {
  fee: string | number;
};

export type WorkEntriesParams = {
  id?: number;
  work_chart_id: number;
  description: string;
  date_performed: string;
  work_entry_fees_attributes: Array<FeeAttribute>;
  work_entry_durations_attributes: Array<{
    kind_code: string;
    duration: number;
  }>;
};

export type EntriesParams = {
  day: string;
};

const editWorkEntries = async (params: WorkEntriesParams) => {
  try {
    const res = await axios({
      method: "PUT",
      url: `work_entries/${params.id}.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          work_entry: {
            ...params,
          },
        },
        {
          arrayFormat: "indices",
        },
      ),
      withCredentials: false,
    });

    return res;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.debug("🚀 ~ file: workEntries.ts ~ workEntries ~ error:", error);

      throw error?.response?.data;
    } else {
      // Throw the error if it's not an Axios error
      throw new Error("An unexpected error occurred");
    }
  }
};

const workEntries = async (params: WorkEntriesParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `work_entries.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          work_entry: {
            ...params,
          },
        },
        {
          arrayFormat: "indices",
        },
      ),
      withCredentials: false,
    });

    return res;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.debug(
        "🚀 ~ file: workEntries.ts:15 ~ workEntries ~ error:",
        error,
      );

      throw error?.response?.data;
    } else {
      // Throw the error if it's not an Axios error
      throw new Error("An unexpected error occurred");
    }
  }
};

const entries = async (params: EntriesParams) => {
  try {
    const res = await axios({
      method: "GET",
      url: `work_entries/day.json?day=${params.day}`,
      baseURL: URL,
      data: qs.stringify(
        {
          day: params.day,
        },
        {
          arrayFormat: "brackets",
        },
      ),
    });

    return res;
  } catch (error) {
    console.log("🚀 ~ file: workEntries.ts:15 ~ entries ~ error:", error);
  }
};

const deleteEntry = async (params: { id: number }) => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `work_entries/${params.id}.json`,
      baseURL: URL,
    });

    return res;
  } catch (error) {
    console.log("🚀 ~ file: workEntries.ts:15 ~ deleteEntry ~ error:", error);
  }
};

const getEntry = async (params: { id: number }) => {
  try {
    const res = await axios({
      method: "GET",
      url: `work_entries/${params.id}.json`,
      baseURL: URL,
    });

    return res;
  } catch (error) {
    console.log("🚀 ~ file: workEntries.ts:15 ~ entries ~ error:", error);
  }
};

const getHoursInTheBank = async (params: { id: number }) => {
  try {
    const res = await axios({
      method: "GET",
      url: `hours/${params.id}.json`,
      baseURL: URL,
    });

    return res;
  } catch (error) {
    console.log("🚀 ~ file: workEntries.ts:15 ~ entries ~ error:", error);
  }
};

export {
  workEntries,
  entries,
  deleteEntry,
  getEntry,
  getHoursInTheBank,
  editWorkEntries,
};

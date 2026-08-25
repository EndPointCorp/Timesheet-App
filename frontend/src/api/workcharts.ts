import axios from "axios";
import { URL } from "../constants";
import qs from "qs";

const getWorkCharts = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `work_charts.json?include_inactive=true&include_dead=true`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts:43 ~ getWorkCharts ~ error:", error);
  }
};

const getWorkChartsAbleToBeParents = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `work_charts/able_to_be_parents.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: workcharts.ts ~ getWorkChartsAbleToBeParents ~ error:",
      error,
    );
  }
};

const getQuicks = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `work_charts/quicks.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts:43 ~ getQuicks ~ error:", error);
  }
};

const getSearch = async (props: {
  term: string;
  includeHidden?: boolean;
  includeNonleafs?: boolean;
  includeDead?: boolean;
}) => {
  const { term, includeHidden, includeNonleafs = false, includeDead } = props;
  try {
    const res = await axios({
      method: "GET",
      url: `work_charts/search.json`,
      baseURL: URL,
      params: {
        include_nonleafs: includeNonleafs,
        include_hidden: includeHidden ? "true" : undefined,
        include_dead: includeDead ? "true" : undefined,
        term: term,
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts:43 ~ getSearch ~ error:", error);
  }
};

const getWorkChartKinds = async (porps: { id: number }) => {
  const { id } = porps;
  try {
    const res = await axios({
      method: "GET",
      url: `work_charts/${id}/kinds.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: workcharts.ts:43 ~ getWorkChartKinds ~ error:",
      error,
    );
  }
};

const getTransactions = async (porps: { id: number }) => {
  const { id } = porps;
  try {
    const res = await axios({
      method: "GET",
      url: `transactions.json?work_chart_id=${id}`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: workcharts.ts:43 ~ getTransactions ~ error:",
      error,
    );
  }
};

const getChildren = async (porps: { id: number }) => {
  const { id } = porps;
  try {
    const res = await axios({
      method: "GET",
      url: `work_charts/${id}/find_heirs.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts:43 ~ getChildren ~ error:", error);
  }
};

const clearKindsFor = async (id: number) => {
  try {
    const res = await axios({
      method: "PUT",
      url: `work_charts/${id}/clear_durations.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts ~ clearKindsFor ~ error:", error);
  }
};

export type SaveKindsParams = {
  id: number;
  work_chart_kinds: string[]; // codes
  work_chart_kinds_defaults: string; // default code
};

const saveKinds = async (params: SaveKindsParams) => {
  try {
    const res = await axios({
      method: "PUT",
      url: `work_charts/${params.id}/save_durations.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          work_chart_kinds: params.work_chart_kinds,
          work_chart_kinds_defaults: params.work_chart_kinds_defaults,
        },
        { arrayFormat: "indices" },
      ),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts ~ saveKinds ~ error:", error);
  }
};

export type UpdateWorkChartParams = {
  id: number;
  work_chart: {
    display_label?: string;
    status?: string;
    parent_id?: number | string | null;
    dont_send_empty_reports?: boolean;
  };
};

const updateWorkChart = async (params: UpdateWorkChartParams) => {
  try {
    const res = await axios({
      method: "PUT",
      url: `work_charts/${params.id}.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          work_chart: {
            ...params.work_chart,
          },
        },
        { arrayFormat: "brackets" },
      ),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts ~ updateWorkChart ~ error:", error);
  }
};

const deleteWorkChart = async (id: number) => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `work_charts/${id}.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts ~ deleteWorkChart ~ error:", error);
  }
};

export type AddChildParams = {
  parent_id: number | null;
  display_label: string | null;
  status: string | null;
};

const addChild = async (params: AddChildParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `work_charts.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          work_chart: {
            ...params,
          },
        },
        {
          arrayFormat: "brackets",
        },
      ),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts:43 ~ addChild ~ error:", error);
  }
};

export type CreateTransactionParams = {
  hours: number;
  work_chart_id: number;
  date: string;
  date_closed?: string;
  description: string;
  kind_code: string;
  mode: string;
  recut_at?: { day_of_month: number; hours: number; minutes: number };
};

const createTransaction = async (params: CreateTransactionParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `transactions/create_transaction.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          ...params,
        },
        {
          arrayFormat: "brackets",
        },
      ),
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: workcharts.ts:43 ~ createTransaction ~ error:",
      error,
    );
  }
};

export type UpdateTransactionParams = {
  id: number;
  hours: number;
  work_chart_id: number;
  date: string;
  date_closed?: string;
  description: string;
  // Update contract: mode carries billing kind, recur_mode carries recurrence
  mode: string; // 'billable' | 'nonbillable'
  recur_mode: string; // 'cumulative' | 'zero-out'
  recut_at?: { day_of_month: number; hours: number; minutes: number };
};

const updateTransaction = async (params: UpdateTransactionParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `transactions/update_transaction.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          ...params,
        },
        {
          arrayFormat: "brackets",
        },
      ),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: workcharts.ts ~ updateTransaction ~ error:", error);
  }
};

const deleteTransaction = async (params: { id: number }) => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `transactions/${params.id}.json`,
      baseURL: URL,
    });

    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: workEntries.ts:15 ~ deleteTransaction ~ error:",
      error,
    );
  }
};

export {
  getQuicks,
  getWorkCharts,
  getSearch,
  updateTransaction,
  getWorkChartKinds,
  getTransactions,
  getChildren,
  addChild,
  createTransaction,
  deleteTransaction,
  getWorkChartsAbleToBeParents,
  clearKindsFor,
  saveKinds,
  updateWorkChart,
  deleteWorkChart,
};

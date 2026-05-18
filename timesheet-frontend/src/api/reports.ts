import axios from "axios";
import { URL } from "../constants";
import { ReportProps } from "../types";
import { CreatePresetParams } from "../types/reports";
import qs from "qs";

const getReport = async (props: ReportProps, isPdf: boolean) => {
  const {
    report_type,
    start_date,
    end_date,
    roles = [], // Default to an empty array if roles is undefined
    fragmentation,
    show_hours_in_the_bank,
    description,
    work_chart_id,
  } = props;

  try {
    // Base URL for the request
    const baseUrl = `reports/${report_type}`;

    // Manually construct the URL with query parameters
    let url = `${baseUrl}?start_date=${start_date}&end_date=${end_date}&work_chart_id=${work_chart_id}&option=from_selected&description=${description}&access=true&fragmentation=${fragmentation}&show_hours_in_the_bank=${show_hours_in_the_bank}`;

    // Always add roles[] parameter, even if it's an empty array
    roles.forEach((role) => {
      url += `&roles[]=${encodeURIComponent(role)}`;
    });

    // If roles is empty, ensure the parameter is still included
    if (roles.length === 0) {
      url += `&roles[]=`;
    }

    const res = await axios({
      method: "GET",
      url,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      responseType: isPdf ? "blob" : "text",
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: teams.ts:35 ~ getTotals ~ error:", error);
  }
};

const getPresets = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `reports/presets.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: teams.ts:35 ~ getPresets ~ error:", error);
  }
};

const createPreset = async (params: CreatePresetParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `reports/create_preset`,
      baseURL: URL,
      data: qs.stringify(
        { ...params },
        {
          arrayFormat: "indices",
        },
      ),
      withCredentials: true,
    });

    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:15 ~ create preset  ~ error:", error);
  }
};

const deletePreset = async (params: { id: number }) => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `/reports/remove_preset/${params.id}`,
      baseURL: URL,
    });

    return res;
  } catch (error) {
    console.log("🚀 ~ file: reports.ts:15 ~ deletPreset ~ error:", error);
  }
};

export { getReport, getPresets, createPreset, deletePreset };

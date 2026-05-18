import axios from "axios";
import { URL } from "../constants";
import { Dayjs } from "dayjs";

const getTeams = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `team/teams.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: teams.ts:15 ~ getTeams ~ error:", error);
  }
};

const getTotals = async (week: Dayjs) => {
  try {
    const res = await axios({
      method: "GET",
      url: `team/totals.json?from=${week.day(0).format("YYYY-MM-DD")}&to=${week
        .day(6)
        .format("YYYY-MM-DD")}&team=whole_company`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: teams.ts:35 ~ getTotals ~ error:", error);
  }
};

export { getTeams, getTotals };

import axios from "axios";
import { URL } from "../constants";
import dayjs from "dayjs";

const getCalendar = async (props: {
  year: number;
  month: number;
  username?: string;
}) => {
  const { year, month, username } = props;
  const url = username
    ? `work_days/calendar/${year}/${month}/${username}.json`
    : `work_days/calendar/${year}/${month}.json`;

  try {
    const res = await axios({
      method: "GET",
      url,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: teams.ts:35 ~ getCalendar ~ error:", error);
  }
};

const getRows = async (props: {
  year: number;
  month: number;
  username?: string;
}) => {
  const { year, month, username } = props;
  const start = dayjs(`${year}-${month}-01`)
    .subtract(5, "month")
    .format("YYYY-MM-01");
  const end = dayjs(`${year}-${month}-01`).format("YYYY-MM-01");
  const url = username
    ? `work_months/${start}/${end}/${username}.json`
    : `work_months/${start}/${end}.json`;

  try {
    const res = await axios({
      method: "GET",
      url,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: teams.ts:35 ~ getRows ~ error:", error);
  }
};

const getPto = async (props: { username?: string } = {}) => {
  const { username } = props;
  const url = username ? `ptos/${username}.json` : `ptos`;
  try {
    const res = await axios({
      method: "GET",
      url,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: calendar.ts:35 ~ getPto ~ error:", error);
  }
};

const getHoursSummary = async (props: { username?: string } = {}) => {
  const { username } = props;
  const url = username
    ? `hours/summary/${username}.json`
    : `hours/summary.json`;
  // Add a log to see the URL being called:
  console.log("Fetching hours summary from:", url);
  try {
    const res = await axios({
      method: "GET",
      url,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: calendar.ts ~ getHoursSummary ~ error:", error);
  }
};

export { getCalendar, getRows, getPto, getHoursSummary };

import axios from "axios";
import { URL } from "../constants";

export interface DurationKind {
  code: string;
  display_label: string;
  abbr_label: string;
  status: number;
  production_category_id: number;
}

export const getDurationKinds = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `duration_kinds.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("durationKinds.getDurationKinds error:", error);
  }
};

export default getDurationKinds;

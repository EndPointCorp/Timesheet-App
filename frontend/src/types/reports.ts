import { Dayjs } from "dayjs";

export interface ReportProps {
  report_type: string;
  start_date: string;
  end_date: string;
  roles: Array<string>;
  fragmentation: string;
  show_hours_in_the_bank: boolean;
  description: boolean;
  work_chart_id: number;
}

export interface CreatePresetParams {
  report_type: string;
  start_date: string;
  end_date: string;
  work_chart_id: number;
  roles: Array<string>;
  description: boolean;
  show_all_roles: boolean;
  fragmentation: string;
  dates_relative: boolean;
  dates_period_type: boolean;
  name: string;
}

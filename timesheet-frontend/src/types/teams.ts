export interface Team {
  display_label: string;
  manager_code?: string;
  role_id?: number;
  code?: string;
  users: object;
}

export interface Total {
  code: string;
  date_performed: string;
  team_code: string;
  team_display_label: string;
  durations: Hours;
}

export interface Hours {
  billable: number;
  nonbillable: number;
  pto: number;
  total: number;
}

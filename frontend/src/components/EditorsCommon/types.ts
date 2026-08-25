export interface Groups {
  id: number;
  code: string;
  label: string;
  role_ids: Array<number>;
  direct_role_ids: Array<number>;
  direct_rights: Array<Right>;
  indirect_rights: Array<Right>;
}

export interface Target {
  id: number;
  label: string;
  ref_obj_pk: number;
}

export interface Right {
  label: string;
  is_direct: boolean;
  id: number;
  code: string;
  target_kind_code: string | null;
  targets: Array<Target>;
}

export interface RightType {
  id: number;
  code: string;
  target_kind_code:
    | "site_mgmt_action"
    | "user"
    | "role"
    | "work_chart"
    | "account"
    | null;
  label: string;
  value: string;
}

export interface RolesEditorTeam {
  role_id: number;
  display_label: string;
  code: string;
  manager_code: string;
  users: Object;
}

export interface RolesEditorGroup {
  code: string;
  id: number;
  label: string;
  value: string;
}

export interface RolesEditorUser {
  name: string;
  id: number;
  status_code: string;
  email: string;
  team_ids: Array<number>;
  role_ids: Array<number>;
  time_zone: string;
  myrights: Array<Right>;
  direct_role_ids: Array<number>;
}

export function isGroup(
  listItem: RolesEditorGroup | RolesEditorTeam | Groups,
): listItem is RolesEditorGroup {
  return (listItem as RolesEditorGroup).label !== undefined;
}

interface User {
  email: string;
  can_switch_roles: boolean;
  code: string;
  id: number;
  is_admin: boolean;
  user: object;
  can_create_users: boolean;
  can_edit_charts: boolean;
  is_manager: boolean;
  is_director: boolean;
  is_new_features_tester: boolean;
  as?: string;
}

export default User;

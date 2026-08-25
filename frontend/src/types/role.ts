type Role = {
  id: number;
  code: string;
  label: string;
  role_ids: number[];
  direct_role_ids: number[];
  direct_rights: any[];
  indirect_rights: any[];
};

export default Role;

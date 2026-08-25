import axios from "axios";
import { URL } from "../constants";
import qs from "qs";

const getGroupsWithRoles = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `groups/groups_with_roles.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: rolesEditor.ts:35 ~ getGroupsWithRoles ~ error:",
      error,
    );
  }
};

const getRightTypes = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `right_types.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: rolesEditor.ts:35 ~ getRightTypes ~ error:", error);
  }
};

const getGroupsNoTeams = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `groups/groups_no_teams.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: rolesEditor.ts:35 ~ getGroupsNoTeams ~ error:",
      error,
    );
  }
};

const getGroupsDetails = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `groups/details.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log(
      "🚀 ~ file: rolesEditor.ts:35 ~ getGroupsDetails ~ error:",
      error,
    );
  }
};

const getTimeZones = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `time_zones.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: rolesEditor.ts:35 ~ getTimZones ~ error:", error);
  }
};

const getRoles = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `roles.json`,
      baseURL: URL,
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: rolesEditor.ts:35 ~ getRoles ~ error:", error);
  }
};

interface ChangeObjectItem {
  id: number;
  status: "remove" | "add" | "update";
  targets?: Array<ChangeObjectItem>;
}
export interface SaveChangesParams {
  userId: number;
  changes: {
    isChanged: boolean;
    status?: boolean;
    myrights?: Array<ChangeObjectItem>;
    myroles?: Array<ChangeObjectItem>;
    myteam?: Array<ChangeObjectItem>;
    time_zone?: string;
    name?: string;
    email?: string;
    password?: string;
  };
}
const saveChanges = async (params: SaveChangesParams) => {
  const { userId, changes } = params;
  try {
    const res = await axios({
      method: "PUT",
      url: `users/${userId}`,
      baseURL: URL,
      data: { user_entity: JSON.stringify(changes), user_id: userId },
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: rolesEditor.ts:35 ~ saveChanges ~ error:", error);
  }
};

interface ChangeRoleObjectItem {
  id: number;
  status: "remove" | "add" | "update";
}

export interface SaveGroupChangesParams {
  group_id: number;
  changes: {
    isChanged: boolean;
    label?: string;
    myrights?: Array<ChangeObjectItem>;
    myroles?: Array<ChangeRoleObjectItem>;
  };
}

const saveGroupChanges = async (params: SaveGroupChangesParams) => {
  const { group_id, changes } = params;
  try {
    const res = await axios({
      method: "PUT",
      url: `groups/${group_id}`,
      baseURL: URL,
      data: { group_entity: JSON.stringify(changes), group_id },
      withCredentials: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: rolesEditor.ts ~ saveGroupChanges ~ error:", error);
  }
};

export type CreateGroupParams = {
  label: string;
  code: string;
  description: string;
};

const createGroup = async (params: CreateGroupParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `groups.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          ...params,
        },
        {
          arrayFormat: "indices",
        },
      ),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: rolesEditor.ts:43 ~ createGroup ~ error:", error);
  }
};

export {
  getGroupsWithRoles,
  getRightTypes,
  getGroupsNoTeams,
  getTimeZones,
  getRoles,
  saveChanges,
  createGroup,
  getGroupsDetails,
  saveGroupChanges,
};

import { useMutation, useQuery } from "react-query";
import { rolesEditor as api } from "../api";
import { useUserStore } from "../stores";
import { QueryKeys } from "../types";
import { CreateGroupParams } from "../api/rolesEditor";
import useLoadingStore from "../stores/useLoadingStore";

const useGroupsNoTeams = () => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();
  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      const data = await api.getGroupsNoTeams();
      setIsLoading(false);
      return data?.data;
    },
    queryKey: [QueryKeys.GroupsNoTeams],
    retry: false,
    enabled: !!user,
  });
};

const useGroupsWithRoles = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getGroupsWithRoles();
      return data?.data;
    },
    queryKey: [QueryKeys.GroupsWithRoles],
    retry: false,
    enabled: !!user,
  });
};

const useGroupsDetails = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getGroupsDetails();
      return data?.data;
    },
    queryKey: [QueryKeys.GroupsDetails],
    retry: false,
    enabled: !!user,
  });
};

const useRightTypes = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getRightTypes();
      return data?.data;
    },
    queryKey: [QueryKeys.RightTypes],
    retry: false,
    enabled: !!user,
  });
};

const useRoles = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getRoles();
      return data?.data;
    },
    queryKey: [QueryKeys.Roles],
    retry: false,
    enabled: !!user,
  });
};

const useTimeZones = () => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();
  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      const data = await api.getTimeZones();
      setIsLoading(false);
      return data?.data;
    },
    queryKey: [QueryKeys.TimeZones],
    retry: false,
    enabled: !!user,
  });
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
const useSaveChanges = () =>
  useMutation((params: SaveChangesParams) => api.saveChanges(params), {});

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
const useSaveGroupChanges = () =>
  useMutation(
    (params: SaveGroupChangesParams) => api.saveGroupChanges(params),
    {},
  );

const useCreateGroup = () =>
  useMutation((params: CreateGroupParams) => api.createGroup(params), {});

export default {
  useGroupsNoTeams,
  useGroupsWithRoles,
  useRightTypes,
  useRoles,
  useTimeZones,
  useSaveChanges,
  useCreateGroup,
  useGroupsDetails,
  useSaveGroupChanges,
};

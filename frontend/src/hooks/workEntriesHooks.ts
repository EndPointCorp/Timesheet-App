import { useMutation, useQuery, useQueryClient } from "react-query";
import { workEntries as api } from "../api";
import { EntriesParams, WorkEntriesParams } from "../api/workEntries";
import { useUserStore } from "../stores";
import { QueryKeys } from "../types";

const useWorkEntries = () => {
  const queryClient = useQueryClient();
  return useMutation((params: WorkEntriesParams) => api.workEntries(params), {
    onSuccess: () => {
      // Invalidate entries list to refresh the entries view
      queryClient.invalidateQueries([QueryKeys.Search]);
      // Invalidate hours summary to refresh "hours in the bank" on dashboard
      queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
    },
  });
};

const useEditWorkEntries = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (params: WorkEntriesParams) => api.editWorkEntries(params),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific entry cache
        if (variables.id) {
          queryClient.invalidateQueries([
            QueryKeys.Delete,
            { id: variables.id },
          ]);
        }
        // Also invalidate entries list to refresh the entries view
        queryClient.invalidateQueries([QueryKeys.Search]);
        // Invalidate hours summary to refresh "hours in the bank" on dashboard
        queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
      },
    },
  );
};

const useGetEntries = (props: EntriesParams) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.entries(props);
      return data?.data;
    },
    queryKey: [QueryKeys.Search, { ...props, userId: user?.id }],
    retry: false,
    enabled: !!user,
  });
};

const useDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation((params: { id: number }) => api.deleteEntry(params), {
    onSuccess: () => {
      // Invalidate entries list to refresh the entries view
      queryClient.invalidateQueries([QueryKeys.Search]);
      // Invalidate hours summary to refresh "hours in the bank" on dashboard
      queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
    },
  });
};

const useGetEntry = (props: { id: number }) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getEntry(props);
      return data?.data;
    },
    // Include user id to force refetch on role switch
    queryKey: [QueryKeys.Delete, { ...props, userId: user?.id }],
    retry: false,
    enabled: !!user,
  });
};

const useGetHoursInTheBank = (props: { id: number }) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getHoursInTheBank(props);
      return data?.data;
    },
    queryKey: [QueryKeys.HoursInTheBank, props],
    retry: false,
    enabled: !!user,
  });
};

const useUpdateEntry = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (params: { id: number } & WorkEntriesParams) => api.editWorkEntries(params),
    {
      onSuccess: (data, variables) => {
        // Invalidate specific entry cache
        if (variables.id) {
          queryClient.invalidateQueries([
            QueryKeys.Delete,
            { id: variables.id },
          ]);
        }
        // Also invalidate entries list to refresh the entries view
        queryClient.invalidateQueries([QueryKeys.Search]);
        // Invalidate hours summary to refresh "hours in the bank" on dashboard
        queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
      },
    },
  );
};

const workEntriesHooks = {
  useWorkEntries,
  useEditWorkEntries,
  useGetEntries,
  useDeleteEntry,
  useGetEntry,
  useGetHoursInTheBank,
  useUpdateEntry,
};

export default workEntriesHooks;

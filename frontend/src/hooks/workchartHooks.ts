import { useMutation, useQuery, useQueryClient } from "react-query";
import { workcharts as api } from "../api";
import { useUserStore } from "../stores";
import { QueryKeys, WorkChartKind } from "../types";
import {
  AddChildParams,
  CreateTransactionParams,
  UpdateTransactionParams,
  SaveKindsParams,
} from "../api/workcharts";
import useLoadingStore from "../stores/useLoadingStore";

const useGetWorkCharts = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getWorkCharts();
      return data?.data;
    },
    queryKey: [QueryKeys.WorkCharts],
    retry: false,
    enabled: !!user,
    keepPreviousData: true,
  });
};

const useGetWorkChartsAbleToBeParents = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getWorkChartsAbleToBeParents();
      return data?.data;
    },
    queryKey: [QueryKeys.WorkChartsAbleToBeParents],
    retry: false,
    enabled: !!user,
  });
};

const useGetQuicks = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getQuicks();
      return data?.data;
    },
    queryKey: [QueryKeys.Quicks],
    retry: false,
    enabled: !!user,
  });
};

const useGetSearch = (props: {
  term: string;
  includeHidden?: boolean;
  includeNonleafs?: boolean;
  includeDead?: boolean;
}) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getSearch({ includeNonleafs: false, ...props });
      return data?.data;
    },
    queryKey: [QueryKeys.Search, props],
    retry: false,
    enabled: !!user && props.term.length > 2,
  });
};

const useGetWorkChartKinds = (props: { id: number }) => {
  const { user } = useUserStore();
  return useQuery<WorkChartKind[]>({
    queryFn: async () => {
      const data = await api.getWorkChartKinds(props);
      return (data?.data as WorkChartKind[] | undefined) ?? [];
    },
    queryKey: [QueryKeys.Kinds, props],
    retry: false,
    enabled: !!user && props.id !== 2,
  });
};

const useClearKinds = () => {
  const queryClient = useQueryClient();
  return useMutation((id: number) => api.clearKindsFor(id), {
    onSuccess: (_data, id) => {
      // Refresh kinds for the specific chart
      queryClient.invalidateQueries([QueryKeys.Kinds, { id }]);
    },
  });
};

const useSaveKinds = () => {
  const queryClient = useQueryClient();
  return useMutation((params: SaveKindsParams) => api.saveKinds(params), {
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries([QueryKeys.Kinds, { id: params.id }]);
    },
  });
};

const useGetTransactions = (props: { id: number }) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getTransactions(props);
      return data?.data;
    },
    queryKey: [QueryKeys.Transactions, props],
    retry: false,
    enabled: !!user && props.id !== 2,
  });
};

const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (params: { id: number }) => api.deleteTransaction(params),
    {
      onSuccess: () => {
        // Invalidate transactions list
        queryClient.invalidateQueries([QueryKeys.Transactions]);
        // Invalidate hours summary to refresh "hours in the bank" on dashboard
        queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
      },
    },
  );
};

const useGetChildren = (props: { id: number }) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getChildren(props);
      return data?.data;
    },
    queryKey: [QueryKeys.Children, props],
    retry: false,
    enabled: !!user && props.id !== 2,
  });
};

const useAddChild = () => {
  const queryClient = useQueryClient();
  return useMutation((params: AddChildParams) => api.addChild(params), {
    onSuccess: (res, params) => {
      const created = (res as any)?.data?.chart;
      if (created) {
        // Optimistically merge the new child into the cached work charts list
        queryClient.setQueryData([QueryKeys.WorkCharts], (old: any) => {
          if (!Array.isArray(old)) return old;
          if (old.some((c) => c?.id === created.id)) return old;
          return [...old, created];
        });
      }
      // Ensure all dependent views refresh
      queryClient.invalidateQueries([QueryKeys.WorkCharts]);
      queryClient.invalidateQueries([QueryKeys.WorkChartsAbleToBeParents]);
      queryClient.invalidateQueries([QueryKeys.Quicks]);
      queryClient.invalidateQueries([QueryKeys.Search]);
      if ((params as any)?.parent_id) {
        queryClient.invalidateQueries([
          QueryKeys.Children,
          { id: (params as any).parent_id },
        ]);
      }
    },
  });
};

const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (params: CreateTransactionParams) => api.createTransaction(params),
    {
      onSuccess: () => {
        // Invalidate transactions list
        queryClient.invalidateQueries([QueryKeys.Transactions]);
        // Invalidate hours summary to refresh "hours in the bank" on dashboard
        queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
      },
    },
  );
};

const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (params: UpdateTransactionParams) => api.updateTransaction(params),
    {
      onSuccess: () => {
        // Invalidate transactions list
        queryClient.invalidateQueries([QueryKeys.Transactions]);
        // Invalidate hours summary to refresh "hours in the bank" on dashboard
        queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
      },
    },
  );
};

const useUpdateWorkChart = () => {
  const queryClient = useQueryClient();
  return useMutation(
    async (incomingParams: any) => {
      // Enrich payload with current values if any required fields are missing
      const { id, work_chart } = incomingParams || {};
      const cachedCharts = queryClient.getQueryData([QueryKeys.WorkCharts]) as
        | any[]
        | undefined;
      const cached = Array.isArray(cachedCharts)
        ? cachedCharts.find((c) => c?.id === id)
        : undefined;

      const enrichedWorkChart: any = {
        ...work_chart,
        display_label: work_chart?.display_label ?? cached?.display_label,
        status: work_chart?.status ?? cached?.status,
        parent_id: work_chart?.parent_id ?? cached?.parent_id,
        dont_send_empty_reports:
          work_chart?.dont_send_empty_reports ??
          cached?.dont_send_empty_reports,
      };

      if (typeof enrichedWorkChart.parent_id === "string") {
        enrichedWorkChart.parent_id = parseInt(enrichedWorkChart.parent_id, 10);
      }

      return api.updateWorkChart({ id, work_chart: enrichedWorkChart } as any);
    },
    {
      onSuccess: (res, params: any) => {
        const updated = (res as any)?.data?.chart;
        if (updated) {
          // Optimistically update the work chart in the cached list
          queryClient.setQueryData([QueryKeys.WorkCharts], (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((c) => (c?.id === updated.id ? updated : c));
          });
        }
        // Invalidate work charts and related queries
        queryClient.invalidateQueries([QueryKeys.WorkCharts]);
        queryClient.invalidateQueries([QueryKeys.WorkChartsAbleToBeParents]);
        queryClient.invalidateQueries([QueryKeys.Quicks]);
        if (params?.id) {
          queryClient.invalidateQueries([QueryKeys.Kinds, { id: params.id }]);
          queryClient.invalidateQueries([
            QueryKeys.Children,
            { id: params.id },
          ]);
        }
      },
    },
  );
};

const useDeleteWorkChart = () => {
  const queryClient = useQueryClient();
  return useMutation((id: number) => api.deleteWorkChart(id), {
    onSuccess: (_data, id) => {
      // Optimistically remove the work chart from the cached list
      queryClient.setQueryData([QueryKeys.WorkCharts], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((c) => c?.id !== id);
      });
      queryClient.invalidateQueries([QueryKeys.WorkCharts]);
      queryClient.invalidateQueries([QueryKeys.WorkChartsAbleToBeParents]);
      queryClient.invalidateQueries([QueryKeys.Quicks]);
      queryClient.invalidateQueries([QueryKeys.Kinds, { id }]);
      queryClient.invalidateQueries([QueryKeys.Children, { id }]);
    },
  });
};

const workchartHooks = {
  useGetQuicks,
  useGetWorkCharts,
  useGetSearch,
  useGetWorkChartKinds,
  useGetChildren,
  useGetTransactions,
  useClearKinds,
  useSaveKinds,
  useAddChild,
  useCreateTransaction,
  useDeleteTransaction,
  useGetWorkChartsAbleToBeParents,
  useUpdateTransaction,
  useUpdateWorkChart,
  useDeleteWorkChart,
};

export default workchartHooks;

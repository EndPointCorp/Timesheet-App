import { useMutation, useQuery } from "react-query";
import { reports as api } from "../api";
import { QueryKeys, ReportProps } from "../types";
import { useUserStore } from "../stores";
import { CreatePresetParams } from "../types/reports";
import useLoadingStore from "../stores/useLoadingStore";

const useReport = (props: ReportProps, enabled: boolean, isPdf: boolean) => {
  const { setIsLoading } = useLoadingStore();

  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      try {
        const data = await api.getReport(props, isPdf);
        setIsLoading(false);
        if (data !== undefined) return { __html: data?.data };
        return data;
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    queryKey: [QueryKeys.Report, props],
    retry: false,
    enabled: enabled,
    staleTime: 0,
    cacheTime: 0,
  });
};

const usePresets = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getPresets();
      if (data === undefined) return [{ name: "" }];
      const sorted = [...data.data].sort((a: any, b: any) =>
        ((a?.name ?? "") as string).localeCompare(
          (b?.name ?? "") as string,
          undefined,
          { sensitivity: "base" },
        ),
      );
      sorted.unshift({ name: "" });
      return sorted;
    },
    queryKey: [QueryKeys.Presets],
    retry: false,
    enabled: !!user,
  });
};

const useCreatePreset = () =>
  useMutation((params: CreatePresetParams) => api.createPreset(params), {});

const useDeletPreset = () =>
  useMutation((params: { id: number }) => api.deletePreset(params), {});

export default { useReport, usePresets, useCreatePreset, useDeletPreset };

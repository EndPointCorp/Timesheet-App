import { useQuery } from "react-query";
import { calendar as api } from "../api";
import { QueryKeys } from "../types";
import { useUserStore } from "../stores";
import useLoadingStore from "../stores/useLoadingStore";

const useCalendar = (props: {
  year: number;
  month: number;
  username?: string;
}) => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();

  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      const data = await api.getCalendar(props);
      setIsLoading(false);

      return data?.data;
    },
    queryKey: [QueryKeys.Calendar, props],
    retry: false,
    enabled: !!user,
  });
};

const useRows = (props: { year: number; month: number; username?: string }) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getRows(props);
      return data?.data;
    },
    queryKey: [QueryKeys.Rows, props],
    retry: false,
    enabled: !!user,
  });
};

const usePto = (props: { username?: string } = {}) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getPto(props);
      return data?.data;
    },
    queryKey: [QueryKeys.Pto, props],
    retry: false,
    enabled: !!user,
  });
};

const useGetHoursSummary = (props: { username?: string } = {}) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getHoursSummary(props);
      return data?.data;
    },
    queryKey: [QueryKeys.getHoursSummary, props],
    retry: false,
    enabled: !!user,
  });
};

export default { useCalendar, useRows, usePto, useGetHoursSummary };

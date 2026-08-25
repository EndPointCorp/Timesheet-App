import { useQuery } from "react-query";
import { durationKinds as api } from "../api";
import { useUserStore } from "../stores";
import useLoadingStore from "../stores/useLoadingStore";
import { QueryKeys } from "../types";
import type { DurationKind } from "../api/durationKinds";

const useGetDurationKinds = () => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();

  return useQuery<DurationKind[]>({
    queryFn: async () => {
      setIsLoading(true);
      const res = await api.getDurationKinds();
      setIsLoading(false);
      return (res?.data as DurationKind[] | undefined) ?? [];
    },
    queryKey: [QueryKeys.DurationKinds],
    retry: false,
    enabled: !!user,
  });
};

const durationKindsHooks = { useGetDurationKinds };
export default durationKindsHooks;

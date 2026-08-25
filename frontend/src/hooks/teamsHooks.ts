import { useQuery } from "react-query";
import { teams as api } from "../api";
import { Hours, QueryKeys, Team, Total } from "../types";
import { Dayjs } from "dayjs";
import { useUserStore } from "../stores";
import useLoadingStore from "../stores/useLoadingStore";

const useTeams = () => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();
  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      const data = await api.getTeams();
      setIsLoading(false);
      if (data === undefined) return [];
      return data.data
        .filter((team: any) => {
          if (Object.keys(team.users).length > 0) {
            return team;
          }
        })
        .sort((a: Team, b: Team) => {
          return a.display_label < b.display_label ? -1 : 1;
        });
    },
    queryKey: [QueryKeys.Teams],
    retry: false,
    enabled: !!user,
  });
};

const useTotals = (week: Dayjs) => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getTotals(week);
      if (data === undefined) return [];
      const totals = data.data.sort((a: Total, b: Total) => {
        if (a.team_display_label == b.team_display_label) {
          if (a.code == b.code) {
            return a.date_performed < b.date_performed ? -1 : 1;
          }
          return a.code < b.code ? -1 : 1;
        }
        return a.team_display_label < b.team_display_label ? -1 : 1;
      });
      const res: {
        [key: string]: Hours;
      } = {};
      for (let i = 0; i < totals.length; i++) {
        const total: Total = totals[i];
        const hours: Hours = { ...total.durations };
        if (hours.billable === undefined) hours.billable = 0;
        if (hours.nonbillable === undefined) hours.nonbillable = 0;
        if (hours.pto === undefined) hours.pto = 0;
        const key = `${total.team_display_label}-${total.code}-${total.date_performed}`;
        res[key] = {
          billable: hours.billable / 60,
          nonbillable: hours.nonbillable / 60,
          pto: hours.pto / 60,
          total: (hours.billable + hours.nonbillable + hours.pto) / 60,
        };
      }
      return res;
    },
    queryKey: [QueryKeys.Totals, week],
    retry: false,
    enabled: !!user,
  });
};
export default { useTeams, useTotals };

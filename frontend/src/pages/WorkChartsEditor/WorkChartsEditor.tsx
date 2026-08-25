import { Box, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import WorkChartsSelection from "../Reports/WorkChartsSelection";
import { useEffect, useState, useCallback } from "react";
import workchartHooks from "../../hooks/workchartHooks";
import General, { WorkChart } from "./General";
import Children from "./Children";
import Transactions from "./Transactions";
import Warning from "../../components/Warning";
import Managers, { UserChange } from "./Managers";
import { UserOptionType } from "../../components/Autocomplete/Autocomplete";
import usersHooks from "../../hooks/usersHooks";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";
import {
  useLocation,
  useSearchParams,
  useNavigate,
  useParams,
} from "react-router-dom";

const loadManagers = (
  users: UserOptionType[],
  workChartId: number,
): UserOptionType[] => {
  return users.filter((user) =>
    user.myrights.some((right) => {
      if (right.code === "project_manage") {
        return right.targets.some(
          (target) => target.ref_obj_pk === workChartId,
        );
      }
      return false;
    }),
  );
};

const WorkChartsEditor = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const { workChartId: workChartIdFromLocationState } = location.state || {};

  // Read work_chart_id and tab from route parameters (Angular style) or query parameters
  const workChartIdFromRoute = params.workChartId;
  const tabFromRoute = params.tab;
  const workChartIdFromQuery = searchParams.get("work_chart_id");
  const tabFromQuery = searchParams.get("tab");

  const [workChartId, setWorkChartId] = useState(2);
  const [type, setType] = useState("general");
  const [workChart, setWorkChart] = useState({});
  const { data: workCharts } = workchartHooks.useGetWorkCharts();
  const [managers, setManagers] = useState<UserOptionType[]>([]);

  const { data: allUsers } = usersHooks.useDetails();

  const { data: kinds } = workchartHooks.useGetWorkChartKinds({
    id: workChartId,
  });

  const { data: children } = workchartHooks.useGetChildren({
    id: workChartId,
  });

  const { mutateAsync: sendChanges } = rolesEditorHooks.useSaveChanges();

  // Function to update URL with current state for bookmarking (only for query parameter style URLs)
  const updateURL = useCallback(() => {
    // Don't update URL if we're using Angular-style route parameters
    if (params.workChartId) return;

    const urlParams = new URLSearchParams();

    if (workChartId !== 2)
      urlParams.set("work_chart_id", workChartId.toString());
    if (type !== "general") urlParams.set("tab", type);

    const currentParams = new URLSearchParams(
      window.location.hash.split("?")[1] || "",
    );
    const newParamsString = urlParams.toString();
    const currentParamsString = currentParams.toString();

    // Only update if parameters have changed
    if (newParamsString !== currentParamsString) {
      navigate(
        `/work_charts/editor${newParamsString ? `?${newParamsString}` : ""}`,
        { replace: true },
      );
    }
  }, [params.workChartId, workChartId, type, navigate]);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: string,
  ) => {
    setType(newValue);
  };

  const handleAddManager = async (managerChanges: UserChange[]) => {
    try {
      for (const mChanges of managerChanges) {
        const payload = {
          userId: mChanges.user_id,
          changes: {
            isChanged: mChanges.user_entity.isChanged,
            myrights: mChanges.user_entity.myrights,
          },
        };

        // Await each API call sequentially
        await sendChanges(payload);
      }

      window.alert("Manager(s) added successfully!");
    } catch (error) {
      console.error("Error while adding managers: ", error);
      window.alert("An error occurred while adding managers.");
    }
  };

  useEffect(() => {
    if (workChartIdFromLocationState) {
      setWorkChartId(workChartIdFromLocationState);
      setType("transactions");
    } else if (workChartIdFromRoute) {
      // Handle Angular-style route parameters
      setWorkChartId(parseInt(workChartIdFromRoute));
      if (tabFromRoute) {
        setType(tabFromRoute);
      }
    } else if (workChartIdFromQuery) {
      // Handle query parameters
      setWorkChartId(parseInt(workChartIdFromQuery));
      if (tabFromQuery) {
        setType(tabFromQuery);
      }
    }
  }, [
    workChartIdFromLocationState,
    workChartIdFromRoute,
    tabFromRoute,
    workChartIdFromQuery,
    tabFromQuery,
  ]);

  useEffect(() => {
    if (allUsers?.length > 0) {
      setManagers(loadManagers(allUsers, workChartId));
    }
  }, [allUsers, workChartId]);

  useEffect(() => {
    if (workCharts !== undefined) {
      setWorkChart(
        workCharts.filter((e: WorkChart) => {
          return e.id === (workChartId === 2 ? 1 : workChartId);
        })[0],
      );
    }
  }, [workChartId, workCharts]);

  // Update URL when state changes to enable bookmarking
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  const setStatus = (newStatus: string) => {
    const newObject = { ...workChart, status: newStatus };
    setWorkChart(newObject);
  };

  const setName = (newName: string) => {
    const newObject = { ...workChart, display_label: newName };
    setWorkChart(newObject);
  };

  const setParentId = (newParentId: number | string) => {
    const parsed =
      typeof newParentId === "string" ? parseInt(newParentId, 10) : newParentId;
    const newObject = { ...workChart, parent_id: parsed };
    setWorkChart(newObject);
  };

  return (
    <Stack
      direction="column"
      sx={{ margin: "auto", width: "66.6%", maxWidth: "686.66px" }}
    >
      <Box
        sx={{ backgroundColor: "#eee", marginBottom: "30px", padding: "15px" }}
      >
        <WorkChartsSelection
          workChartId={workChartId}
          hideSearchAll={true}
          setWorkChartId={setWorkChartId}
          includeNonleafs={true}
          forceIncludeHidden={true}
          forceIncludeDead={true}
        />
      </Box>
      <Warning />
      {workChart && Object.keys(workChart).length > 0 && (
        <>
          <Stack direction="row">
            <ToggleButtonGroup
              color="primary"
              value={type}
              exclusive
              onChange={handleChange}
            >
              <ToggleButton value="general">General</ToggleButton>
              <ToggleButton value="children">Children</ToggleButton>
              <ToggleButton value="managers">Managers</ToggleButton>
              <ToggleButton value="transactions">Transactions</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          {type === "general" && (
            <General
              //@ts-ignore
              workChart={workChart}
              setStatus={setStatus}
              setName={setName}
              setParentId={setParentId}
              kinds={kinds ?? []}
              onSelectWorkChart={(id: number) => setWorkChartId(id)}
            />
          )}
          {type === "children" && (
            <Children
              children={children}
              workCharts={workCharts}
              workChartId={workChartId}
            />
          )}
          {type === "managers" && (
            <Managers
              allUsers={allUsers}
              managers={managers}
              setManagers={setManagers}
              handleAddManager={handleAddManager}
              workChart={workChart as WorkChart}
              onToggleDontSendEmptyReports={(val: boolean) => {
                const newObject = {
                  ...workChart,
                  dont_send_empty_reports: val,
                } as any;
                setWorkChart(newObject);
              }}
            />
          )}
          {type === "transactions" && (
            <Transactions workChartId={workChartId} />
          )}
        </>
      )}
    </Stack>
  );
};

export default WorkChartsEditor;

import { Box, FormControl, Stack, TextField } from "@mui/material";
import { FC, useEffect, useState } from "react";
import "./index.css";
import BlueButton from "../../components/MyButton/BlueButton";
import RedButton from "../../components/MyButton/RedButton";
import workchartHooks from "../../hooks/workchartHooks";
import durationKindsHooks from "../../hooks/durationKindsHooks";

const statuses = [
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
  { value: "dead", label: "Dead" },
];

export interface WorkChart {
  id: number;
  status: string;
  display_label: string;
  parent_id: string;
  dont_send_empty_reports: boolean;
  labels: Array<string>;
}

export interface WorkChartParent {
  id: number;
  status: string;
  display_label: string;
  parent_id: string;
  path: Array<string>;
}

export interface Kind {
  code: string;
  display_label: string;
  inherited_from_id: number;
  is_default: boolean;
  is_inherited: boolean;
  is_active?: boolean;
}

interface GeneralProps {
  workChart: WorkChart;
  setStatus: Function;
  setName: Function;
  kinds: Array<Kind>;
  onSelectWorkChart?: (id: number) => void;
  setParentId: (id: number | string) => void;
}

const General: FC<GeneralProps> = (props) => {
  const {
    workChart,
    setStatus,
    setName,
    kinds,
    onSelectWorkChart,
    setParentId,
  } = props;
  const [allKinds, setAllKinds] = useState<Kind[]>([]);
  const [kindsInheritedFrom, setKindsInheritedFrom] = useState<
    WorkChart | undefined
  >(undefined);

  const { data: workChartsAbleToBeParents, isLoading: isParentsLoading } =
    workchartHooks.useGetWorkChartsAbleToBeParents();
  const { data: allWorkCharts, isLoading: isChartsLoading } =
    workchartHooks.useGetWorkCharts();
  const { data: durationKinds, isLoading: isDurationKindsLoading } =
    durationKindsHooks.useGetDurationKinds();
  const { mutateAsync: clearKinds, isLoading: clearingKinds } =
    workchartHooks.useClearKinds();
  const { mutateAsync: saveKindsMutation, isLoading: savingKinds } =
    workchartHooks.useSaveKinds();
  const { mutateAsync: updateWorkChart, isLoading: savingChart } =
    workchartHooks.useUpdateWorkChart();
  const { mutateAsync: deleteWorkChart, isLoading: deletingChart } =
    workchartHooks.useDeleteWorkChart();

  // Baselines for change detection
  const [baselineChart, setBaselineChart] = useState({
    display_label: "",
    status: "",
    parent_id: "" as any,
    dont_send_empty_reports: false,
  });
  const [baselineActiveCodes, setBaselineActiveCodes] = useState<string[]>([]);
  const [baselineDefaultCode, setBaselineDefaultCode] = useState<string>("");

  useEffect(() => {
    if (allWorkCharts && kinds) {
      // Determine inherited kinds
      if (
        kinds[0]?.inherited_from_id &&
        kinds[0].inherited_from_id !== workChart.id
      ) {
        const inheritedChart = allWorkCharts.find(
          (chart: WorkChart) => chart.id === kinds[0].inherited_from_id,
        );
        if (inheritedChart) {
          const display_label =
            inheritedChart.labels.length === 1
              ? inheritedChart.labels[0]
              : inheritedChart.labels.slice(1).join(" - ");
          setKindsInheritedFrom({
            ...inheritedChart,
            display_label,
          });
        }
      } else {
        setKindsInheritedFrom(undefined);
      }
    }
  }, [allWorkCharts, kinds, workChart]);

  useEffect(() => {
    if (!durationKinds) return;

    // Start with all duration kinds as inactive/non-default
    const base: Kind[] = (durationKinds as any).map((dk: any) => ({
      code: dk.code,
      display_label: dk.display_label,
      is_active: false,
      is_default: false,
      is_inherited: false,
      inherited_from_id: 0,
    }));

    // Overlay current chart's kinds (active + default flags)
    const activeMap = new Map<string, { is_default: boolean }>();
    (kinds || []).forEach((k) => {
      activeMap.set(k.code, { is_default: !!k.is_default });
    });

    const merged = base.map((k) => {
      const active = activeMap.get(k.code);
      return {
        ...k,
        is_active: !!active,
        is_default: active ? active.is_default : false,
      } as Kind;
    });

    // Ensure there is always a default among active kinds
    let ensured = merged;
    const hasActiveDefault = ensured.some((k) => k.is_active && k.is_default);
    if (!hasActiveDefault) {
      const firstActive = ensured.find((k) => k.is_active);
      if (firstActive) {
        ensured = ensured.map((k) => ({
          ...k,
          is_default: k.code === firstActive.code,
        }));
      }
    }

    setAllKinds(ensured);

    // Update baseline kinds whenever the source kinds/durationKinds change
    setBaselineActiveCodes(
      ensured.filter((k) => k.is_active).map((k) => k.code),
    );
    setBaselineDefaultCode(ensured.find((k) => k.is_default)?.code || "");
  }, [kinds, durationKinds]);

  useEffect(() => {
    // Set baselines when workChart ID changes (initial load of a chart)
    if (workChart && workChart.id) {
      setBaselineChart({
        display_label: workChart.display_label,
        status: workChart.status,
        parent_id: workChart.parent_id,
        dont_send_empty_reports: workChart.dont_send_empty_reports,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workChart?.id]);
  // Derived change flags
  const currentActiveCodes = allKinds
    .filter((k) => k.is_active)
    .map((k) => k.code);
  const currentDefaultCode = allKinds.find((k) => k.is_default)?.code || "";

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const as = [...a].sort();
    const bs = [...b].sort();
    for (let i = 0; i < as.length; i++) if (as[i] !== bs[i]) return false;
    return true;
  };

  const kindsChanged =
    !arraysEqual(currentActiveCodes, baselineActiveCodes) ||
    currentDefaultCode !== baselineDefaultCode;
  const chartChanged =
    baselineChart.display_label !== workChart.display_label ||
    baselineChart.status !== workChart.status ||
    baselineChart.parent_id !== workChart.parent_id ||
    baselineChart.dont_send_empty_reports !== workChart.dont_send_empty_reports;

  const handleSave = async () => {
    // Save chart first if changed, then kinds
    try {
      if (chartChanged) {
        const payload: any = {};
        if (baselineChart.display_label !== workChart.display_label) {
          payload.display_label = workChart.display_label;
        }
        if (baselineChart.status !== workChart.status) {
          payload.status = workChart.status;
        }
        if (baselineChart.parent_id !== workChart.parent_id) {
          // parent_id may be string from select
          const pid =
            typeof workChart.parent_id === "string"
              ? parseInt(workChart.parent_id, 10)
              : workChart.parent_id;
          payload.parent_id = pid;
        }
        if (
          baselineChart.dont_send_empty_reports !==
          workChart.dont_send_empty_reports
        ) {
          payload.dont_send_empty_reports = workChart.dont_send_empty_reports;
        }
        await updateWorkChart({ id: workChart.id, work_chart: payload });
        // Update baseline after successful save
        setBaselineChart({
          display_label: workChart.display_label,
          status: workChart.status,
          parent_id: workChart.parent_id,
          dont_send_empty_reports: workChart.dont_send_empty_reports,
        });
      }

      if (kindsChanged) {
        await saveKindsMutation({
          id: workChart.id,
          work_chart_kinds: currentActiveCodes,
          work_chart_kinds_defaults: currentDefaultCode,
        });
        setBaselineActiveCodes(currentActiveCodes);
        setBaselineDefaultCode(currentDefaultCode);
      }
      // Optional notification could be added here
    } catch (e) {
      // Optional: surface error via alert
    }
  };

  const handleDelete = async () => {
    try {
      const parentIdRaw: any = (workChart as any).parent_id;
      const parentId =
        typeof parentIdRaw === "string"
          ? parseInt(parentIdRaw, 10)
          : parentIdRaw;
      await deleteWorkChart((workChart as any).id).then(() => {
        if (onSelectWorkChart) {
          onSelectWorkChart(parentId || 2);
        }
      });
    } catch (e) {
      // Optional parity with Angular toast; keeping simple alert for now
      // to surface errors until a shared toast exists in React
      window.alert("Failed to delete work chart.");
    }
  };

  if (isParentsLoading || isChartsLoading || isDurationKindsLoading)
    return null;

  return (
    <Stack
      direction="row"
      sx={{ marginTop: "20px", backgroundColor: "white", padding: "10px" }}
    >
      <Stack direction="column" sx={{ width: "50%", padding: "0 6px" }}>
        <TextField
          id="outlined-controlled"
          size="small"
          value={workChart.display_label}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setName(event.target.value);
          }}
          sx={{
            marginBottom: "10px",
            border: "1px solid #cccccc",
            borderRadius: "2px",
            boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            padding: "0px",

            "& .MuiOutlinedInput-root": { fontSize: "14px", height: "30px" },
          }}
        />
        <FormControl>
          <select
            key={"status selection"}
            value={workChart.status}
            className="workchart-select"
            onChange={(event: any) => {
              setStatus(event.target.value);
            }}
            style={{ marginBottom: "10px" }}
          >
            {statuses.map((e: { label: string; value: string }) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </FormControl>
        <FormControl>
          <select
            key={"workchart selection"}
            value={workChart.parent_id}
            className="workchart-select"
            onChange={(event: any) => {
              setParentId(event.target.value);
            }}
          >
            {(workChartsAbleToBeParents || []).map((chart: WorkChartParent) => (
              <option key={chart.id} value={chart.id}>
                {(chart.path || []).join(" - ")}
              </option>
            ))}
          </select>
        </FormControl>
      </Stack>
      <Stack
        direction="column"
        sx={{
          width: "50%",
          padding: "0 6px",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        <Stack direction="row">
          <span className="eight-columns"></span>
          <span className="two-columns">Active?</span>
          <span className="two-columns">Default?</span>
        </Stack>
        {allKinds.map((kind) => {
          const activeCount = allKinds.filter((k) => k.is_active).length;
          return (
            <Stack key={kind.code} direction="row" sx={{ height: "28px" }}>
              <Box className="eight-columns">{kind.display_label}</Box>
              <Box className="two-columns">
                <input
                  type="checkbox"
                  checked={!!kind.is_active}
                  onChange={() => {
                    setAllKinds((prev) => {
                      const newActive = !kind.is_active;
                      let updated = prev.map((k) =>
                        k.code === kind.code
                          ? { ...k, is_active: newActive }
                          : k,
                      );

                      // If turning off the current default, move default to another active kind
                      if (!newActive && kind.is_default) {
                        const fallback = updated.find(
                          (k) => k.is_active && k.code !== kind.code,
                        );
                        if (fallback) {
                          updated = updated.map((k) => ({
                            ...k,
                            is_default: k.code === fallback.code,
                          }));
                        }
                      }

                      // Ensure there is always an active default
                      const hasActiveDefault = updated.some(
                        (k) => k.is_active && k.is_default,
                      );
                      if (!hasActiveDefault) {
                        const firstActive = updated.find((k) => k.is_active);
                        if (firstActive) {
                          updated = updated.map((k) => ({
                            ...k,
                            is_default: k.code === firstActive.code,
                          }));
                        }
                      }

                      return updated;
                    });
                  }}
                  disabled={!!kind.is_active && activeCount === 1}
                />
              </Box>
              <Box className="two-columns">
                <input
                  type="radio"
                  value={kind.code}
                  checked={!!kind.is_default}
                  onChange={() => {
                    if (!kind.is_default) {
                      setAllKinds((prev) =>
                        prev.map((k) => ({
                          ...k,
                          is_default: k.code === kind.code,
                        })),
                      );
                    }
                  }}
                  disabled={!kind.is_active}
                />
              </Box>
            </Stack>
          );
        })}
        {kindsInheritedFrom && (
          <Box
            sx={{
              color: "#999",
              textAlign: "center",
              fontSize: "12px",
              marginBottom: "20px",
              marginTop: "10px",
              padding: "5px",
              lineHeight: "20px",
              background: "rgba(0, 0, 0, 0.05)",
            }}
          >
            Kinds inherited from{" "}
            {kindsInheritedFrom.id === 2 ? (
              // Match legacy behavior: show static text for root node, not a link
              <>End Point Corp root node</>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onSelectWorkChart && onSelectWorkChart(kindsInheritedFrom.id)
                }
                style={{
                  color: "#04C",
                  textDecoration: "none",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {kindsInheritedFrom.display_label}
              </button>
            )}
          </Box>
        )}
        <Stack direction="row-reverse" gap={1}>
          <BlueButton
            name="Save"
            onClick={handleSave}
            disabled={
              (!kindsChanged && !chartChanged) ||
              savingKinds ||
              savingChart ||
              deletingChart
            }
          />
          <RedButton
            name={deletingChart ? "Deleting…" : "Delete"}
            onClick={handleDelete}
          />
          {kindsInheritedFrom === undefined && (
            <RedButton
              name={clearingKinds ? "Clearing…" : "Clear set"}
              onClick={async () => {
                try {
                  await clearKinds(workChart.id);
                } catch (e) { }
              }}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default General;

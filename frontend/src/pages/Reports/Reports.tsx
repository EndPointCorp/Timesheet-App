import { useEffect, useState, useCallback, useRef } from "react";
import { Box, FormControl, Stack } from "@mui/material";
import TypeSelection from "./TypeSelection";
import dayjs, { Dayjs } from "dayjs";
import DateSelection from "./DateSelection";
import WorkChartsSelection from "./WorkChartsSelection";
import PeopleSelection from "./PeopleSelection";
import reportsHooks from "../../hooks/reportsHooks";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { usersHooks } from "../../hooks";
import "./index.css";
import ReportContent from "./ReportContent";
import { CreatePresetParams } from "../../types/reports";
import { PeopleOptionType } from "../../components/Autocomplete/Autocomplete";
import Warning from "../../components/Warning";

const periods = [
  { label: "Periods: Continuous", value: "continuous" },
  { label: "Periods: Weekly", value: "weekly" },
  { label: "Periods: Monthly", value: "monthly" },
  { label: "Periods: Quarterly", value: "quarterly" },
  { label: "Periods: Yearly", value: "yearly" },
];

interface DateRange {
  start: string;
  end: string;
}

export interface Preset {
  id?: number;
  created_at?: string;
  start_date: string;
  end_date: string;
  dates_period_type: string;
  name: string;
  roles: string[];
  report_type: string;
  fragmentation: string;
  work_chart_id: number;
  description: boolean;
}

const getRelativeDateRange = (preset: Preset): DateRange => {
  const today: Dayjs = dayjs();

  switch (preset.dates_period_type) {
    case "last_week": {
      // dayjs's startOf('week') defaults to Sunday.
      const thisWeekStart = today.startOf("week");
      const lastWeekStart = thisWeekStart.subtract(1, "week");
      // Last week runs from Sunday to Saturday
      const lastWeekEnd = lastWeekStart.add(6, "day");
      return {
        start: lastWeekStart.format("YYYY-MM-DD"),
        end: lastWeekEnd.format("YYYY-MM-DD"),
      };
    }
    case "last_month": {
      // Get the first and last day of the previous month.
      const lastMonthStart = today.subtract(1, "month").startOf("month");
      const lastMonthEnd = today.subtract(1, "month").endOf("month");
      return {
        start: lastMonthStart.format("YYYY-MM-DD"),
        end: lastMonthEnd.format("YYYY-MM-DD"),
      };
    }
    case "this_month": {
      // Get the first and last day of the current month.
      const monthStart = today.startOf("month");
      const monthEnd = today.endOf("month");
      return {
        start: monthStart.format("YYYY-MM-DD"),
        end: monthEnd.format("YYYY-MM-DD"),
      };
    }
    case "today": {
      const formatted = today.format("YYYY-MM-DD");
      return { start: formatted, end: formatted };
    }
    case "yesterday": {
      const yesterday = today.subtract(1, "day");
      const formatted = yesterday.format("YYYY-MM-DD");
      return { start: formatted, end: formatted };
    }
    case "last_7_days": {
      const start = today.subtract(7, "day");
      return {
        start: start.format("YYYY-MM-DD"),
        end: today.format("YYYY-MM-DD"),
      };
    }
    case "last_30_days": {
      const start = today.subtract(30, "day");
      return {
        start: start.format("YYYY-MM-DD"),
        end: today.format("YYYY-MM-DD"),
      };
    }
    case "this_week": {
      // Current week from Sunday to Saturday
      const weekStart = today.startOf("week");
      const weekEnd = weekStart.add(6, "day");
      return {
        start: weekStart.format("YYYY-MM-DD"),
        end: weekEnd.format("YYYY-MM-DD"),
      };
    }
    case "this_year": {
      const yearStart = today.startOf("year");
      const yearEnd = today.endOf("year");
      return {
        start: yearStart.format("YYYY-MM-DD"),
        end: yearEnd.format("YYYY-MM-DD"),
      };
    }
    case "last_year": {
      const lastYearStart = today.subtract(1, "year").startOf("year");
      const lastYearEnd = today.subtract(1, "year").endOf("year");
      return {
        start: lastYearStart.format("YYYY-MM-DD"),
        end: lastYearEnd.format("YYYY-MM-DD"),
      };
    }
    case "all_time": {
      return { start: preset.start_date, end: preset.end_date };
    }
    default:
      // Fallback: use the preset's stored dates.
      return { start: preset.start_date, end: preset.end_date };
  }
};

const getMatchedRoles = (
  allRoles: Array<PeopleOptionType>,
  rolesArray: Array<string>,
): Array<PeopleOptionType> => {
  return allRoles.filter(({ display_label }) =>
    rolesArray.includes(display_label),
  );
};

const Reports = () => {
  const [queryParameters] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  // Guard to only auto-run once on initial load from a bookmark/URL
  const initializedFromURLRef = useRef(false);
  // Flag to mark URL changes initiated from inside the app (avoid auto-running on those)
  const internalNavRef = useRef(false);
  const [openInNewWindow, setOpenInNewWindow] = useState(false);
  const [preset, setPreset] = useState<Preset | null>(null);
  const [presetIndex, setPresetIndex] = useState("0");
  const [presetName, setPresetName] = useState<string>("");
  const [reportEnabled, setReportEnabled] = useState(false);
  const [showPeopleSelection, setShowPeopleSelection] = useState(false);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);

  const { data: presets, refetch: refetchPresets } = reportsHooks.usePresets();
  // Skip the very first URL sync so we don't rewrite legacy bookmark URLs on initial load
  const hasSyncedURLRef = useRef(false);

  const [type, setType] = useState<string>("break");
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs());
  const [roles, setRoles] = useState<Array<PeopleOptionType>>([]);
  const [workChartId, setWorkChartId] = useState(2);
  const [description, setDescription] = useState<boolean>(false);
  const [period, setPeriod] = useState("continuous");
  const [hoursInTheBank, setHoursInTheBank] = useState(false);
  const [pdf, setPdf] = useState(false);

  const { data: allRoles, status: getAllRolesStatus } =
    usersHooks.useGetAllRoles();
  const { data: report, status: getReportStatus } = reportsHooks.useReport(
    {
      report_type: pdf ? type + ".pdf" : type,
      start_date: startDate.format("YYYY/MM/DD"),
      end_date: endDate.format("YYYY/MM/DD"),
      fragmentation: period,
      roles:
        roles.length > 0
          ? roles?.map((role) => {
              return role.email;
            })
          : [],
      description: description,
      show_hours_in_the_bank: hoursInTheBank,
      work_chart_id: workChartId,
    },
    reportEnabled,
    pdf,
  );
  const { mutateAsync: save } = reportsHooks.useCreatePreset();

  // Function to update URL with current state for bookmarking (only for query parameter style URLs)
  const updateURL = useCallback(() => {
    // Don't update URL if we're using Angular-style route parameters
    if (params.type) return;
    // Skip initial sync to preserve incoming bookmark URL as-is
    if (!hasSyncedURLRef.current) {
      hasSyncedURLRef.current = true;
      return;
    }

    const params_new = new URLSearchParams();

    params_new.set("report_type", type);
    if (startDate && !startDate.isSame(dayjs().startOf("month"), "day")) {
      params_new.set("start_date", startDate.format("YYYY-MM-DD"));
    }
    if (endDate && !endDate.isSame(dayjs(), "day")) {
      params_new.set("end_date", endDate.format("YYYY-MM-DD"));
    }
    // Preserve legacy 'all' when no roles are selected
    params_new.set(
      "roles",
      roles.length > 0
        ? roles.map((role) => role.display_label).join(",")
        : "all",
    );
    if (description) params_new.set("description", "true");
    // Always include work_chart_id for compatibility with bookmarks
    params_new.set("work_chart_id", workChartId.toString());
    if (period !== "continuous") {
      params_new.set("period", period);
      params_new.set("fragmentation", period); // legacy alias
    }
    if (hoursInTheBank) params_new.set("hours_in_the_bank", "true");
    if (pdf) params_new.set("pdf", "true");
    // We don't automatically set dates_relative and dates_period_type here because
    // they are a legacy input format; they are still parsed if present in bookmarks.
    if (reportEnabled) params_new.set("reportEnabled", "true");

    const currentParams = new URLSearchParams(
      window.location.hash.split("?")[1] || "",
    );
    const newParamsString = params_new.toString();
    const currentParamsString = currentParams.toString();

    // Only update if parameters have changed
    if (newParamsString !== currentParamsString) {
      // Mark this navigation as internal so we don't auto-run from the URL sync
      internalNavRef.current = true;
      navigate(`/reports${newParamsString ? `?${newParamsString}` : ""}`, {
        replace: true,
      });
    }
  }, [
    params.type,
    type,
    startDate,
    endDate,
    roles,
    description,
    workChartId,
    period,
    hoursInTheBank,
    pdf,
    reportEnabled,
    navigate,
  ]);

  useEffect(() => {
    if (allRoles && allRoles.length > 0) {
      // Check if we have route parameters (Angular-style URLs) or query parameters
      if (params.type) {
        // Handle Angular-style URL parameters
        const reportType = params.type || "break";
        const startDateParam =
          params.startDate || dayjs().startOf("month").format("YYYY-MM-DD");
        const endDateParam = params.endDate || dayjs().format("YYYY-MM-DD");
        const rolesParam = params.roles || "";
        const descriptionParam = params.description === "true";
        const workChartIdParam = params.workChartId || "2";
        const hoursInTheBankParam = params.hoursInBank === "true";

        const rolesArray =
          rolesParam === "all"
            ? []
            : rolesParam.split(",").filter((role) => role.trim() !== "");
        const matchedRoles = getMatchedRoles(allRoles, rolesArray);

        setRoles(matchedRoles);
        setType(reportType);
        setStartDate(dayjs(startDateParam));
        setEndDate(dayjs(endDateParam));
        setDescription(descriptionParam);
        setWorkChartId(parseInt(workChartIdParam));
        setPeriod("continuous"); // Default for Angular URLs
        setHoursInTheBank(hoursInTheBankParam);
        setPdf(false);
        setReportEnabled(true); // Enable report automatically for Angular URLs
        initializedFromURLRef.current = true;
      } else {
        // Handle query parameters (new style)
        const reportType = queryParameters.get("report_type") || "break";
        const startDateParamRaw =
          queryParameters.get("start_date") ||
          dayjs().startOf("month").format("YYYY-MM-DD");
        const endDateParamRaw =
          queryParameters.get("end_date") || dayjs().format("YYYY-MM-DD");
        const rolesParam = queryParameters.get("roles") || "";
        const descriptionParam = queryParameters.get("description") === "true";
        const workChartIdParam = queryParameters.get("work_chart_id") || "2";
        const periodParam =
          queryParameters.get("period") ||
          queryParameters.get("fragmentation") ||
          "continuous";
        const hoursInTheBankParam =
          queryParameters.get("hours_in_the_bank") === "true";
        const pdfParam = queryParameters.get("pdf") === "true";
        const datesRelative = queryParameters.get("dates_relative") === "true";
        const datesPeriodType = queryParameters.get("dates_period_type");
        // Compute date range from relative params if requested (legacy bookmarks)
        const relRange =
          datesRelative && datesPeriodType
            ? getRelativeDateRange({
                // Only fields used by getRelativeDateRange
                dates_period_type: datesPeriodType,
                start_date: startDateParamRaw,
                end_date: endDateParamRaw,
              } as unknown as Preset)
            : null;
        const startDateParam = relRange?.start || startDateParamRaw;
        const endDateParam = relRange?.end || endDateParamRaw;
        // Decide whether to auto-run based on URL change source
        // If reportEnabled is explicitly set in the URL, always honor it.
        const reportEnabledExplicit = queryParameters.get("reportEnabled");
        const hasRelative =
          queryParameters.get("dates_relative") === "true" &&
          queryParameters.has("dates_period_type");
        const hasStartFromBookmark =
          hasRelative ||
          queryParameters.has("start_date") ||
          queryParameters.has("start");
        let reportEnabledParam: boolean | null = null;
        if (reportEnabledExplicit !== null) {
          reportEnabledParam = reportEnabledExplicit === "true";
        } else if (internalNavRef.current) {
          // URL was updated by our own updateURL sync; don't auto-run
          reportEnabledParam = null;
        } else if (hasStartFromBookmark) {
          // User pasted/triggered an external URL change with runnable params
          reportEnabledParam = true;
        }

        const rolesArray =
          rolesParam === "all"
            ? []
            : rolesParam.split(",").filter((role) => role.trim() !== "");
        const matchedRoles = getMatchedRoles(allRoles, rolesArray);

        setRoles(matchedRoles);
        setType(reportType);
        setStartDate(dayjs(startDateParam));
        setEndDate(dayjs(endDateParam));
        setDescription(descriptionParam);
        setWorkChartId(parseInt(workChartIdParam));
        setPeriod(periodParam);
        setHoursInTheBank(hoursInTheBankParam);
        setPdf(pdfParam);
        if (reportEnabledParam !== null) setReportEnabled(reportEnabledParam);
        initializedFromURLRef.current = true;
        // Reset internal navigation flag after handling URL change
        if (internalNavRef.current) internalNavRef.current = false;
      }
      setShowPeopleSelection(true);
    }
  }, [queryParameters, params, allRoles]);

  useEffect(() => {
    if (!!preset && preset?.created_at !== undefined) {
      const dateRange = getRelativeDateRange(preset);
      const presetRoles = getMatchedRoles(
        allRoles as Array<PeopleOptionType>,
        preset.roles,
      );
      setStartDate(dayjs(dateRange.start));
      setEndDate(dayjs(dateRange.end));
      setRoles(preset.roles[0] === "all" ? [] : presetRoles);
      setType(preset.report_type);
      setPeriod(preset.fragmentation);
      setWorkChartId(preset.work_chart_id);
      setDescription(preset.description);
    }
  }, [preset, allRoles]);

  // Update URL when state changes to enable bookmarking
  useEffect(() => {
    if (showPeopleSelection && showDateSelection && showTypeSelection) {
      updateURL();
    }
  }, [updateURL, showPeopleSelection, showDateSelection, showTypeSelection]);

  const onSave = async () => {
    const params: CreatePresetParams = {
      start_date: startDate.format("YYYY/MM/DD"),
      end_date: endDate.format("YYYY/MM/DD"),
      roles:
        roles.length === 0
          ? ["all"]
          : roles.map((value) => {
              return value.display_label;
            }),
      report_type: type,
      fragmentation: period,
      work_chart_id: workChartId,
      description: description,
      show_all_roles: false,
      dates_period_type: false,
      dates_relative: false,
      name: presetName,
    };
    try {
      await save(params);
      setPresetName("");
      try {
        await refetchPresets();
        setPresetIndex("-1");
      } catch (error) {
        console.error("Error refetching presets:", error);
      }
    } catch (error) {
      console.error("Error saving preset:", error);
    }
  };

  const handleSelectPeriod = (event: any) => {
    setPeriod(event.target.value);
    setReportEnabled(false); // user is configuring; prevent auto-regeneration
    resetPresetDropdown();
  };

  const resetPresetDropdown = () => {
    setPreset(null);
    setPresetIndex("0"); // or whatever default value indicates "no preset"
  };

  const generateClick = () => {
    const safeType = type || "break";
    const params = new URLSearchParams({
      report_type: safeType,
      start_date: startDate.format("YYYY-MM-DD"),
      end_date: endDate.format("YYYY-MM-DD"),
      roles: roles.map((role) => role.display_label).join(","),
      description: description.toString(),
      work_chart_id: workChartId.toString(),
      period: period,
      hours_in_the_bank: hoursInTheBank.toString(),
      pdf: pdf.toString(),
      reportEnabled: "true",
    });

    if (openInNewWindow) {
      const base = `${window.location.origin}${window.location.pathname}`;
      const useHash = window.location.hash && window.location.hash.length > 0;
      const url = useHash
        ? `${base}#/reports?${params.toString()}`
        : `${window.location.origin}/reports?${params.toString()}`;
      window.open(url, "_blank");
    } else {
      setStartDate(() => dayjs(startDate.format("YYYY-MM-DD")));
      setEndDate(() => dayjs(endDate.format("YYYY-MM-DD")));
      setShowDateSelection(true);
      if (getAllRolesStatus === "success") setShowPeopleSelection(true);
      setType(() => safeType);
      setShowTypeSelection(true);
      setPeriod(() => period);
      setWorkChartId(() => Number(workChartId));
      setDescription(() => description);
      setReportEnabled(() => true);
    }
  };

  useEffect(() => {
    setShowTypeSelection(true);
    setShowDateSelection(true);
  }, []);

  useEffect(() => {
    if (getReportStatus === "success") setReportEnabled(false);
  }, [getReportStatus]);

  const removeSelected = (event: {
    currentTarget: { classList: { remove: (arg0: string) => void } };
  }) => {
    event.currentTarget.classList.remove("Mui-selected");
  };

  const renderPeopleSelection = () => {
    if (!showPeopleSelection) return null;

    if (allRoles && allRoles?.length > 0) {
      return (
        <PeopleSelection
          allRoles={allRoles}
          roles={roles}
          setRoles={(newRoles: PeopleOptionType[]) => {
            setRoles(newRoles);
            setReportEnabled(false); // stop auto-run while editing
            resetPresetDropdown();
          }}
        />
      );
    }
  };

  return (
    <Stack direction="column" sx={{ width: "1000px", margin: "auto" }}>
      <Box className="row2 no-print" sx={{ paddingTop: "20px" }}>
        {showTypeSelection && (
          <TypeSelection
            type={type}
            setType={(newType: string) => {
              setType(newType);
              setReportEnabled(false); // stop auto-run while editing
              resetPresetDropdown();
            }}
            setPreset={setPreset}
            setPresetIndex={setPresetIndex}
            presetIndex={presetIndex as string}
            presets={presets as Array<Preset>}
          />
        )}
        <Box sx={{ display: "flex", marginTop: "12px" }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {showDateSelection && (
              <DateSelection
                startDate={startDate}
                endDate={endDate}
                setStartDate={(newStartDate: Dayjs) => {
                  setStartDate(newStartDate);
                  setReportEnabled(false); // stop auto-run while editing
                  resetPresetDropdown();
                }}
                setEndDate={(newEndDate: Dayjs) => {
                  setEndDate(newEndDate);
                  setReportEnabled(false); // stop auto-run while editing
                  resetPresetDropdown();
                }}
              />
            )}

            {renderPeopleSelection()}

            <FormControl sx={{ marginLeft: "4px", position: "relative" }}>
              <select
                key="period"
                value={period}
                className="select-dropdown-menu period-select"
                onChange={handleSelectPeriod}
                style={{}}
              >
                {periods.map(
                  (period: { value: string; label: string }, key: number) => (
                    <option
                      key={key}
                      value={period.value}
                      onMouseLeave={removeSelected}
                    >
                      {period.label}
                    </option>
                  ),
                )}
              </select>
            </FormControl>

            <Stack
              direction="column"
              sx={{ marginLeft: "20px", marginTop: "12px" }}
            >
              <label className="checkboxText">
                <input
                  type="checkbox"
                  checked={description}
                  className="reportsCheckbox"
                  onChange={() => {
                    setDescription(!description);
                    setReportEnabled(false); // stop auto-run while editing
                    resetPresetDropdown();
                  }}
                ></input>
                Display full descriptions
              </label>
              <label className="checkboxText">
                <input
                  type="checkbox"
                  checked={openInNewWindow}
                  className="reportsCheckbox"
                  onChange={() => setOpenInNewWindow(!openInNewWindow)}
                ></input>
                Open in new window
              </label>
              <label className="checkboxText">
                <input
                  type="checkbox"
                  checked={hoursInTheBank}
                  className="reportsCheckbox"
                  onChange={() => {
                    setHoursInTheBank(!hoursInTheBank);
                    setReportEnabled(false); // stop auto-run while editing
                  }}
                ></input>
                Show hours in the bank
              </label>
            </Stack>
          </Box>
          <div className="no-print">
            <WorkChartsSelection
              {...{
                workChartId,
                includeNonleafs: true,
                setWorkChartId: (id: number) => {
                  setWorkChartId(id);
                  setReportEnabled(false); // stop auto-run while editing
                },
                generateClick,
                pdf,
                setPdf: (value: boolean) => {
                  setPdf(value);
                  setReportEnabled(false); // stop auto-run while editing
                },
              }}
            />
          </div>
        </Box>
      </Box>

      <Box className="no-print">
        <Warning
          width={1000}
          marginBottom={20}
          marginLeft={"auto"}
          marginRight={"auto"}
        />
      </Box>

      {report && (
        <ReportContent
          {...{
            type,
            startDate,
            endDate,

            report,
            presetName,
            setPresetName,
            onSave,
            preset,
          }}
          roles={roles.map((role) => {
            return role.display_label;
          })}
          isPdf={pdf}
        />
      )}
    </Stack>
  );
};

export default Reports;

import React, { useState, useEffect } from "react";
import { MenuItem, Button, Select, FormControl } from "@mui/material";
import SearchAutocomplete from "../SearchAutocomplete";
import workchartHooks from "../../hooks/workchartHooks";
import { WorkChart } from "../../types";
import LoadingSpinner from "../LoadingSpinner";
import MySwitch from "../MySwitch/MySwitch";

type WorkChartsPickerProps = {
  addWorkChartsToRight: (selectedWorkChart: WorkChart) => void;
};

interface RawChart {
  parent_id: number;
  dont_send_empty_reports: boolean;
  id: number;
  status: string;
  display_label: string | null;
  labels: string[];
}

interface Chart {
  parentId: number;
  dontSendEmptyReports: boolean;
  id: number;
  status: string;
  title: string;
  labels: string[];
}

// The toChart function to transform raw data
const toChart = (item: RawChart): Chart => {
  const getTitle = (): string => {
    if (item.display_label == null || item.display_label === undefined) {
      if (item.labels[0] === "Clients") {
        // Drop the first label if it's "Clients" and join the rest
        return item.labels.slice(1).join(" / ");
      } else {
        return item.labels.join(" / ");
      }
    }
    return item.display_label;
  };

  return {
    parentId: item.parent_id,
    dontSendEmptyReports: item.dont_send_empty_reports,
    id: item.id,
    status: item.status,
    title: getTitle(),
    labels: item.labels,
  };
};

// Function to get children for a given id and status
const childrenForId = (
  charts: Chart[],
  id: number | undefined,
  status?: string,
): Chart[] => {
  if (id === undefined) return [];

  const forId = (item: Chart) => {
    return (
      item.parentId !== undefined &&
      item.parentId !== null &&
      item.parentId.toString() === id.toString()
    );
  };

  const forStatus = (charts: Chart[], status?: string) => {
    if (!status) return charts;
    if (status === "active") {
      return charts.filter((c) => c.status === "active");
    } else if (status === "hidden") {
      return charts.filter(
        (c) => c.status === "active" || c.status === "hidden",
      );
    } else {
      return charts;
    }
  };

  return forStatus(charts, status).filter(forId);
};

const transformCharts = (rawCharts: RawChart[], workChartId: number | null) => {
  if (workChartId === null) return [];
  const transformedCharts: Chart[] = rawCharts.map(toChart);
  return childrenForId(transformedCharts, workChartId);
};

const WorkChartsPicker: React.FC<WorkChartsPickerProps> = ({
  addWorkChartsToRight,
}) => {
  const [workChartId, setWorkChartId] = useState<number>(2);
  const [inputValue, setInputValue] = useState<string>(""); // To handle input changes in Autocomplete
  const [showHidden, setShowHidden] = useState<boolean>(false); // New state for showing hidden work charts

  const { data: rawCharts = [], isLoading: isTransformedLoading } =
    workchartHooks.useGetWorkCharts() as {
      data: RawChart[];
      isLoading: boolean;
    };

  useEffect(() => {
    const workChart = rawCharts.find((r) => r.id === workChartId);
    console.log("selected chart: ", workChart);
    if (workChart) {
      const workChartLabel = workChart.labels.slice(1).join(" - ");
      setInputValue(workChartLabel);
    }
  }, [workChartId, rawCharts]);

  if (isTransformedLoading) {
    return (
      <div style={{ padding: "20px", paddingBottom: "30px" }}>
        <LoadingSpinner />
      </div>
    );
  }

  const handleChartSelect = (selectedChart: WorkChart | null) => {
    if (selectedChart === null) return;
    setWorkChartId(selectedChart.id);
  };

  const handleOnSelectChange = (selectedNodeId: number) => {
    console.log("selectedNodeId");
    // const selectedChartNodeObject = transformedCharts?.find((chart) => chart.id === selectedNodeId);
    // setSelectedChartId(selectedChartNodeObject?.id || '');
    // selectedChartNodeObject?.title && setInputValue(selectedChartNodeObject?.title)
  };

  const WorkChartLevel: React.FC<{ id: number; label: string }> = ({
    id,
    label,
  }) => {
    if (id === 1) return null;
    const rawChart = rawCharts.find((r) => r.id === id);
    const children = rawCharts.filter((r) => r.parent_id === id);
    if (rawChart === undefined) return null;
    children.length > 0 &&
      children.unshift({
        id: rawChart.id,
        parent_id: 1,
        display_label: label || rawChart.labels[rawChart.labels.length - 1],
        dont_send_empty_reports: false,
        status: "",
        labels: [],
      });

    return (
      <>
        <WorkChartLevel
          id={rawChart.parent_id}
          label={rawChart.labels[rawChart.labels.length - 1]}
        />
        {children.length > 0 && (
          <FormControl
            key={`form-${id}`}
            fullWidth
            style={{
              marginTop: "20px",
              backgroundColor: "white",
              borderRadius: "4px",
            }}
          >
            <Select
              id={`select-workchart-${id}`}
              value={id}
              onChange={(event) => setWorkChartId(Number(event.target.value))}
            >
              {children.map((chart) => (
                <MenuItem key={chart.id} value={chart.id}>
                  {chart.display_label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "rgba (0,0,0,0.8)",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
      }}
    >
      {/* Refactored SearchAutocomplete with required props */}
      <SearchAutocomplete
        id="workchart-search"
        inputValue={inputValue}
        setInputValue={setInputValue}
        placeholder="Type to search through work charts"
        onSelect={handleChartSelect} // Handles selection of an option
        includeHidden={showHidden}
        includeNonleafs={true}
      />

      {/* Toggle switch for showing hidden work charts */}
      {/* <div style={{ marginTop: "10px" }}>
        <MySwitch 
          checked={showHidden} 
          setChecked={setShowHidden} 
          label="Show hidden: " 
        />
      </div> */}

      {/* Select component for choosing a work chart */}
      <WorkChartLevel id={workChartId} label="" />

      {/* Add button to demonstrate adding a selected item */}
      <Button
        variant="contained"
        color="primary"
        sx={{
          backgroundImage:
            "linear-gradient(to bottom, #0098FF, #04C) !important",
          marginTop: "20px",
          display: "block",
          width: "100%",
          textTransform: "none",
          "&.Mui-disabled": {
            backgroundColor: "#003366",
            color: "#8a8a8a",
          },
        }}
        onClick={() => {
          const selectedChart =
            rawCharts.find((chart) => chart.id === workChartId) || null;
          if (selectedChart) {
            console.log("Adding chart:", selectedChart);
            addWorkChartsToRight({
              label: selectedChart.display_label || "",
              id: selectedChart.id,
            });
          }
        }}
        disabled={!inputValue}
      >
        Add
      </Button>
    </div>
  );
};

export default WorkChartsPicker;

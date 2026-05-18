import { Stack, Typography, Grid, Box } from "@mui/material";
import HelpIcon from "../../components/Icons/HelpIcon";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { calendarHooks } from "../../hooks";
import { useNavigate } from "react-router-dom";

interface RemainingHoursWorkChart {
  work_chart_id: number;
  budget_chart_id: number;
  budget_chart_labels: string[];
  mode: "billable" | "nonbillable";
  minutes_left: number;
}

/**
 * Returns a color string based on hours left.
 */
function getRowColor(hours: number): string {
  if (hours === 0) {
    return "#FF4300";
  } else if (hours > 0 && hours < 16) {
    return "orange";
  } else if (hours >= 16) {
    return "rgb(134, 196, 0)";
  } else {
    return "orange";
  }
}

type WorkChart = {
  work_chart_id: number;
  budget_chart_labels: string[];
  mode: string;
  minutes_left: number;
};

const sortByBudgetLabel = (a: WorkChart, b: WorkChart): number => {
  const labelA = a.budget_chart_labels[2] || ""; // Fallback to empty string if undefined
  const labelB = b.budget_chart_labels[2] || "";

  return labelA.localeCompare(labelB);
};

interface WorkChartGridProps {
  workChartNodeLabels: string[];
  hours: number;
  isNonBillable: boolean;
  workChartId: number;
}

const WorkChartGrid: React.FC<WorkChartGridProps> = ({
  workChartNodeLabels,
  hours,
  isNonBillable,
  workChartId,
}) => {
  const navigate = useNavigate();

  const rowColor = getRowColor(hours);

  const openTransactions = () => {
    navigate("/work_charts/editor", { state: { workChartId } });
  };

  const renderWorkChartNodeLabels = (labels: string[]) => {
    if (!labels || labels.length === 0) return null;

    if (labels.length === 1) {
      return <Typography sx={{ fontSize: 12 }}>{labels[0]}</Typography>;
    }

    // Combine everything but the last label, joined by " - "
    const firstPart = labels.slice(0, -1).join(" - ");
    // The last label
    const lastLabel = labels[labels.length - 1];

    return (
      <Typography
        sx={{
          fontSize: 12,
          // Allows the text to wrap onto multiple lines if it doesn’t fit:
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {firstPart}
        {" - "}
        <Box component="span" sx={{ fontWeight: "bold" }}>
          {lastLabel}
        </Box>
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        marginBottom: 0.5,
        cursor: "pointer",
      }}
    >
      {/* Label Container */}
      <Box
        onClick={openTransactions}
        sx={{
          backgroundColor: "#ddd",
          paddingLeft: 1,
          paddingRight: 1,
          width: 220,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {
          // skip the first label, its value is always  "End Point Corp."
          renderWorkChartNodeLabels(workChartNodeLabels.slice(1))
        }
      </Box>

      <Box
        sx={{
          width: 26, // The width of your triangle “arrow”
          // Let it fill the parent’s height
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: rowColor,
        }}
      >
        <Box
          sx={{
            borderWidth: "20px 0 20px 10px",
            borderStyle: "solid",
            borderColor: `transparent transparent transparent #ddd`,
            height: 30,
            width: 26,
            backgroundColor: rowColor,
          }}
        />
      </Box>

      {/* Main Hours Box */}
      <Box
        sx={{
          width: 70,
          backgroundColor: rowColor,
          paddingRight: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>{hours.toFixed(2)}</Typography>
      </Box>

      {/* NB indicator */}
      {isNonBillable && (
        <Box
          sx={{
            position: "relative",
            width: 30,
            height: 30,
            background: "rgba(200, 200, 200, 0.9)",
            borderRadius: "100px",
            lineHeight: "30px",
            textAlign: "center",
            fontWeight: "bold",
            right: 16,
            top: 5,
            fontSize: 12,
          }}
        >
          NB
        </Box>
      )}
    </Box>
  );
};

export const RemainingHours = ({ username }: { username?: string }) => {
  const { data: hoursSummary, isLoading: isLoadingHoursSummary } =
    calendarHooks.useGetHoursSummary({ username });

  console.log("hoursSummary for", username, ":", hoursSummary);

  if (isLoadingHoursSummary) {
    return null;
  }

  return (
    <Stack direction={"column"} marginTop={4}>
      <Stack direction={"row"}>
        <HelpIcon
          maxWidth={250}
          float="left"
          marginLeft={20}
          text={
            <>
              <p>
                <span
                  style={{
                    display: "inline-flex",
                    verticalAlign: "middle",
                    boxSizing: "inherit",
                    textAlign: "center",
                    alignItems: "center",
                    height: "12px",
                  }}
                >
                  <HelpOutlineIcon />
                </span>{" "}
                <b>Budgeted project</b>
              </p>
              <p>
                <b>
                  Lists work charts with hours assigned to them. The value on
                  the right shows how many are left.
                </b>
              </p>
            </>
          }
        />
        <Typography sx={{ marginLeft: 1 }}>Remaining hours</Typography>
      </Stack>
      <Stack direction={"column"}>
        {Array.isArray(hoursSummary) && hoursSummary.length > 0 ? (
          hoursSummary
            .sort(sortByBudgetLabel)
            .map((remainigHoursWorkChart: RemainingHoursWorkChart) => (
              <WorkChartGrid
                key={remainigHoursWorkChart.work_chart_id}
                workChartId={remainigHoursWorkChart.work_chart_id}
                workChartNodeLabels={remainigHoursWorkChart.budget_chart_labels}
                hours={remainigHoursWorkChart.minutes_left / 60.0}
                isNonBillable={remainigHoursWorkChart.mode === "nonbillable"}
              />
            ))
        ) : (
          <Typography sx={{ marginLeft: 1, marginTop: 2, color: "#888" }}>
            No remaining hours data.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

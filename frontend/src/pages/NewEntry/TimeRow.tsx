import { Box, Button, FormControl, Stack } from "@mui/material";
import "./index.css";
import { useEffect, useState } from "react";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import AddCircleIcon from "@mui/icons-material/AddCircle";

export interface TimeSelectionRow {
  kind_code: string;
  duration: number;
  createdBy: string | null;
  id: number | null;
}

export interface TimeRowProps {
  timeRow: TimeSelectionRow;
  hoursChange: Function;
  kindChange: Function;
  minutesChange: Function;
  kinds: Array<{ display_label: string; code: string }>;
  rowIndex: number;
  disableAddButton: Boolean;
  addRow: Function;
  deleteRow: Function;
  minusDisabled: boolean;
  markAsChanged?: () => void; // <-- added optional callback
}

const TimeRow = (props: TimeRowProps) => {
  const {
    timeRow,
    hoursChange,
    kindChange,
    minutesChange,
    kinds,
    rowIndex,
    addRow,
    deleteRow,
    disableAddButton,
    minusDisabled,
  } = props;
  const [plusDisabled, setPlusDisabled] = useState(true);

  useEffect(() => {
    if (kinds === undefined || disableAddButton) {
      setPlusDisabled(true);
    } else if (kinds.length > 0) {
      setPlusDisabled(false);
    } else {
      setPlusDisabled(true);
    }
  }, [kinds, disableAddButton]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "i") {
        event.preventDefault();

        const currentHours = Math.floor(timeRow.duration / 60);
        const currentMinutes = timeRow.duration % 60;
        let newMinutes = currentMinutes + 15;
        let newHours = currentHours;

        if (newMinutes >= 60) {
          newMinutes = newMinutes - 60;
          newHours = newHours + 1;
        }
        hoursChange(props.rowIndex, newHours);
        minutesChange(props.rowIndex, newMinutes);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [timeRow, hoursChange, minutesChange, props.rowIndex]);

  return (
    <Stack direction="column" sx={{ marginBottom: "10px" }}>
      <Stack
        direction={"row"}
        sx={{ marginBottom: "5px", justifyContent: "flex-end" }}
      >
        {rowIndex === 0 && (
          <Button
            className="blueButton"
            data-testid="time-row-add-button"
            aria-label="Add time row"
            sx={{
              height: "28px",
              minWidth: "20px",
              color: "white !important",
              marginBottom: "10px",
              marginRight: "10px",
              opacity: plusDisabled ? 0.3 : 1,
            }}
            onClick={() => {
              if (!plusDisabled) {
                addRow();
              }
            }}
          >
            <AddCircleIcon sx={{ height: "16px", width: "16px" }} />
          </Button>
        )}
        <FormControl id={"1"} sx={{ marginRight: "10px" }}>
          <select
            className="select-dropdown-menu kind-dropdown"
            value={timeRow.kind_code}
            onChange={(event: any) => {
              kindChange(rowIndex, event.target.value);
              props.markAsChanged?.(); // <- notify change
            }}
          >
            <option value=""></option>
            {kinds?.map(
              (kind: { display_label: string; code: string }, key: number) => (
                <option key={key} value={kind.code}>
                  {kind.display_label}
                </option>
              ),
            )}
          </select>
        </FormControl>
        <FormControl id={"2"}>
          <select
            className="select-dropdown-menu time-select"
            value={Math.floor(timeRow.duration / 60).toString()}
            onChange={(event: any) => {
              hoursChange(rowIndex, Number(event.target.value));
              props.markAsChanged?.(); // <- notify change
            }}
          >
            {Array.from(Array(25).keys()).map((hour: number, key: number) => (
              <option key={key} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </FormControl>
        <Box
          sx={{
            height: "28px",
            lineHeight: "28px",
            background: "#f2f2f2",
            border: "1px solid #cccccc",
            textAlign: "center",
            marginRight: "2px",
            fontSize: "14px",
            paddingLeft: "5px",
            paddingRight: "5px",
          }}
        >
          h
        </Box>
        <FormControl id={"3"}>
          <select
            className="select-dropdown-menu time-select"
            value={(timeRow.duration % 60).toString()}
            onChange={(event: any) => {
              minutesChange(rowIndex, Number(event.target.value));
              props.markAsChanged?.(); // <- notify change
            }}
          >
            {[0, 15, 30, 45].map((minute: number, key: number) => (
              <option key={key} value={minute}>
                {minute.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
        </FormControl>
        <Box
          sx={{
            height: "28px",
            lineHeight: "28px",
            background: "#f2f2f2",
            border: "1px solid #cccccc",
            textAlign: "center",
            marginRight: "2px",
            fontSize: "14px",
            paddingLeft: "5px",
            paddingRight: "5px",
          }}
        >
          m
        </Box>

        <Button
          data-testid={`time-row-delete-button-${rowIndex}`}
          aria-label={`Delete time row ${rowIndex + 1}`}
          onClick={() => {
            if (!minusDisabled) {
              deleteRow(rowIndex);
            }
          }}
          className="deleteButton"
          sx={{
            height: "28px",
            minWidth: "20px",
            color: "white !important",
            marginBottom: "10px",
            marginLeft: "10px",
            opacity: minusDisabled ? 0.3 : 1,
          }}
        >
          <RemoveCircleIcon sx={{ height: "16px", width: "16px" }} />
        </Button>
      </Stack>
      <Stack direction={"row"} sx={{ justifyContent: "flex-end" }}>
        <Box sx={{ marginRight: "10px" }} data-testid="time-row-hours">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((hour, index) => {
            return (
              <Box
                key={index}
                onClick={() => {
                  hoursChange(rowIndex, hour);
                  props.markAsChanged?.(); // <- notify change for number button
                }}
                sx={{
                  padding: "0px",
                  boxShadow: "none",
                  paddingLeft: "6px",
                  paddingRight: "6px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  background:
                    hour === Math.floor(timeRow.duration / 60)
                      ? "#eee !important"
                      : "#bbb !important",
                  border: "1px solid #aaa !important",
                  textShadow:
                    "rgba(255, 255, 255, 0.1) 0px -1px 0px !important",
                  color: "#111 !important",
                  marginRight: "2px",
                  width: "26.4px",
                  height: "26px",
                  lineHeight: "26px",
                  display: "inline-block",
                  textAlign: "center",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {hour}
              </Box>
            );
          })}
        </Box>
        <Box data-testid="time-row-minutes">
          {[0, 15, 30, 45].map((minutes, index) => {
            return (
              <Box
                key={index}
                onClick={() => {
                  minutesChange(rowIndex, minutes);
                  props.markAsChanged?.(); // <- notify change for number button
                }}
                sx={{
                  padding: "0px",
                  boxShadow: "none",
                  paddingLeft: "6px",
                  paddingRight: "6px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  background:
                    minutes === timeRow.duration % 60
                      ? "#eee !important"
                      : "#bbb !important",
                  border: "1px solid #aaa !important",
                  textShadow:
                    "rgba(255, 255, 255, 0.1) 0px -1px 0px !important",
                  color: "#111 !important",
                  marginRight: "2px",
                  width: "26.4px",
                  height: "26px",
                  lineHeight: "26px",
                  display: "inline-block",
                  textAlign: "center",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {minutes.toString().padStart(2, "0")}
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Stack>
  );
};

export default TimeRow;

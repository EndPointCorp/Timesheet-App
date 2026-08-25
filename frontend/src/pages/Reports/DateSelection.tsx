import { FC, MouseEvent, useState } from "react";
import { Box, Popover } from "@mui/material";
import HelpIcon from "../../components/Icons/HelpIcon";
import dayjs, { Dayjs } from "dayjs";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MyDatePicker2 from "../../components/MyDatePicker2";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import React from "react";

const DateSelection: FC<{
  startDate: Dayjs;
  setStartDate: Function;
  endDate: Dayjs;
  setEndDate: Function;
}> = (props) => {
  const { startDate, setStartDate, endDate, setEndDate } = props;
  const [show, setShow] = useState(false);
  const [relative, setRelative] = useState(false);
  const [relativeOption, setRelativeOption] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [disabled, setDisabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    //@ts-ignore
    setAnchorEl(document.getElementById("dateSelection"));
    setDisabled(false);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const displaySnackbar = (openSnackbar: boolean) => {
    setOpenSnackbar(true);
  };
  const closeSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const options: Array<{
    relative: string;
    startDate: Dayjs;
    endDate: Dayjs;
  }> = [
    { relative: "Today", startDate: dayjs(), endDate: dayjs() },
    {
      relative: "Yesterday",
      startDate: dayjs().subtract(1, "day"),
      endDate: dayjs().subtract(1, "day"),
    },
    {
      relative: "Last 7 Days",
      startDate: dayjs().subtract(7, "day"),
      endDate: dayjs(),
    },
    {
      relative: "This Week",
      startDate: dayjs().day(0),
      endDate: dayjs(),
    },

    {
      relative: "Last Week",
      startDate: dayjs().subtract(1, "week").startOf("week"), // Sunday
      endDate: dayjs().subtract(1, "week").endOf("week"), // Saturday
    },
    {
      relative: "Last 30 Days",
      startDate: dayjs().subtract(30, "day"),
      endDate: dayjs(),
    },
    {
      relative: "This Month",
      startDate: dayjs().startOf("month"),
      endDate: dayjs(),
    },
    {
      relative: "Last Month",
      startDate: dayjs().subtract(1, "month").startOf("month"),
      endDate: dayjs().subtract(1, "month").endOf("month"),
    },
    {
      relative: "Last Year",
      startDate: dayjs().subtract(1, "year").startOf("year"),
      endDate: dayjs().subtract(1, "year").endOf("year"),
    },
    {
      relative: "This Year",
      startDate: dayjs().startOf("year"),
      endDate: dayjs(),
    },
    {
      relative: "Last 365 Days",
      startDate: dayjs().subtract(365, "day"),
      endDate: dayjs().subtract(1, "day"),
    },
    {
      relative: "All Time",
      startDate: dayjs("2002/01/01"),
      endDate: dayjs(),
    },
  ];

  const translateToRelative = () => {
    const foundOption = options.find(
      (option) =>
        option.startDate.isSame(startDate, "day") &&
        option.endDate.isSame(endDate, "day"),
    );
    if (foundOption) {
      setRelativeOption(options.indexOf(foundOption));
      setRelative(true);
    }
  };

  const translateToAbsolute = () => {
    const selectedOption = options[relativeOption];
    setStartDate(selectedOption.startDate);
    setEndDate(selectedOption.endDate);
    setRelative(false);
  };

  const handleCheckboxChange = () => {
    if (relative) {
      translateToAbsolute();
    } else {
      translateToRelative();
    }
  };

  const setSelected = (event: { currentTarget: HTMLElement }) => {
    if (event == null) return;
    event.currentTarget?.parentElement
      ?.querySelectorAll(".li")
      .forEach((x) => x.classList.remove("Mui-selected"));
    event.currentTarget.classList.add("Mui-selected");
  };

  const removeSelected = (event: {
    currentTarget: { classList: { remove: (arg0: string) => void } };
  }) => {
    event.currentTarget.classList.remove("Mui-selected");
  };

  const validateDates = (start: Dayjs, end: Dayjs) => {
    if (end.isBefore(start)) {
      setError("End date cannot be earlier than start date.");
      displaySnackbar(openSnackbar);
    } else {
      setError(null); // Clear error if validation passes
    }
  };

  const handleStartDateChange = (newStartDate: Dayjs) => {
    setStartDate(newStartDate);
    validateDates(newStartDate, endDate);
    setRelative(false);
  };

  const handleEndDateChange = (newEndDate: Dayjs) => {
    setEndDate(newEndDate);
    validateDates(startDate, newEndDate);
    setRelative(false);
  };

  return (
    <Box sx={{ display: "flex", marginBottom: "10px" }}>
      <Snackbar
        message="End date cannot be earlier than start date"
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
      ></Snackbar>
      <Box
        sx={{
          width: "21px",
          height: "30px",
          paddingTop: "6px",
          marginRight: "3px",
        }}
      >
        <HelpIcon
          maxWidth={250}
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
                Date Range
              </p>
              <p>select start date and end date to fetch report</p>
            </>
          }
        />
      </Box>
      <Box
        id={"dateSelection"}
        aria-describedby={id}
        sx={{
          width: "365px",
          height: "30px",
          backgroundColor: "white",
          borderColor: "#b3b3b3",
          border: "1px solid #cccccc",
          borderRadius: "2px",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
          color: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          transition: "all 0.15s linear",
        }}
      >
        <Box
          sx={{
            width: "100px",
            fontSize: "11px",
            paddingTop: "5px",
            paddingLeft: "8px",
            color: "#4d4d4d",
            cursor: "pointer",
            display: "block",
            fontWeight: "500",
            backgroundColor: "#ccc",
          }}
          onClick={handleCheckboxChange}
        >
          <label
            style={{
              paddingTop: "2px",
              margin: 0,
              float: "left",
              cursor: "pointer",
            }}
          >
            show dates
          </label>
          <input
            disabled={disabled}
            type="checkbox"
            checked={!relative} // Checked when displaying absolute dates
            onChange={handleCheckboxChange}
          />
        </Box>
        <div
          style={{
            width: "0px",
            height: "0px",
            borderStyle: "solid",
            borderWidth: "14px 0 14px 10px",
            borderColor:
              "transparent transparent transparent rgba(0, 0, 0, 0.2)",
            top: "1px",
            left: "68px",
          }}
          onClick={() => handleClick}
        ></div>
        <p
          style={{
            fontSize: 12,
            textAlign: "center",
            padding: 6,
            margin: 0,
            width: "264px",
          }}
          //@ts-ignore
          onClick={handleClick}
        >
          {relative
            ? options[relativeOption].relative
            : `${startDate.format("YYYY/MM/DD")} - ${endDate.format(
                "YYYY/MM/DD",
              )}`}
          <ArrowDropDownIcon style={{ float: "right", paddingBottom: "4px" }} />
        </p>
      </Box>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        className="transparent-box"
      >
        <Box
          sx={{
            paddingLeft: "0px",
            boxShadow: "0 10px 30px rgba(25, 25, 25, 0.92)",
            border: "none",
            position: "relative",
            zIndex: 1000,
            width: "365px",
            padding: "3px 0 3px 0",
            overflow: "hidden",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
          }}
        >
          {options.map((option, index) => {
            return (
              <p
                key={`${option.relative}_${option.startDate.valueOf()}_${option.endDate.valueOf()}`}
                className="date-option"
                onClick={() => {
                  setStartDate(option.startDate);
                  setEndDate(option.endDate);
                  setRelativeOption(index);
                  setShow(!show);
                  handleClose();
                  setRelative(true);
                }}
              >
                {option.relative}
              </p>
            );
          })}
          <MyDatePicker2
            format="YYYY/MM/DD"
            date={startDate}
            setDate={handleStartDateChange}
            width={180}
            value={startDate}
          />
          <MyDatePicker2
            format="YYYY/MM/DD"
            date={endDate}
            setDate={handleEndDateChange}
            width={180}
            value={endDate}
          />
        </Box>
      </Popover>
    </Box>
  );
};

export default DateSelection;

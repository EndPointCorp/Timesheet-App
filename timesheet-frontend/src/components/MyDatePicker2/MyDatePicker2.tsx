import { DatePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import { FC, useState } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface Props {
  date: Dayjs | null;
  setDate: Function;
  format?: string;
  inputProps?: {};
  InputLabelProps?: {};
  width?: number;
  minWidth?: number;
  value?: any;
  header?: any;
  label?: string;
}

const MyDatePicker2: FC<Props> = (props) => {
  const {
    date,
    setDate,
    format,
    inputProps,
    InputLabelProps,
    value,
    label,
    header,
    width = {},
    minWidth = {},
  } = props;

  const [open, setOpen] = useState(false);

  return (
    <DatePicker
      format={format}
      value={value}
      className="datepicker-inner"
      open={open}
      label={label}
      onClose={() => setOpen(false)}
      slots={{
        openPickerIcon: CalendarMonthIcon,
        leftArrowIcon: ArrowBackIcon,
        rightArrowIcon: ArrowForwardIcon,
      }}
      slotProps={{
        textField: {
          inputProps: inputProps,
          onClick: () => {
            setOpen(true);
          },
          InputLabelProps: InputLabelProps,
        },
        layout: {
          sx: {
            "& .MuiPickersDay-root": {
              color: "white !important",
              backgroundColor: "transparent !important",
              borderRadius: "0px",
              padding: "5px",
              fontSize: "14px",
              margin: "0",
            },
            "& .MuiDateCalendar-root": {
              color: "white !important",
              border: "none",
              backgroundColor: "rgba(0, 0, 0, 0.85) !important",
              padding: "10px",
              fontSize: "15px",
              boxShadow: "0 10px 30px rgba(25, 25, 25, 0.92)",
              width: "300px",
              height: "auto",
            },
            "& .MuiDayCalendar-weekContainer": {
              backgroundColor: "transparent !important",
              margin: "0",
            },
            "& .MuiDayCalendar-weekDayLabel": {
              color: "white",
              borderRadius: "0",
              margin: "0",
              padding: "5px",
              fontSize: "14px",
              fontWeight: "bold",
            },
            "& .MuiPickersSlideTransition-root": {
              fontSize: "15px",
            },
            "& .MuiPickersCalendarHeader-root": {
              color: "white",
              position: "relative",
            },
            "& .MuiPickersArrowSwitcher-root": {
              width: 0,
            },
            "& .MuiPickersCalendarHeader-labelContainer": {
              margin: "auto",
            },
            "& .MuiIconButton-edgeEnd": {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
            },
            "& .MuiIconButton-edgeStart": {
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
            },
            "& .MuiPickersCalendarHeader-switchViewButton": {
              color: "white",
            },

            "& .MuiPickersArrowSwitcher-button": {
              color: "white",
              fontSize: "18px",
            },

            "& .MuiYearCalendar-root": {
              backgroundColor: "white",
              color: "black",
              width: "280px",
            },
            "& .MuiPickersDay-today": {
              border: "none",
            },
            "& .Mui-selected": {
              color: "orange !important",
              fontWeight: "500",
            },
            "& button.MuiButtonBase-root-MuiPickersDay-root:not(.Mui-selected)":
              {
                color: "orange !important",
                border: "none",
                fontWeight: "500",
              },
            "& button:not(.Mui-selected)": {
              border: "none",
            },
          },
        },
      }}
      onChange={(newValue) => {
        newValue && setDate(newValue);
      }}
      sx={{
        width: `${width}px`,
        minWidth: `${minWidth}%`,
        height: "36px",
        marginRight: "1px",
        marginLeft: "1px",
        alignContent: "center",
        "& :hover": {
          cursor: "pointer",
        },
        "& .MuiInputBase-root": {
          backgroundColor: "white",
          opacity: "1",
          fontSize: "12px",
          fontWeight: "500",
          height: "30px",
        },
        "& .MuiInputBase-input": {
          paddingLeft: "6px",
          textAlign: "center",
        },
        "& .MuiInputBase-root:hover": {
          color: "#2795b6",
          textDecoration: "underline",
        },
        "& .MuiIconButton-root": {
          padding: "0px",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          border: "1px solid #ccc",
        },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
          {
            border: "1px solid #b3b3b3",
          },
        "& .MuiYearCalendar-root": {
          display: "block",
        },
      }}
    />
  );
};

export default MyDatePicker2;

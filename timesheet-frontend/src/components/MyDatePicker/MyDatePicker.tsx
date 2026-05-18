import { DatePicker } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import { FC, useState } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

interface MyDatePickerProps {
  date: Dayjs;
  setDate: Function;
  format?: string;
  inputProps?: {};
  placeholder?: string;
  width?: number;
  value?: any;
  label?: string;
}

const MyDatePicker: FC<MyDatePickerProps> = (props) => {
  const {
    date,
    setDate,
    format,
    inputProps,
    placeholder = "Set Joining Date",
    value,
    label,
    width = {},
  } = props;
  console.log(props);
  const [open, setOpen] = useState(false);

  return (
    <DatePicker
      format={format}
      value={value}
      className="datepicker-inner"
      label={label}
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      slotProps={{
        textField: {
          className: "placeholder-text",
          inputProps: inputProps,
          placeholder: placeholder,
          onClick: () => {
            setOpen(true);
          },
        },
      }}
      slots={{
        openPickerIcon: CalendarMonthIcon,
      }}
      onChange={(newValue) => {
        newValue && setDate(newValue);
      }}
      sx={{
        width: `${width}px`,
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
        "& .MuiInputBase-input.MuiOutlinedInput-input.MuiInputBase-inputAdornedEnd::-webkit-input-placeholder":
          {
            opacity: "1",
          },
      }}
    />
    /*
      slotProps={{
        layout: {
          sx: {
            /*
            ".MuiPickersDay-root": {
              color: "white !important",
              backgroundColor: "transparent !important",
              borderRight: "1px solid #ccc",
              borderBottom: "1px solid #ccc",
              padding: "5px",
              fontSize: "14px",
              borderRadius: "0",
              margin: "0",
            },
            ".MuiDateCalendar-root": {
              color: "white !important",
              border: "none",
              backgroundColor: "rgba(0, 0, 0, 0.85) !important",
              padding: "10px",
              fontSize: "15px",
              boxShadow: "0 10px 30px rgba(25, 25, 25, 0.92)",
              width: "250px",
              height: "auto",
            },
            ".MuiDayCalendar-weekContainer": {
              border: "none",
              backgroundColor: "transparent !important",
              margin: "0",
            },
            ".MuiDayCalendar-weekDayLabel": {
              color: "white",
              borderRadius: "0",
              margin: "0",
              borderRight: "1px solid #ccc",
              borderBottom: "1px solid #ccc",
              padding: "5px",
              fontSize: "14px",
            },
            ".MuiPickersSlideTransition-root": {
              minHeight: "180px",
            },
            ".MuiPickersCalendarHeader-root": {
              color: "white",
            },
            
          },
        },
      }}
      */
  );
};

export default MyDatePicker;

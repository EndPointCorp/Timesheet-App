import { Box, Stack } from "@mui/material";
import { PickersDayProps } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";

const days = ["Su", "M", "Tu", "W", "Th", "F", "Sa"];

const MyCalendarHeader = (props: PickersDayProps<Dayjs>) => {
  return (
    <Stack direction={"row"}>
      {days.map((value, key) => {
        return (
          <Box
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.85) !important",
              color: "white",
              width: "32.28px",
              height: "29px",
              marginRight: "1px",
              fontSize: "14px",
              padding: "5px",
            }}
            key={key}
          >
            {value}
          </Box>
        );
      })}
    </Stack>
  );
};

export default MyCalendarHeader;

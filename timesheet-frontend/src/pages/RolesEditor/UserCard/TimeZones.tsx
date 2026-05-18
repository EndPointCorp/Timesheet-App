import { Box, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { FC } from "react";
import Text from "../../../components/EditorsCommon/Text";

interface TimeZonesProps {
  timeZone: string;
  setTimeZone: Function;
  timeZones: Array<string>;
}

const TimeZones: FC<TimeZonesProps> = (props) => {
  const { timeZone, setTimeZone, timeZones } = props;

  return (
    <Box sx={{ margin: "10px 0px", display: "flex" }}>
      <div className="time-zone-text">Time Zone: </div>
      <select
        value={timeZone}
        onChange={(event: any) => {
          setTimeZone(event.target.value);
        }}
        className="select-dropdown-menu time-zone-user-card"
      >
        {timeZones?.map((value: string, key: number) => (
          <option key={key} value={value}>
            {value}
          </option>
        ))}
      </select>
    </Box>
  );
};

export default TimeZones;

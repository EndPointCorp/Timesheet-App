import { Box, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { FC } from "react";
import Text from "../../../components/EditorsCommon/Text";

interface TimeZonesProps {
  timeZone: string;
  setTimeZone: Function;
  timeZones: Array<{ code: string; utc_offset: number }>;
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
        {timeZones?.map((tz: { code: string; utc_offset: number }) => (
          <option key={tz.code} value={tz.code}>
            {`${tz.code} (GMT${tz.utc_offset >= 0 ? "+" : ""}${tz.utc_offset})`}
          </option>
        ))}
      </select>
    </Box>
  );
};

export default TimeZones;

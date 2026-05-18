import { FC, useState } from "react";
import { Input, FormControl } from "@mui/material";
import { Dayjs } from "dayjs";
import DatePicker from "react-date-picker";

interface Props {
  date: Dayjs;
  setDate: Function;
  format?: string;
  inputProps?: {};
  placeholder?: string;
  width?: number;
  height?: number;
  value?: any;
  header?: any;
}

const EndPointDatepicker: FC<Props> = (props) => {
  const {
    date,
    setDate,
    format,
    inputProps,
    placeholder = "Set Joining Date",
    value,
    header,
    width = {},
    height = {},
  } = props;

  const [open, setOpen] = useState(false);

  return (
    <div>
      <input type="date"></input>
    </div>
  );
};

export default EndPointDatepicker;

import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { FC, useState } from "react";
import "./index.css";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import MySwitch from "../../components/MySwitch";
import RedButton from "../../components/MyButton/RedButton";
import BlueButton from "../../components/MyButton/BlueButton";
import workchartHooks from "../../hooks/workchartHooks";
import MyDatePicker2 from "../../components/MyDatePicker2";
import HelpIcon from "../../components/Icons/HelpIcon";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import React from "react";

export interface Transaction {
  author: string;
  author_name: string;
  date: string;
  date_closed: string | null;
  description: string;
  hours: number;
  id: number;
  is_active: boolean;
  mode: string;
  recur_at: string | null;
  recur_mode: string;
}

export interface CreateNewTransactionProps {
  cancel: Function;
  work_chart_id: number;
  transaction?: Transaction;
  createTransaction?: Function;
  updateTransaction?: Function;
}

const CreateNewTransaction: FC<CreateNewTransactionProps> = (props) => {
  const {
    cancel,
    work_chart_id,
    transaction = null,
    createTransaction,
    updateTransaction,
  } = props;
  const [startDate, setStartDate] = useState(
    transaction?.date ? dayjs(transaction?.date) : dayjs().subtract(1, "day"),
  );
  const [endDate, setEndDate] = useState(
    transaction?.date_closed ? dayjs(transaction?.date_closed) : null,
  );
  const [hours, setHours] = useState(transaction?.hours);
  const [mode, setMode] = useState(transaction?.mode || "billable");
  const [description, setDescription] = useState(
    transaction?.description || "",
  );
  const [recurMonthly, setRecurMonthly] = useState(
    transaction?.recur_at ? true : false,
  );
  const [cumulative, setCumulative] = useState(
    transaction?.recur_mode === "cumulative",
  );
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!hours || hours.toString().trim() === "" || Number(hours) === 0) {
      displaySnackbar(openSnackbar);
      return;
    }
    const recur_at = recurMonthly
      ? { day_of_month: 1, hours: 0, minutes: 0 }
      : null;

    if (transaction?.id && updateTransaction) {
      await updateTransaction({
        id: transaction.id,
        hours: Number(hours),
        work_chart_id: work_chart_id,
        date: startDate.format("YYYY-MM-DD"),
        date_closed: endDate?.format("YYYY-MM-DD"),
        description: description,
        mode: mode, // billable | nonbillable (kind code)
        recur_mode: cumulative ? "cumulative" : "zero-out",
        recur_at,
      });
    } else if (createTransaction) {
      await createTransaction({
        hours: Number(hours),
        work_chart_id: work_chart_id,
        date: startDate.format("YYYY-MM-DD"),
        date_closed: endDate?.format("YYYY-MM-DD"),
        description: description,
        kind_code: mode,
        mode: cumulative ? "cumulative" : "zero-out",
        recur_at,
      });
    }

    cancel();
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

  return (
    <Stack direction={"column"}>
      <Snackbar
        message="Hours must be greater than 0"
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
      ></Snackbar>

      <Stack direction={"row"}>
        <Box className="inputfield-name">Date start:</Box>
        <Box style={{ width: "33.3%" }}>
          <MyDatePicker2
            value={startDate}
            date={startDate}
            setDate={setStartDate}
            minWidth={100}
            format="YYYY-MM-DD"
          />
        </Box>
        <Box className="inputfield-name" style={{ paddingLeft: "10px" }}>
          Date end:
        </Box>
        <Box style={{ width: "33.3%" }}>
          <MyDatePicker2
            value={endDate}
            date={endDate}
            setDate={setEndDate}
            minWidth={100}
            format="YYYY-MM-DD"
          />
        </Box>
      </Stack>
      <Stack direction={"row"} sx={{ marginTop: "10px" }}>
        <Box className="inputfield-name">Hours:</Box>
        <Box sx={{ width: "33.3%" }}>
          <input
            type="number"
            value={hours}
            onChange={(event) => setHours(parseFloat(event.target.value))}
            className="new-child-input"
          />
        </Box>
        <Box className="inputfield-name" style={{ paddingLeft: "10px" }}>
          Mode:
        </Box>
        <Box style={{ width: "33.3%" }}>
          <select
            className="select-dropdown-transaction"
            value={mode}
            onChange={(event: any) => {
              setMode(event.target.value);
            }}
          >
            {[
              { label: "Billables Only", value: "billable" },
              { label: "Nonbillables Only", value: "nonbillable" },
            ].map((value, key: number) => (
              <option key={key} value={value.value}>
                {value.label}
              </option>
            ))}
          </select>
        </Box>
      </Stack>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        style={{
          overflow: "hidden",
          overflowWrap: "break-word",
          resize: "horizontal",
          height: "75px",
          backgroundColor: "white",
          border: "1px solid #cccccc",
          WebkitBorderRadius: "2px",
          MozBorderRadius: "2px",
          borderRadius: "2px",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
          color: "rgba(0, 0, 0, 0.75)",
          display: "block",
          fontSize: "14px",
          margin: "0 0 12px 0",
          padding: "6px",
          width: "100%",
          transition: "all 0.15s linear",
          fontFamily: "inherit",
          marginTop: "20px",
        }}
      />
      <MySwitch
        checked={recurMonthly}
        setChecked={setRecurMonthly}
        label={"Recur Monthly:"}
      />
      {recurMonthly && (
        <>
          <HelpIcon
            maxWidth={450}
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
                  Recurring Mode
                </p>
                <p>
                  When set to cumulatively new recurring transaction will add up
                  to the previosuly created ones. When unset, the recurring mode
                  will be set to "zeroing out". In this mode upon each
                  recurrance, previous transactions are being closed.
                </p>
              </>
            }
          />

          <MySwitch
            checked={cumulative}
            setChecked={setCumulative}
            label={"Cumulative?"}
          />
        </>
      )}
      <Stack
        direction="row"
        sx={{ justifyContent: "flex-end", marginBottom: "20px" }}
      >
        <RedButton name="Cancel" icon="" onClick={cancel} />
        <BlueButton name="Save" icon="" onClick={handleSave} />
      </Stack>
    </Stack>
  );
};

export default CreateNewTransaction;

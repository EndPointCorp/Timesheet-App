import React, { useState, useEffect, useRef, FC } from "react";
import { Box, Button, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import WorkChartsSelection from "../Reports/WorkChartsSelection";
import workchartHooks from "../../hooks/workchartHooks";
import { workEntriesHooks } from "../../hooks";
import { TimeSelectionRow } from "./TimeRow";
import TimeRows from "./TimeRows";
import dayjs, { Dayjs } from "dayjs";
import { FeeAttribute } from "../../api/workEntries";
import TextInput from "../../components/TextInput";
import MyDatePicker2 from "../../components/MyDatePicker2";
import { useUserStore } from "../../stores";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import Warning from "../../components/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TextareaAutosize from "@mui/material/TextareaAutosize";

interface Entry {
  id?: number;
  description: string;
  date_performed: string;
  work_chart_id: number;
  work_entry_durations: Array<TimeSelectionRow>;
  work_entry_fees: Array<FeeAttribute>;
}

interface Props {
  entry?: Entry;
  entryId?: number;
}

const NewEntry: FC<Props> = (props) => {
  const { user } = useUserStore();
  const {
    entry = {
      description: "",
      work_chart_id: 2,
      date_performed: dayjs().format("YYYY-MM-DD"),
      work_entry_fees: [{ fee: "0.0" }],
      work_entry_durations: [
        { kind_code: "", duration: 0, createdBy: user?.email, id: 0 },
      ],
    },
    entryId,
  } = props;
  const navigate = useNavigate();
  let { year, month, day } = useParams();
  const isEditing = !!entryId;

  // Convert params to valid numbers (handle undefined cases)
  const parsedYear = year ? parseInt(year, 10) : dayjs().year();
  const parsedMonth = month ? parseInt(month, 10) - 1 : dayjs().month(); // Month is 0-indexed in dayjs
  const parsedDay = day ? parseInt(day, 10) : dayjs().date();

  const [workChartId, setWorkChartId] = useState(entry.work_chart_id);
  const [entryDescription, setEntryDescription] = useState(entry.description);
  // Initialize state with either the params or the default entry date
  const [date, setDate] = useState<Dayjs>(
    day
      ? dayjs(`${parsedYear}-${parsedMonth + 1}-${parsedDay}`)
      : dayjs(entry.date_performed),
  );
    const [hasChildren, setHasChildren] = useState(false);
  const [fee, setFee] = useState(
    entry.work_entry_fees && entry.work_entry_fees[0]
      ? Number(entry.work_entry_fees[0].fee).toFixed(2)
      : "0.00",
  );
  const [rows, setRows] = useState<Array<TimeSelectionRow>>(
    //@ts-ignore
    entry.work_entry_durations,
  );
  const [fees, setFees] = useState<Array<FeeAttribute>>(entry.work_entry_fees);
  const { data: hoursInTheBank } = workEntriesHooks.useGetHoursInTheBank({
    id: workChartId,
  });
  const { data: kinds } = workchartHooks.useGetWorkChartKinds({
    id: workChartId,
  });
  const { mutateAsync: newEntry } = workEntriesHooks.useWorkEntries();

  const { mutateAsync: editEntry } = workEntriesHooks.useEditWorkEntries();

  const goBack = () => {
    // Only ask for confirmation if a change was made
    if (hasChanged) {
      if (!window.confirm("Are you sure? Changes you made will be lost.")) {
        return;
      }
    }
    navigate(-1);
  };

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const closeSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  useEffect(() => {
    if (year && month && day) {
      setDate(dayjs(`${parsedYear}-${parsedMonth + 1}-${parsedDay}`));
    }
  }, [year, month, day, parsedYear, parsedMonth, parsedDay]);

  // Update form fields when entry data changes (e.g., after cache invalidation)
  // useEffect(() => {
  //   if (entry) {
  //     setWorkChartId(entry.work_chart_id);
  //     setEntryDescription(entry.description);
  //     if (!day) { // Only update date if not coming from URL params
  //       setDate(dayjs(entry.date_performed));
  //     }
  //     setFee(
  //       entry.work_entry_fees && entry.work_entry_fees[0]
  //         ? Number(entry.work_entry_fees[0].fee).toFixed(2)
  //         : "0.00"
  //     );
  //     //@ts-ignore
  //     setRows(entry.work_entry_durations || []);
  //     setFees(entry.work_entry_fees || []);
  //   }
  // }, [entry, day]);
  //  commented out for now because it causes issues

  useEffect(() => {
    setFees([{ fee: Number(fee).toFixed(2) }]);
  }, [fee]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {


      // Validate work chart selection

      if (!workChartId || workChartId === 2) {

        alert("Please select a work chart before saving.");

        return;

      }



      // If the selected work chart has children, it means selection is incomplete

      if (hasChildren) {

        alert("Please complete work chart selection before saving");

        return;

      }



    if (isSaving) return; // prevent duplicate save actions
    setIsSaving(true);
    try {
      if (entryId) {
        await editEntry({
          id: entryId,
          work_chart_id: workChartId,
          description: entryDescription,
          date_performed: date.format("YYYY/MM/DD"),
          work_entry_durations_attributes: rows,
          work_entry_fees_attributes: fees,
        });
      } else {
        await newEntry({
          work_chart_id: workChartId,
          description: entryDescription,
          date_performed: date.format("YYYY/MM/DD"),
          work_entry_durations_attributes: rows,
          work_entry_fees_attributes: fees,
        });
      }
      navigate(-1);
    } catch (error: any) {
      if (error?.status === "ERROR" && error?.errors) {
        alert(error.errors.join(", ") + "\nPlease contact #timesheet team");
      } else {
        alert("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === "Enter") {
        event.preventDefault();
        handleSave();
      }
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "w") {
        event.preventDefault();
        workChartRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [entryId, workChartId, entryDescription, date, rows, fees]);

  const inputFocus = (event: { currentTarget: HTMLElement }) => {
    if (event == null) return;
    event.currentTarget?.parentElement
      ?.querySelectorAll(".textarea")
      .forEach((x) => x.classList.remove("description-input"));
    event.currentTarget.classList.add("description-input");
  };

  const workChartRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!entryId && workChartRef.current) {
      workChartRef.current.focus();
    }
    if (entryId && descriptionRef.current) {
      const textarea = descriptionRef.current;
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }
  }, [entryId]);

  const isWorkChartSelected = workChartId && workChartId !== 2;
    


useEffect(() => {

  if (isWorkChartSelected && descriptionRef.current) {

    setTimeout(() => {

      const textarea = descriptionRef.current!;

      textarea.focus();

      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

    }, 0);

  }

}, [workChartId])



  

  useEffect(() => {
    if (isWorkChartSelected && descriptionRef.current) {
      setTimeout(() => {
        const textarea = descriptionRef.current!;
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }, 0);
    }
  }, [workChartId]);

  function getRowColor(hours: number): string {
    if (hours === 0) {
      return "#FF4300";
    } else if (hours > 0 && hours < 16) {
      return "orange";
    } else if (hours >= 17) {
      return "rgb(134, 196, 0)";
    } else {
      return "orange";
    }
  }

  // Store the initial values on the first render
  const initialEntryRef2 = useRef({
    workChartId: entry.work_chart_id,
    entryDescription: entry.description,
    // Format date as a string for comparison
    date: dayjs(entry.date_performed).format("YYYY-MM-DD"),
    // Convert arrays to strings for a basic deep compare
    rows: JSON.stringify(entry.work_entry_durations),
    fees: JSON.stringify(entry.work_entry_fees),
  });

  // Check if any field has changed
  const isChanged = (): boolean => {
    if (workChartId !== initialEntryRef2.current.workChartId) return true;
    if (entryDescription !== initialEntryRef2.current.entryDescription)
      return true;
    if (date.format("YYYY-MM-DD") !== initialEntryRef2.current.date)
      return true;
    if (JSON.stringify(rows) !== initialEntryRef2.current.rows) return true;
    if (JSON.stringify(fees) !== initialEntryRef2.current.fees) return true;
    return false;
  };

  const [hasChanged, setHasChanged] = useState(false);
  const markAsChanged = () => {
    if (!hasChanged) setHasChanged(true);
  };

  const handleWorkChartChange = (id: number) => {
    setWorkChartId(id);
    markAsChanged();
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setEntryDescription(e.target.value);
    markAsChanged();
  };

  const handleDateChange = (newDate: Dayjs) => {
    setDate(newDate);
    markAsChanged();
  };

  const handleRowsChange = (newRows: Array<TimeSelectionRow>) => {
    setRows(newRows);
    markAsChanged();
  };

  return (
    <div>
      <Warning
        width={1000}
        marginTop={20}
        marginBottom={20}
        marginLeft={"auto"}
        marginRight={"auto"}
      />
      <Stack
        direction={"column"}
        sx={{
          width: "560px",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          minHeight: "1000px",
          margin: "auto",
          padding: "15px",
          paddingTop: "12px",
        }}
      >
        <Snackbar
          message="Work entry already exists."
          open={!isSaving && openSnackbar}
          autoHideDuration={6000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
        />

        <WorkChartsSelection
          workChartId={workChartId}
          setWorkChartId={setWorkChartId}
          setHasChildren={setHasChildren}
          showHidden={true}
          marginLeft="0px"
          ref={workChartRef}
        />
        {hoursInTheBank && hoursInTheBank?.length !== 0 && (
          <Stack
            sx={{
              marginTop: "10px",
              marginBottom: "10px",
              height: "40px",
              width: "365px",
              display: "flex",
            }}
            direction={"row"}
          >
            <Box
              sx={{
                backgroundColor: "#ddd !important",
                paddingLeft: "10px !important",
                fontSize: "14px",
                alignItems: "center",
                display: "flex",
                width: "100%",
              }}
            >
              {hoursInTheBank[0].budget_chart_labels.map(
                (value: string, index: number) => {
                  if (index !== 0) {
                    if (
                      index ===
                      hoursInTheBank[0].budget_chart_labels.length - 1
                    ) {
                      return value;
                    } else {
                      return value + " - ";
                    }
                  }
                  return null;
                },
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: `${getRowColor(hoursInTheBank[0].minutes_left / 60)} !important`,
                padding: "0px !important",
                fontSize: "14px !important",
                background: "#EAEAEA",
                verticalAlign: "middle",
                position: "static !important",
              }}
            >
              <Box
                sx={{
                  float: "left",
                  fontSize: "14px !important",
                  width: "0px !important",
                  marginRight: "5px !important",
                  height: "0px !important",
                  borderStyle: "solid !important",
                  borderWidth: "20px 0 20px 10px !important",
                  borderColor:
                    "transparent transparent transparent #ddd !important",
                }}
              >
                &nbsp;
              </Box>
            </Box>
            <Box
              sx={{
                minWidth: "50px !important",
                textAlign: "right",
                paddingRight: "20px !important",
                fontSize: "14px !important",
                position: "relative !important",
                backgroundColor: `${getRowColor(hoursInTheBank[0].minutes_left / 60)} !important`,
                alignItems: "center",
                display: "flex",
                width: "90px !important",
                justifyContent: "flex-end",
              }}
            >
              {(hoursInTheBank[0].minutes_left / 60).toFixed(2)}
              {hoursInTheBank[0].mode !== "billable" && (
                <Box
                  sx={{
                    position: "absolute",
                    width: "30px",
                    height: "30px",
                    background: "rgba(200, 200, 200, 0.9)",
                    borderRadius: "100px",
                    lineHeight: "30px",
                    textAlign: "center",
                    fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
                    fontWeight: "bold",
                    right: "-15px",
                    top: "5px",
                    fontSize: "12px",
                  }}
                >
                  NB
                </Box>
              )}
            </Box>
          </Stack>
        )}
        <Stack direction={"row"} sx={{ marginTop: "10px" }}>
          <MyDatePicker2
            date={date}
            setDate={handleDateChange}
            format="dddd, YYYY-MM-DD"
            value={date}
          />
          <Box sx={{ width: "33.3%", marginLeft: "10px" }}>
            <TextInput value={fee} setValue={setFee} />
          </Box>
          <Box sx={{ width: "33.3%", marginLeft: "10px" }}></Box>
        </Stack>
        <TimeRows
          rows={rows}
          setRows={handleRowsChange}
          kinds={kinds || []}
          workChartId={workChartId}
          isEditing={isEditing}
        />

        <TextareaAutosize
          placeholder="Description"
          value={entryDescription}
          onChange={handleDescriptionChange}
          onFocus={inputFocus}
          ref={descriptionRef}
          style={{
            backgroundColor: "white",
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
            overflow: "auto",
          }}
        />
        <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            className="deleteButton"
            sx={{ width: "120px", height: "30px", textTransform: "none" }}
            onClick={goBack}
          >
            <CancelIcon sx={{ height: "16px" }} />{" "}
            <span style={{ lineHeight: "16px" }}>Cancel</span>
          </Button>

          <Button
            variant="contained"
            className="blueButton"
            sx={{
              width: "120px",
              height: "30px",
              textTransform: "none",
              marginLeft: "10px",
            }}
            onClick={handleSave}
            disabled={
              !date ||
              !entryDescription ||
              entryDescription.trim() === "" ||
              !workChartId ||
              workChartId === 2 ||
              !rows ||
              rows.length === 0 ||
              !rows.every((row) => row.kind_code && row.kind_code.trim() !== "")
            }
          >
            <CheckCircleIcon sx={{ height: "16px", marginRight: "2px" }} />{" "}
            <span style={{ lineHeight: "16px" }}>Save</span>
          </Button>
        </Stack>
      </Stack>
    </div>
  );
};

export default NewEntry;

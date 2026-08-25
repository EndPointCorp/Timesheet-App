import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LeftArrow from "../../components/Icons/LeftArrow";
import dayjs from "dayjs";
import RightArrow from "../../components/Icons/RightArrow";
import { years } from "../../constants";
import { workEntriesHooks } from "../../hooks";
import Entry from "./Entry";
import Table from "./Table";
import Warning from "../../components/Warning";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const Entries = () => {
  let { paramsYear, paramsMonth, paramsDay } = useParams();
  const navigate = useNavigate();
  const [year, setYear] = useState(dayjs().year());
  const [selectedEntry, setSelectedEntry] = useState(0);
  let [month, setMonth] = useState(dayjs().month());
  let [day, setDay] = useState(dayjs().date());
  const { data: entries, refetch } = workEntriesHooks.useGetEntries({
    day: `${year}-${month}-${day}`,
  });

  useEffect(() => {
    setYear(paramsYear ? Number(paramsYear) : 0);
    setMonth(paramsMonth ? Number(paramsMonth) : 0);
    setDay(paramsDay ? Number(paramsDay) : 0);
  }, [paramsDay, paramsMonth, paramsYear]);

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      let date = dayjs(`${year}/${month}/${day}`);
      date = date.add(1, "day");
      navigate(`/entries/${date.year()}/${date.month() + 1}/${date.date()}`);
    }

    if (event.key === "ArrowLeft") {
      let date = dayjs(`${year}/${month}/${day}`);
      date = date.subtract(1, "day");
      navigate(`/entries/${date.year()}/${date.month() + 1}/${date.date()}`);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [year, month, day, navigate]);

  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (!entries || entries.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedEntry((prev) => (prev + 1) % entries.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedEntry(
          (prev) => (prev - 1 + entries.length) % entries.length,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        const entry = entries[selectedEntry];
        if (entry) {
          navigate(`/entries/${entry.id}/edit`);
        }
      }
    };

    window.addEventListener("keydown", handleArrowKeys);
    return () => window.removeEventListener("keydown", handleArrowKeys);
  }, [entries, selectedEntry, navigate]);

  return (
    <Stack direction="column" sx={{ margin: "auto" }}>
      <Box
        className="row"
        sx={{
          backgroundColor: "rgb(238, 238, 238)",
          margin: "auto",
          width: "1000px",
          maxWidth: "100%",
          minWidth: "768px",
          marginBottom: "10px",
        }}
      >
        <Box
          className="boxInsideRow"
          sx={{
            display: "flex",
            width: "459px",
            backgroundColor: "whiteSmoke",
            marginBottom: "10px",
          }}
        >
          <Button
            onClick={() => {
              let date = dayjs(`${year}/${month}/${day}`);
              date = date.add(-1, "day");
              navigate(
                `/entries/${date.year()}/${date.month() + 1}/${date.date()}`,
              );
            }}
          >
            <ArrowBackIcon sx={{ color: "gray" }} />
          </Button>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <FormControl>
              <select
                value={year.toString()}
                className="select"
                data-testid="today-year-select"
                onChange={(event: any) => {
                  navigate(`/entries/${event.target.value}/${month}/${day}`);
                }}
                style={{ width: "102px" }}
              >
                {years.map((value: number, key: number) => (
                  <option key={key} value={value.toString()}>
                    {value.toString()}
                  </option>
                ))}
              </select>
            </FormControl>

            <FormControl>
              <select
                value={month.toString()}
                className="select"
                data-testid="today-month-select"
                onChange={(event: any) => {
                  navigate(`/entries/${year}/${event.target.value}/${day}`);
                }}
                style={{ width: "137px" }}
              >
                {dayjs()
                  .localeData()
                  .months()
                  .map((value: string, key: number) => (
                    <option key={key} value={(key + 1).toString()}>
                      {value}
                    </option>
                  ))}
              </select>
            </FormControl>

            <FormControl>
              <select
                value={day.toString()}
                className="select"
                data-testid="today-day-select"
                onChange={(event: any) => {
                  navigate(`/entries/${year}/${month}/${event.target.value}`);
                }}
                style={{ width: "85px" }}
              >
                {Array.from(
                  Array(
                    dayjs(`${year}-${month}-${day}`).daysInMonth() || 30,
                  ).keys(),
                )
                  .map((num) => num + 1)
                  .map((value: number, key: number) => (
                    <option key={key} value={value.toString()}>
                      {value}
                    </option>
                  ))}
              </select>
            </FormControl>

            <Button
              sx={{ marginLeft: "auto" }} // Push the button to the right
              onClick={() => {
                let date = dayjs(`${year}/${month}/${day}`);
                date = date.add(1, "day");
                navigate(
                  `/entries/${date.year()}/${date.month() + 1}/${date.date()}`,
                );
              }}
            >
              <ArrowForwardIcon sx={{ color: "gray" }} />
            </Button>
          </Box>

          <Box
            sx={{
              backgroundColor: "#ddd",
              fontFamily:
                '"Lato Black", Helvetica, Arial, sans-serif !important',
              float: "left",
              height: "40px",
              lineHeight: "40px",
              fontSize: "12px",
              width: "125px",
              textAlign: "center", // Center the text horizontally
              display: "flex", // Use flexbox for vertical alignment
              alignItems: "center", // Center the text vertically
              justifyContent: "center", // Center the text horizontally
            }}
          >
            <Box
              sx={{
                float: "left",
                width: "0px",
                marginRight: "5px",
                height: "0px",
                borderStyle: "solid",
                borderWidth: "20px 0 20px 10px",
                borderColor: "transparent transparent transparent whiteSmoke",
              }}
            ></Box>
            <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
              {dayNames[dayjs(`${year}/${month}/${day}`).get("day")]}
            </span>
          </Box>
        </Box>
      </Box>

      <Warning
        width={1000}
        marginBottom={20}
        marginLeft={"auto"}
        marginRight={"auto"}
      />

      <Stack
        direction={"row"}
        sx={{
          margin: "auto",
          width: "1000px",
          maxWidth: "100%",
          minWidth: "768px",
        }}
      >
        <Stack direction={"column"} sx={{ padding: "0 15px", width: "66.6%" }}>
          {entries &&
            entries.map(
              (
                entry: {
                  description: string;
                  total_duration: number;
                  kind_code: string;
                  work_chart_label_parts: Array<string>;
                  id: number;
                  fee_total: number;
                },
                index: number,
              ) => {
                return (
                  <Entry
                    key={entry.id}
                    index={index}
                    description={entry.description}
                    total_duration={entry.total_duration}
                    kind_code={entry.kind_code}
                    work_chart_label_parts={entry.work_chart_label_parts}
                    entryId={entry.id}
                    selectedEntry={selectedEntry}
                    setSelectedEntry={setSelectedEntry}
                    refetch={refetch}
                    fees={entry.fee_total}
                  />
                );
              },
            )}
        </Stack>
        <Table
          hours={{
            billable: entries
              ? entries.reduce((a: any, b: any) => {
                  return a + b["total_billable"];
                }, 0)
              : 0,
            nonbillable: entries
              ? entries.reduce((a: any, b: any) => {
                  return a + b["total_nonbillable"];
                }, 0)
              : 0,
            pto: entries
              ? entries.reduce((a: any, b: any) => {
                  return a + b["total_pto"];
                }, 0)
              : 0,
            total: entries
              ? entries.reduce((a: any, b: any) => {
                  return a + b["total_duration"];
                }, 0)
              : 0,
          }}
        />
      </Stack>
    </Stack>
  );
};

export default Entries;

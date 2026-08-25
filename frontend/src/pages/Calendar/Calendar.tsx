import { useEffect, useState, useCallback, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import { PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DayCalendarSkeleton } from "@mui/x-date-pickers/DayCalendarSkeleton";
import "./index.css";
import {
  Box,
  FormControl,
  Link,
  Stack,
  InputLabel,
  Typography,
  Button,
} from "@mui/material";
import localeData from "dayjs/plugin/localeData";
import weekYear from "dayjs/plugin/weekYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import DayCard from "../../components/Cards/DayCard";
import TimeCard from "../../components/Cards/TimeCard";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import HelpIcon from "../../components/Icons/HelpIcon";
import BottomColumns from "./BottomColumns";
import RightArrow from "../../components/Icons/RightArrow";
import LeftArrow from "../../components/Icons/LeftArrow";
import { calendarHooks, teamsHooks } from "../../hooks";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  maximalSelectableDate,
  minimalSelectableDate,
  years,
} from "../../constants";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Team } from "../../types";
import { useUserStore } from "../../stores";
import CircularProgress, {
  circularProgressClasses,
  CircularProgressProps,
} from "@mui/material/CircularProgress";
import React from "react";
import Warning from "../../components/Warning";
import { RemainingHours } from "./RemainingHours";
import useCheckPermissions from "../../hooks/useCheckPermissions";
import { weekData } from "../../types/cards";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

dayjs.extend(localeData);
dayjs.extend(weekYear);
dayjs.extend(weekOfYear);

const today = dayjs();

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

const getCalendarUsers = (
  manager: string | undefined,
  teams: Team[],
): string[] => {
  const allUsersSet = new Set<string>(); // Use a Set to ensure uniqueness

  teams?.forEach((team) => {
    const usersArray = Object.keys(team.users).map((key) =>
      key.replace("user_", ""),
    );

    usersArray.forEach((user) => allUsersSet.add(user)); // Add users to the Set
  });

  return Array.from(allUsersSet).sort(); // Convert Set to array, sort alphabetically, and return
};

const Calendar = () => {
  const isNewFeaturesTester = useCheckPermissions("is_new_features_tester");
  const navigate = useNavigate();
  const { user: currentUser } = useUserStore();
  const {
    data: teams,
    isLoading: isUsersLoading,
    error: getUsersError,
  } = teamsHooks.useTeams();
  let { year: tempYear, month: tempMonth, user } = useParams();
  const year = tempYear === undefined ? dayjs().get("year") : Number(tempYear);
  const month =
    tempMonth === undefined ? dayjs().get("month") + 1 : Number(tempMonth);
  const [isLoading, setIsLoading] = useState(false);
  const { data: calendar } = calendarHooks.useCalendar({
    year,
    month,
    username: user,
  });
  const { data: rows } = calendarHooks.useRows({
    year,
    month,
    username: user,
  });
  const { data: pto } = calendarHooks.usePto({
    username: user, // <-- Pass the selected user here
  });
  const [weekTotals, setWeekTotals] = useState<Array<weekData>>([]);
  const calenderUsers = getCalendarUsers(currentUser?.code, teams);

  const calenderPath = user ? "calendar-user" : "calendar";

  const [isDayCardDisabled, setIsDayCardDisabled] = useState(false);

  const location = useLocation();

  const isUserCalendar = !!user; // True if viewing the user calendar

  useEffect(() => {
    setIsDayCardDisabled(false); // Reset to false when the page is loaded
  }, [user]);

  const handleKeyPress = useCallback(
    (event: { key: any }) => {
      const keyName = event.key;

      if (keyName === "ArrowLeft") {
        const newMonth = month === 1 ? 12 : month - 1;
        const newYear = month === 1 ? year - 1 : year;
        const path = `/${calenderPath}/${newYear}/${newMonth}`;
        const fullPath = user ? `${path}/${user}` : path;
        navigate(fullPath);
      }

      if (keyName === "ArrowRight") {
        const newMonth = month === 12 ? 1 : month + 1;
        const newYear = month === 12 ? year + 1 : year;
        const path = `/${calenderPath}/${newYear}/${newMonth}`;
        const fullPath = user ? `${path}/${user}` : path;
        navigate(fullPath);
      }
    },
    [month, year, user, calenderPath, navigate],
  );

  const ServerDay = (props: PickersDayProps<Dayjs>) => {
    const { day, outsideCurrentMonth } = props;
    const dayTime = calendar
      ? calendar.find((entry: { date: string }) => {
          return entry.date === day.format("YYYY-MM-DD");
        })
      : {};

    return (
      <DayCard
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        hours={dayTime}
        isDisabled={isUserCalendar} // Disable only when viewing the user calendar
      />
    );
  };

  useEffect(() => {
    if (calendar && calendar.length > 0) {
      let weekData: Array<weekData> = [];

      for (let j = 0; j < calendar.length; j += 7) {
        let weekTotal = 0;
        let ptoWeekTotal = 0;
        let nbWeekTotal = 0;
        let bWeekTotal = 0;

        for (let i = 0; i < 7; i++) {
          if (calendar[i + j]) {
            weekTotal += calendar[i + j].time / 60; // Convert minutes to hours
            ptoWeekTotal += calendar[i + j].pto_time / 60;
            nbWeekTotal += calendar[i + j].nonbillable_time / 60;
            bWeekTotal += calendar[i + j].billable_time / 60;
          }
        }

        // Use the last day's date of the week range to determine week number & year
        const lastValidDay = calendar[j + 6]
          ? calendar[j + 6].date
          : calendar[j].date;
        const lastDayObj = dayjs(lastValidDay).endOf("week"); // Ensure it's the last day of the week

        const weekNumber = lastDayObj.week(); // Get week number
        const yearNumber = lastDayObj.year(); // Get year

        weekData.push({
          week: weekNumber,
          year: yearNumber,
          totalHours: weekTotal,
          ptoWeekTotal,
          nbWeekTotal,
          bWeekTotal,
        });
      }

      setWeekTotals(weekData);
    }
  }, [calendar]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress, month, year]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        className="row"
        sx={{
          paddingLeft: "20px",
          backgroundColor: "#EEE",
          margin: "auto",
          maxWidth: "100%",
          width: "1000px",
          marginBottom: "20px",
        }}
      >
        <Box
          className="boxInsideRow"
          sx={{
            display: "flex",
            marginTop: "12px",
            marginBottom: "10px",
          }}
        >
          {calenderUsers.length > 0 && user && (
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel className="input-label-calender-user">
                Calendar for user:
              </InputLabel>
              <select
                value={user}
                className="select select-calender-user"
                onChange={(event: any) => {
                  const selectedUser = event.target.value;
                  if (selectedUser !== user) {
                    setIsDayCardDisabled(true); // Set to true when a new user is selected
                  }
                  navigate(`/${calenderPath}/${year}/${month}/${selectedUser}`);
                }}
              >
                <img
                  className="rights-close-icon"
                  style={{ marginRight: "10px" }}
                  alt=""
                />
                {calenderUsers.map((value) => (
                  <option
                    key={value}
                    value={value}
                    className="user-calendar-drop"
                  >
                    {value.toString()}
                  </option>
                ))}
              </select>
            </FormControl>
          )}

          <Button
            onClick={() => {
              const path = `/${calenderPath}/${year - (month === 1 ? 1 : 0)}/${month === 1 ? 12 : month - 1}`;
              const fullPath = user ? `${path}/${user}` : path;
              navigate(fullPath);
            }}
            id="arrow-left"
          >
            <ArrowBackIcon sx={{ color: "gray" }} />
          </Button>

          <FormControl>
            {/*<InputLabel>Year</InputLabel>*/}
            <select
              value={year.toString()}
              className="select"
              onChange={(event: any) => {
                const path = `/${calenderPath}/${event.target.value}/${month}`;
                const fullPath = user ? `${path}/${user}` : path;
                navigate(fullPath);
              }}
            >
              <img
                className="rights-close-icon"
                style={{ marginRight: "10px" }}
                alt=""
              />
              {years.map((value: number) => (
                <option
                  key={value.toString()}
                  value={value.toString()}
                  className="calendarDrop"
                >
                  {value.toString()}
                </option>
              ))}
            </select>
          </FormControl>
          <FormControl>
            {/*<InputLabel>Month</InputLabel>*/}
            <select
              value={month.toString()}
              className="select"
              onChange={(event: any) => {
                const path = `/${calenderPath}/${year}/${event.target.value}`;
                const fullPath = user ? `${path}/${user}` : path;
                navigate(fullPath);
              }}
            >
              {dayjs()
                .localeData()
                .months()
                .map((value: string, key: number) => (
                  <option
                    key={value}
                    value={(key + 1).toString()}
                    className="calendarDrop calendarSelect"
                  >
                    {value}
                  </option>
                ))}
            </select>
          </FormControl>
          <Button
            onClick={() => {
              const path = `/${calenderPath}/${year + (month === 12 ? 1 : 0)}/${month === 12 ? 1 : month + 1}`;
              const fullPath = user ? `${path}/${user}` : path;
              navigate(fullPath);
            }}
            sx={{
              ...(user ? { marginLeft: "50px" } : {}),
            }}
          >
            <ArrowForwardIcon sx={{ color: "gray" }} />
          </Button>
        </Box>
      </Box>
      <Warning
        width={1000}
        marginBottom={20}
        marginLeft={"auto"}
        marginRight={"auto"}
      />

      <Box sx={{ display: "flex", flexDirection: "row", margin: "auto" }}>
        <HelpIcon
          margin={11}
          maxWidth={450}
          height={20}
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
                The Calendar
              </p>
              <p>Shows the status of worked hours during selected months.</p>
              <b>
                <p>Background colors</p>
              </b>
              <p>
                Days when the required minimum of 8 hours have been worked are
                marked with green background. The ones shown in red are ones
                below 8 hours. The current day is marked with an orange
                background.
              </p>
              <b>
                <p>Stripes</p>
              </b>
              <p>
                Some days can be additionally marked with warning stripes. The
                blue one tells that there's more than one entry created for the
                same work chart. The pink one tells that there's an entry with
                no time entered
              </p>
            </>
          }
        />
        <Stack direction={"column"}>
          <Stack direction={"row"}>
            {calendar && (
              <DateCalendar
                value={dayjs(`${year}-${month}-01`)}
                onChange={(newValue) => {
                  const path = `${calenderPath}/${newValue?.get("year")}/${newValue?.get(
                    "month",
                  )}`;
                  const fullPath = user ? `${path}/${user}` : path;
                  navigate(fullPath);
                }}
                loading={isLoading}
                renderLoading={() => <DayCalendarSkeleton />}
                slots={{
                  day: ServerDay,
                }}
                slotProps={{
                  day: {} as any,
                }}
                showDaysOutsideCurrentMonth
                // disableFuture
                minDate={minimalSelectableDate}
                maxDate={maximalSelectableDate}
                sx={{
                  width: 80 * 7,
                  margin: 0,
                  "& .MuiPickersCalendarHeader-root": {
                    display: "none",
                  },
                  "& .MuiDayCalendar-header": {
                    display: "none",
                  },

                  "&.MuiDateCalendar-root": {
                    maxHeight: "none",
                    height: "auto",
                  },
                  "& .MuiPickersSlideTransition-root": {
                    overflow: "visible",
                  },
                }}
              />
            )}
            <Box
              sx={{
                flexDirection: "column",
                marginRight: 2,
                marginLeft: 1,
                marginTop: "2px",
              }}
            >
              {weekTotals.map((weekData, index) => {
                return <TimeCard key={index} weekData={weekData} />;
              })}
            </Box>
          </Stack>
          {rows && <BottomColumns bottomColumns={rows} />}
        </Stack>
        <Stack direction={"column"}>
          <Stack direction={"row"}>
            {pto && (
              <Grid
                container
                rowSpacing={0}
                columnSpacing={{ xs: 0 }}
                sx={{
                  textAlign: "center",
                  height: 240,
                  width: 130 + 26 + 160,
                  fontSize: 14,
                }}
              >
                <Grid
                  style={{
                    display: "flex",
                    width: 130,
                    height: 40,
                    alignItems: "center",
                  }}
                >
                  <HelpIcon
                    maxWidth={250}
                    margin={11}
                    marginLeft={20}
                    marginRight={20}
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
                          </span>
                          <b> Sick & vacation totals</b>
                        </p>
                        <p>
                          <b>
                            Those values are counted since your anniversary date
                          </b>
                        </p>
                      </>
                    }
                  />
                  {pto.anniversary}
                </Grid>
                <Grid style={{ width: 26 }}></Grid>
                <Grid style={{ width: 60, height: 40 }}>
                  <p>Sick</p>
                </Grid>
                <Grid style={{ width: 100, height: 40 }}>
                  <p>Vacation</p>
                </Grid>
                <Grid className="first-column">
                  <p>
                    {pto.last_aniversary_year}-{pto.last_aniversary_year + 1}
                  </p>
                </Grid>
                <Grid
                  style={{ width: 26, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <div className="triangle"> &nbsp;</div>
                </Grid>
                <Grid
                  style={{ width: 60, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <p style={{ textAlign: "center" }}>{pto.sicks}</p>
                </Grid>
                <Grid
                  style={{
                    width: 100,
                    height: 40,
                    backgroundColor: "#EAEAEA",
                    marginBottom: 3,
                  }}
                >
                  <p>{pto.vacations}</p>
                </Grid>
                <Grid className="first-column">
                  <p>
                    {pto.last_aniversary_year - 1} - {pto.last_aniversary_year}
                  </p>
                </Grid>
                <Grid
                  style={{ width: 26, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <div className="triangle"> &nbsp;</div>
                </Grid>
                <Grid
                  style={{ width: 60, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <p>{pto.last_year_sicks}</p>
                </Grid>
                <Grid
                  style={{
                    width: 100,
                    height: 40,
                    backgroundColor: "#EAEAEA",
                  }}
                >
                  <p>{pto.last_year_vacation}</p>
                </Grid>
                <Grid style={{ width: 130, height: 40 }}>
                  <HelpIcon
                    maxWidth={250}
                    margin={11}
                    float="left"
                    marginLeft={20}
                    marginRight={20}
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
                          <b>Holiday totals</b>
                        </p>
                        <p>
                          <b>
                            This value is counted from the start of the calendar
                            year
                          </b>
                        </p>
                      </>
                    }
                  />
                </Grid>
                <Grid style={{ width: 160, height: 40 }}>
                  <p>Holiday</p>
                </Grid>
                <Grid className="first-column">
                  <p>{today.get("year")}</p>
                </Grid>
                <Grid
                  style={{ width: 26, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <div className="triangle"> &nbsp;</div>
                </Grid>
                <Grid
                  style={{
                    width: 160,
                    height: 40,
                    backgroundColor: "#EAEAEA",
                    marginBottom: 3,
                  }}
                >
                  <p>{pto.holiday}</p>
                </Grid>
                <Grid className="first-column">
                  <p>{today.subtract(1, "year").get("year")}</p>
                </Grid>
                <Grid
                  style={{ width: 26, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <div className="triangle"> &nbsp;</div>
                </Grid>
                <Grid
                  style={{ width: 160, height: 40, backgroundColor: "#EAEAEA" }}
                >
                  <p>{pto.last_year_holiday}</p>
                </Grid>
              </Grid>
            )}
          </Stack>
          {isNewFeaturesTester && !isUserCalendar && (
            <RemainingHours username={user} />
          )}
        </Stack>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          margin: "auto",
          fontSize: 14,
        }}
      ></Box>
    </Box>
  );
};

export default Calendar;

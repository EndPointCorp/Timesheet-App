import { useState } from "react";
import dayjs from "dayjs";
import { Box } from "@mui/material";
import LeftArrow from "../../components/Icons/LeftArrow";
import RightArrow from "../../components/Icons/RightArrow";
import { teamsHooks } from "../../hooks";
import { CardColor, Hours, Team } from "../../types";
import { ZeroHours, theme } from "../../constants";
import Card from "../../components/Cards";
import { Link } from "react-router-dom";
import List from "../../components/List";
import Warning from "../../components/Warning/Warning";

const weekDays = [0, 1, 2, 3, 4, 5, 6];
const cardWidth = 60;
const cardHeight = 70;

const determineWhite = (day: number, index: number): CardColor => {
  if (index % 2 === 0) {
    if (day % 2 === 0) {
      return CardColor.white;
    }
    return CardColor.slightWhite;
  }
  if (day % 2 === 0) {
    return CardColor.slightWhite;
  }
  return CardColor.darkerWhite;
};

const getCardColor = (
  hours: number,
  day: number,
  index: number,
  outsideCurrentMonth: boolean = false,
): CardColor => {
  if (day === 0 || day === 6) {
    return hours > 0 ? CardColor.green : determineWhite(day, index);
  }
  if (day === -1)
    return hours >= 40
      ? CardColor.green
      : outsideCurrentMonth
        ? determineWhite(day, index)
        : CardColor.red;
  return hours >= 8
    ? CardColor.green
    : outsideCurrentMonth
      ? determineWhite(day, index)
      : CardColor.red;
};

const Dashboard = () => {
  const [week, setWeek] = useState(dayjs());
  const [teamToDisplay, setTeamToDisplay] = useState("all");
  const [visibleCalendarTooltip, setVisibleCalendarTooltip] = useState("none");
  const [visibleReportsTooltip, setVisibleReportsTooltip] = useState("none");

  const { data: teams } = teamsHooks.useTeams();
  const { data: totals } = teamsHooks.useTotals(week);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        marginTop: "20px",
      }}
    >
      <Warning
        width={1000}
        marginTop={20}
        marginBottom={20}
        marginLeft={"auto"}
        marginRight={"auto"}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          fontSize: "14px",
          margin: "auto",
          [theme.breakpoints.down("md")]: {
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{ display: "flex", flexDirection: "column", marginRight: "15px" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              height: "57px",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "felx",
                width: "60px",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <LeftArrow
                onClick={() => {
                  setWeek(week.subtract(1, "week"));
                }}
                circle
              />
            </Box>
            <p style={{ width: "481px", textAlign: "center" }}>
              {week.day(0).format("MMM DD YYYY")} -{" "}
              {week.day(6).format("MMM DD YYYY")}
            </p>
            <Box sx={{ width: "60px" }}>
              <RightArrow
                onClick={() => {
                  setWeek(week.add(1, "week"));
                }}
                circle
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              height: "24px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            <Box
              sx={{
                width: "100px",
                height: "24px",
              }}
            ></Box>
            {weekDays.map((element) => (
              <Box
                key={`weekDay_${element}`}
                sx={{
                  width: 60,
                  height: 24,
                  textAlign: "center",
                  padding: "6px",
                  lineHeight: 1,
                }}
              >
                {week.day(element).format("ddd")}
              </Box>
            ))}
            <Box
              sx={{
                width: 60,
                height: 24,
                textAlign: "center",
                padding: "6px",
                lineHeight: 1,
              }}
            >
              Total
            </Box>
            <Box
              sx={{
                width: 60,
                height: 24,
                textAlign: "center",
                padding: "6px",
                lineHeight: 1,
              }}
            >
              Actions
            </Box>
          </Box>
          {(teams || []).map((team: Team) => {
            if (team.display_label === teamToDisplay || teamToDisplay === "all")
              return (
                <Box key={team.code}>
                  <Box
                    sx={{
                      backgroundColor: "#eee",
                      height: "38px",
                      textAlign: "left",
                      padding: "12px",
                      lineHeight: 1,
                    }}
                  >
                    {team.display_label}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      height: "24px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <Box
                      sx={{
                        width: "100px",
                        height: "24px",
                        backgroundColor: "#eee",
                      }}
                    ></Box>
                    {weekDays.map((element) => (
                      <Box
                        key={`date_${element}_${team.code}`}
                        sx={{
                          width: 60,
                          height: 24,
                          textAlign: "center",
                          padding: "6px",
                          lineHeight: 1,
                        }}
                      >
                        {week.day(element).format("M/D")}
                      </Box>
                    ))}
                  </Box>
                  {Object.entries(team.users)
                    .sort((a: Array<string>, b: Array<string>) => {
                      return a[1] < b[1] ? -1 : 1;
                    })
                    .map(([user_key, val], index) => {
                      let totalHours = { ...ZeroHours };
                      return (
                        <Box
                          key={`${team.code}-${user_key}`}
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            background:
                              index % 2 === 0
                                ? "#f9f9f9"
                                : "rgba(244, 244, 244)",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100px",
                              textAlign: "right",
                              height: "72",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "right",
                              padding: "9px 10px",
                              backgroundColor:
                                index % 2 === 1 ? "#f9f9f9" : "white",
                            }}
                          >
                            <span>{val}</span>
                          </Box>
                          {weekDays.map((weekDay) => {
                            const totalsKey = `${
                              team.display_label
                            }-${user_key}-${week
                              .day(weekDay)
                              .format("YYYY-MM-DD")}`;

                            const hours: Hours =
                              totals && totals.hasOwnProperty(totalsKey)
                                ? // @ts-ignore
                                  totals[totalsKey]
                                : ZeroHours;

                            totalHours.total += hours.total;
                            totalHours.billable += hours.billable;
                            totalHours.nonbillable += hours.nonbillable;
                            totalHours.pto += hours.pto;

                            return (
                              <Link
                                key={totalsKey}
                                to={`/reports?report_type=standard&start_date=${week
                                  .day(weekDay)
                                  .format("YYYY-MM-DD")}&end_date=${week
                                  .day(weekDay)
                                  .format(
                                    "YYYY-MM-DD",
                                  )}&work_chart_id=2&roles=${user_key.substring(
                                  5,
                                )}&description=true&show=false&report_enabled=true`}
                                style={{
                                  display: "flex",
                                  textDecoration: "none",
                                }}
                              >
                                <Card
                                  hours={hours}
                                  day={null}
                                  width={cardWidth}
                                  height={cardHeight}
                                  color={getCardColor(
                                    hours.total,
                                    weekDay,
                                    index,
                                    dayjs().isBefore(
                                      week.day(weekDay).add(1, "day"),
                                    ),
                                  )}
                                  marginLeft={0}
                                  smallTextOpacity={1}
                                />
                              </Link>
                            );
                          })}
                          <Card
                            hours={totalHours}
                            day={null}
                            width={cardWidth}
                            height={cardHeight}
                            color={getCardColor(
                              totalHours.total,
                              -1,
                              index,
                              dayjs().isBefore(week.day(6)),
                            )}
                            marginLeft={0}
                            smallTextOpacity={1}
                          />
                          <Box
                            sx={{
                              backgroundColor: "#eee",
                              width: "60px",
                              textAlign: "center",
                              padding: "9px 10px",
                            }}
                          >
                            <div
                              style={{
                                float: "none",
                                lineHeight: "24px",
                                height: "24px",
                                width: "24px",
                                display: "block",
                                margin: "0 auto",
                                color: "#333",
                              }}
                            >
                              <Link
                                to={`/reports?report_type=standard&start_date=${week
                                  .day(0)
                                  .format("YYYY-MM-DD")}&end_date=${week
                                  .day(6)
                                  .format(
                                    "YYYY-MM-DD",
                                  )}&work_chart_id=2&roles=${user_key.substring(
                                  5,
                                )}&description=true&show=false&report_enabled=true`}
                                style={{
                                  textDecoration: "none",
                                  color: "#333",
                                }}
                              >
                                <span
                                  className="icon-doc-text"
                                  onMouseEnter={() => {
                                    setVisibleReportsTooltip(user_key);
                                  }}
                                  onMouseLeave={() => {
                                    setVisibleReportsTooltip("none");
                                  }}
                                ></span>
                                <div
                                  style={{
                                    display:
                                      visibleReportsTooltip === user_key
                                        ? ""
                                        : "none",
                                    zIndex: 1000,
                                    color: "white",
                                    padding: "10px",
                                    position: "absolute",
                                    minWidth: "150px",
                                    maxWidth: "900px",
                                    marginTop: "-4px",
                                    textAlign: "left",
                                    backgroundColor: "black",
                                  }}
                                >
                                  Open the report tool
                                </div>
                              </Link>
                            </div>
                            <Link
                              to={`/calendar-user/${week.get("year")}/${
                                week.get("month") + 1
                              }/${user_key.substring(5)}`}
                              style={{ textDecoration: "none", color: "#333" }}
                            >
                              <span
                                className="icon-calendar-1"
                                onMouseEnter={() => {
                                  setVisibleCalendarTooltip(user_key);
                                }}
                                onMouseLeave={() => {
                                  setVisibleCalendarTooltip("none");
                                }}
                              ></span>
                              <div
                                style={{
                                  display:
                                    visibleCalendarTooltip === user_key
                                      ? ""
                                      : "none",
                                  zIndex: 1000,
                                  color: "white",
                                  padding: "10px",
                                  position: "absolute",
                                  minWidth: "150px",
                                  maxWidth: "900px",
                                  marginTop: "-4px",
                                  textAlign: "left",
                                  backgroundColor: "black",
                                }}
                              >
                                Open the calendar
                              </div>
                            </Link>
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              );
          })}
        </Box>
        <Box sx={{ height: "214px" }}>
          <List
            name={"Teams"}
            list={teams}
            chosenItem={teamToDisplay}
            setChosenItem={setTeamToDisplay}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

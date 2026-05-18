import { FC, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { colors } from "../../../constants";
import "../index.css";
import { DayCardProps } from "../../../types/cards";
import { useNavigate } from "react-router-dom";

const getColor = (day: Dayjs, hours: number) => {
  if (day.day() == 0 || day.day() == 6) {
    if (day.isSame(dayjs(), "day")) return colors.orange;
    else if (day.isBefore(dayjs()) && hours > 0) return colors.green;
    return colors.lightGrey;
  }

  if (day.isSame(dayjs(), "day")) return colors.orange;
  else if (day.isBefore(dayjs())) return hours < 8 ? colors.red : colors.green;
  else return colors.grey;
};

const DayCard: FC<DayCardProps> = (props) => {
  const navigate = useNavigate();
  const { day, outsideCurrentMonth, hours, isDisabled } = props;

  if (hours === undefined) return <div></div>;

  const handleClick = () => {
    if (isDisabled) {
      console.log("DayCard is disabled");
    } else {
      navigate(`/entries/${day.year()}/${day.month() + 1}/${day.date()}`);
      console.log("DayCard is not disabled");
    }
  };

  return (
    <div
      className="card day-card"
      style={{
        width: 76,
        height: 76,
        borderRadius: 0,
        padding: 2,
        backgroundColor: getColor(day, hours.time / 60),
        opacity: outsideCurrentMonth ? 0.3 : 1,
        marginLeft: 2,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
      onClick={handleClick}
    >
      <p
        style={{
          textAlign: "left",
          fontSize: 10,
          opacity: 0.3,
          fontWeight: "bold",
          margin: 0,
          lineHeight: 1.6,
          paddingLeft: 3,
        }}
      >
        {day.date()}
      </p>

      {(day.isBefore(dayjs(), "day") ||
        day.isSame(dayjs(), "day") ||
        (day.isAfter(dayjs(), "day") && hours.time > 0) ||
        hours.has_zero ||
        hours.has_redundant_entries) && (
        <>
          <p
            style={{
              textAlign: "right",
              fontSize: 14,
              margin: 0,
              lineHeight: "22.4px",
              marginTop: -7,
            }}
          >
            {(hours.time / 60).toFixed(2)}
          </p>
          <p className="smallText" style={{ opacity: 1 }}>
            {(hours.billable_time / 60).toFixed(2)}
          </p>
          <p className="smallText">
            {(hours.nonbillable_time / 60).toFixed(2)}
          </p>
          <p className="smallText">{(hours.pto_time / 60).toFixed(2)}</p>
        </>
      )}
      <div
        className="zeroHourIndicator"
        style={{ visibility: hours.has_zero ? "visible" : "hidden" }}
      ></div>
      <div
        className="reduntantEntriesIndicator"
        style={{
          visibility: hours.has_redundant_entries ? "visible" : "hidden",
        }}
      ></div>
    </div>
  );
};

export default DayCard;

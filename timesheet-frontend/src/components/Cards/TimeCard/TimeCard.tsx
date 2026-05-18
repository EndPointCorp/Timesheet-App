import { FC } from "react";
import { colors } from "../../../constants";
import dayjs from "dayjs";
import { TimeCardProps } from "../../../types/cards";
import { Navigate, useNavigate } from "react-router-dom";

const getColor = (week: number, year: number, hours: number) => {
  const currentYear = dayjs().year(); // Get the current year
  const currentWeek = dayjs().week(); // Get the current week number

  // Future weeks (if the year is ahead OR the week is ahead in the same year)
  if (year > currentYear || (year === currentYear && week > currentWeek)) {
    return "#e9e9e9"; // Future weeks
  }

  // Ongoing week (same year & same week)
  if (year === currentYear && week === currentWeek) {
    return colors.orange; // Ongoing week
  }

  // Past weeks
  return hours >= 40 ? colors.green : colors.red;
};

const TimeCard: FC<TimeCardProps> = (props) => {
  const navigate = useNavigate();
  const {
    week,
    totalHours: hours,
    year,
    ptoWeekTotal,
    nbWeekTotal,
    bWeekTotal,
  } = props.weekData;
  return (
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 0,
        padding: 2,
        backgroundColor: getColor(week, year, hours),
        marginLeft: 2,
        marginBottom: 2,
      }}
    >
      <p
        style={{
          textAlign: "right",
          fontSize: 14,
          margin: 0,
          lineHeight: "22.4px",
          marginTop: 9,
        }}
      >
        {hours.toFixed(2)}
      </p>
      <p
        className="smallText"
        style={{
          opacity: 1,
        }}
      >
        {bWeekTotal.toFixed(2)}
      </p>
      <p className="smallText">{nbWeekTotal.toFixed(2)}</p>
      <p className="smallText">{ptoWeekTotal.toFixed(2)}</p>
    </div>
  );
};

export default TimeCard;

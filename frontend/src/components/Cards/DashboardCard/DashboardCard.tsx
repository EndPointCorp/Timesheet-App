import { FC } from "react";
import { colors } from "../../../constants";
import { Hours } from "../../../types";

const getColor = (hours: number, day: number) => {
  return colors.red;
};

const DashboardCard: FC<{ hours: Hours; day: number }> = (props) => {
  const { hours, day } = props;
  const totalHours = hours.pto + hours.billable + hours.nonbillable;
  return (
    <div
      style={{
        width: 60,
        height: 72,
        borderRadius: 0,
        padding: "9px 10px",
        backgroundColor: getColor(totalHours, day),
      }}
    >
      <p
        style={{
          textAlign: "right",
          fontSize: 14,
          margin: 0,
        }}
      >
        {totalHours.toFixed(2)}
      </p>
      <p
        className="smallText"
        style={{
          opacity: 1,
          fontSize: "12px",
        }}
      >
        {hours.billable.toFixed(2)}
      </p>
      <p
        className="smallText"
        style={{
          opacity: 1,
          fontSize: "12px",
        }}
      >
        {hours.nonbillable.toFixed(2)}
      </p>
      <p
        className="smallText"
        style={{
          opacity: 1,
          fontSize: "12px",
        }}
      >
        {hours.pto.toFixed(2)}
      </p>
    </div>
  );
};

export default DashboardCard;

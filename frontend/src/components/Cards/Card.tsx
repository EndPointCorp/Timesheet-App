import { FC } from "react";
import dayjs, { Dayjs } from "dayjs";
import "./index.css";
import { CardColor, CardProps } from "../../types";
import { colors } from "../../constants";

export const getCardColor = (day: Dayjs, hours: number): CardColor => {
  if (day.day() == 0 || day.day() == 6) {
    if (day.isSame(dayjs(), "day")) return CardColor.orange;
    else if (day.isBefore(dayjs()) && hours > 0) return CardColor.green;
    return CardColor.lightGrey;
  }

  if (day.isSame(dayjs(), "day")) return CardColor.orange;
  else if (day.isBefore(dayjs()))
    return hours < 8 ? CardColor.red : CardColor.green;
  else return CardColor.grey;
};

const Card: FC<CardProps> = (props) => {
  const {
    day,
    outsideCurrentMonth = false,
    hours,
    width,
    height,
    showDate = false,
    color,
    smallTextOpacity = 0.3,
    marginLeft = 2,
  } = props;

  return (
    <div
      style={{
        width: width,
        height: "auto",
        borderRadius: 0,
        backgroundColor: colors[color],
        opacity: outsideCurrentMonth ? 0.3 : 1,
        marginLeft: marginLeft,
        padding: "9px 10px",
      }}
    >
      {showDate && day && (
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
      )}
      {((day && dayjs().isAfter(day)) || !day) && (
        <>
          <p
            style={{
              textAlign: "right",
              fontSize: 14,
              margin: 0,
              lineHeight: "18px",
              color: "#333333",
            }}
          >
            {hours.total.toFixed(2)}
          </p>
          <p
            className="smallText"
            style={{
              opacity: 1,
            }}
          >
            {hours.billable.toFixed(2)}
          </p>
          <p
            className="smallText"
            style={{
              opacity: smallTextOpacity,
            }}
          >
            {hours.nonbillable.toFixed(2)}
          </p>
          <p
            className="smallText"
            style={{
              opacity: smallTextOpacity,
            }}
          >
            {hours.pto.toFixed(2)}
          </p>
        </>
      )}
    </div>
  );
};

export default Card;

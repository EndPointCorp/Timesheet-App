import { Dayjs } from "dayjs";
import { Hours } from "./teams";

export type DayCardProps = {
  day: Dayjs;
  outsideCurrentMonth: boolean;
  isDisabled: boolean;
  hours: {
    has_zero: boolean;
    time: number;
    billable_time: number;
    nonbillable_time: number;
    pto_time: number;
    has_entries: boolean;
    has_redundant_entries: boolean;
    date: string;
  };
};

export type RowsProps = {
  year: number;
  month: number;
  total: number;
  billable_total: number;
  nonbillable_total: number;
  pto_total: number;
  difference: number;
  available: number;
};

export type weekData = {
  week: number;
  year: number;
  totalHours: number;
  ptoWeekTotal: number;
  nbWeekTotal: number;
  bWeekTotal: number;
};

export type TimeCardProps = {
  weekData: weekData;
};

export enum CardColor {
  red = "red",
  green = "green",
  orange = "orange",
  grey = "grey",
  lightGrey = "lightGrey",
  slightWhite = "slightWhite",
  white = "white",
  darkerWhite = "darkerWhite",
}

export interface CardProps {
  day: Dayjs | null;
  hours: Hours;
  width: number;
  height: number;
  color: CardColor;
  outsideCurrentMonth?: boolean;
  showDate?: boolean;
  smallTextOpacity?: number;
  marginLeft?: number;
}

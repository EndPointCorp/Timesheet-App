import { createTheme } from "@mui/material";
import { Hours } from "./types";
import dayjs from "dayjs";

export const URL = "/api";

export const minimalSelectableDate = dayjs("2002-01-01");
export const maximalSelectableDate = dayjs().add(1, "y");
export const years = Array.from(
  Array(maximalSelectableDate.diff(minimalSelectableDate, "year") + 1).keys(),
)
  .map((num) => num + 2002)
  .reverse();

export const button = {
  marginRight: "10px",
  display: "inline-block",
  color: "#8797a3",
  borderRadius: "4px !important",
  height: "30px",
  width: "100px",
  cursor: "pointer",
  fontSize: "13px",
  backgroundColor: "gainsboro",
  border: "none",
  padding: "0",
  textAlign: "center",
  textTransform: "none",
  fontWeight: "500",
  "&.Mui-selected, &.Mui-selected:hover": {
    color: "white",
    backgroundColor: "#006DCC",
    WebkitBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
    MsBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
    MozBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
    boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
    backgroundImage: "linear-gradient(to bottom, #0098FF, #04C) !important",
    borderColor: "#04C #04C #002A80 !important",
    height: "23.2px !important",
  },
  "&.Mui-disabled": {
    color: "red",
  },
};

export const ZeroHours: Hours = {
  billable: 0,
  nonbillable: 0,
  pto: 0,
  total: 0,
};

export const colors = {
  black: "#222222",
  lightGrey: "#e9e9e9",
  orange: "#FA0",
  green: "#86C400",
  red: "#FF4300",
  grey: "#dfdfdf",
  white: "#fff",
  lightHover: "#333333",
  slightWhite: "#f9f9f9",
  darkerWhite: "(244, 244, 244)",
  blue: "#0098FF",
};

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: colors.black,
    },
  },
  components: {
    MuiPickersYear: {
      styleOverrides: {
        root: {
          width: "100%",
          height: "25px",
          flexBasis: "100%",
          "& .Mui-selected": {
            color: "black!important",
            backgroundColor: "white!important",
            borderRadius: "0px",
            width: "100%",
          },
          "& :hover": {
            color: "white!important",
            backgroundColor: "blue!important",
            backgroundImage:
              "linear-gradient(to bottom, #0098FF, #04C) !important",
            borderRadius: "0px",
            width: "100%",
          },
          "& .MuiPickersYear-yearButton": {
            marginTop: "0px",
            marginBottom: "0px",
            height: "25px",
          },
        },
      },
    },

    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: colors.white,
          color: colors.black,
          paddingTop: "0px",
          "&.Mui-selected": {
            backgroundColor: colors.blue,
            color: colors.white,
          },
          "&.Mui-selected:hover": {
            backgroundColor: colors.blue,
            color: colors.white,
          },
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          paddingTop: "1px",
          paddingBottom: "1px",
          fontSize: "14px",
          lineHeight: "14pt",
          "&:hover": {
            backgroundColor: "blue!important",
            backgroundImage:
              "linear-gradient(to bottom, #0098FF, #04C) !important",
            color: colors.white,
          },
          "&.calendarDrop": {
            "&.calendarDrop": {
              paddingLeft: "35px",
            },
            "&.Mui-selected": {
              backgroundColor: colors.blue,
              "&.Mui-selected": {
                backgroundColor: "blue!important",
                backgroundImage:
                  "linear-gradient(to bottom, #0098FF, #04C) !important",
                color: colors.white,
              },
              "&.Mui-selected:hover": {
                backgroundColor: colors.blue,
                "&.Mui-selected:hover": {
                  backgroundColor: "blue!important",
                  backgroundImage:
                    "linear-gradient(to bottom, #0098FF, #04C) !important",
                  color: colors.white,
                },
              },
            },
          },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: {
          border: "1px solid #55a4f2",
          cursor: "pointer",
          width: "50px",
          height: "30px",
          borderRadius: "25px",
          transition: "all .5s ease",
          marginTop: "10px",
          "&.Mui-checked": {
            backgroundColor: "blue",
            transform: "translateX(18px)",
          },
        },
        thumb: {
          width: "30px",
          height: "30px",
          marginTop: "-1px",
          marginLeft: "-1px",
          color: "white",
          border: "1px solid #55a4f2",
        },
        track: {
          display: "none",
        },
        switchBase: {
          padding: 0,
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none",
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {},
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        //@ts-ignore
        root: button,
      },
    },
    MuiOutlinedInput: {
      variants: [
        {
          props: { label: "inputText" },
          style: {
            root: {
              width: "365px",
              height: "30px",
              backgroundColor: "white",
              borderColor: "#b3b3b3",
              border: "1px solid #cccccc",
              borderRadius: "2px",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
              color: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              transition: "all 0.15s linear",
            },
          },
        },
        {
          props: { label: "calendarInput" },
          style: {
            root: {
              width: "365px",
              height: "30px",
              backgroundColor: "white",
              borderColor: "#b3b3b3",
              border: "1px solid #cccccc",
              borderRadius: "2px",
              boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
              color: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              transition: "all 0.15s linear",
            },
          },
        },
      ],
    },

    MuiButton: {
      styleOverrides: {
        root: {
          "&.Mui-disabled": {
            color: "white !important",
            opacity: "0.5",
          },
        },
      },
    },
  },
});

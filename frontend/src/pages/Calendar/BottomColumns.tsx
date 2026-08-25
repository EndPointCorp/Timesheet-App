import { FC } from "react";
import dayjs from "dayjs";
import { colors } from "../../constants";
import HelpIcon from "../../components/Icons/HelpIcon";
import { Box } from "@mui/material";
import "./bottomColumns.css";
import { RowsProps } from "../../types/cards";
import { useNavigate } from "react-router-dom";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import "./index.css";

const BottomColumns: FC<{
  bottomColumns: Array<RowsProps>;
}> = (props) => {
  const { bottomColumns } = props;
  const navigate = useNavigate();

  const changeColor = (event: { currentTarget: HTMLElement }) => {
    if (event == null) return;
    event.currentTarget?.parentElement
      ?.querySelectorAll(".p")
      .forEach((x) => x.classList.remove("month-and-year"));
    event.currentTarget.classList.add("month-and-year");
  };

  const colorChangeBack = (event: {
    currentTarget: { classList: { remove: (arg0: string) => void } };
  }) => {
    event.currentTarget.classList.remove("month-and-year");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        margin: 0,
        fontSize: 14,
        marginLeft: "10px",
        marginTop: "10px",
        marginRight: "16px",
        width: "636px",
      }}
    >
      <Box
        className="calendar-lower"
        sx={{
          display: "flex",
          flexDirection: "row",
          marginBottom: "3px",
          height: 36,
          color: "#555",
          textAlign: "right",
        }}
      >
        <div
          style={{
            width: 130,
            paddingLeft: 10,
          }}
        >
          <HelpIcon
            margin={0}
            maxWidth={850}
            textAlign={"left"}
            text={
              <>
                <b>
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
                    Columns legend
                  </p>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      fontSize: 13,
                    }}
                  >
                    <Box sx={{ width: 195, marginRight: 3 }}>
                      <p>Available</p>
                      <p>The number of hours that should be worked.</p>
                    </Box>
                    <Box sx={{ width: 195, marginRight: 3 }}>
                      <p>Billable</p>
                      <p>The number of logged billable hours.</p>
                    </Box>
                    <Box sx={{ width: 195, marginRight: 3 }}>
                      <p>Nonbillable</p>
                      <p>The number of logged nonbillable hours.</p>
                    </Box>
                    <Box sx={{ width: 195, marginRight: 3 }}>
                      <p>PTO </p>
                      <p>
                        The number of logged vacation, sick and comp time hours.
                      </p>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      fontSize: 13,
                    }}
                  >
                    <Box sx={{ width: 195, marginRight: 3 }}>
                      <p>Total</p>
                      <p>The number of sum of logged hours.</p>
                    </Box>
                    <Box sx={{ width: 195, marginRight: 3 }}>
                      <p>Diff</p>
                      <p>
                        The number of hours that still should be worked minus
                        already logged hours.
                      </p>
                    </Box>
                  </Box>
                </b>
              </>
            }
          />
        </div>
        <p
          className="buttom-columns-text column-header"
          style={{
            width: 83.33,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 36,
            margin: 0,
          }}
        >
          Available
        </p>
        <p
          className="buttom-columns-text column-header"
          style={{
            width: 83.33,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 36,
            margin: 0,
          }}
        >
          Billable
        </p>
        <p
          className="buttom-columns-text column-header"
          style={{
            width: 83.33,
            paddingRight: 0,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            height: 36,
            margin: 0,
          }}
        >
          Nonbillable
        </p>
        <p
          className="buttom-columns-text column-header"
          style={{
            width: 83.33,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            height: 36,
            margin: 0,
          }}
        >
          PTO
        </p>
        <p
          className="buttom-columns-text column-header"
          style={{
            width: 83.35,
            paddingRight: 10,
            marginRight: 0,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            height: 36,
            margin: 0,
          }}
        >
          Total
        </p>
        <p
          className="buttom-columns-text column-header"
          style={{
            width: 90,
            paddingRight: 10,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "right",
            height: 36,
            margin: 0,
          }}
        >
          Diff
        </p>
      </Box>
      {bottomColumns.map((row, key) => {
        return (
          <Box
            className="calendar-lower"
            key={key}
            sx={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "#EAEAEA",
              marginBottom: "3px",
              height: 36,
              textAlign: "right",
            }}
          >
            <p
              className="buttom-columns-text month-and-year"
              style={{ fontWeight: "bold", paddingLeft: "10px" }}
              onClick={() => {
                navigate(`/calendar/${row.year}/${row.month}`);
              }}
            >
              {dayjs().localeData().months()[row.month - 1]} {row.year}
            </p>
            <p
              className="buttom-columns-text"
              style={{
                width: 83.33,
                paddingRight: 10,
              }}
            >
              {(row.available / 60).toFixed(2)}
            </p>
            <p
              className="buttom-columns-text"
              style={{
                width: 83.33,
                paddingRight: 10,
              }}
            >
              {(row.billable_total / 60).toFixed(2)}
            </p>
            <p
              className="buttom-columns-text"
              style={{
                width: 83.33,
                paddingRight: 10,
              }}
            >
              {(row.nonbillable_total / 60).toFixed(2)}
            </p>
            <p
              className="buttom-columns-text"
              style={{
                width: 83.33,
                paddingRight: 10,
              }}
            >
              {(row.pto_total / 60).toFixed(2)}
            </p>
            <p
              className="buttom-columns-text"
              style={{
                width: 83.35,
                paddingRight: 10,

                backgroundColor:
                  row.year === dayjs().year() &&
                  row.month === dayjs().month() + 1
                    ? colors.orange
                    : row.difference >= 0
                      ? colors.green
                      : colors.red,
                margin: 0,
                height: "36px",
                paddingTop: "9.5px",
              }}
            >
              {(row.total / 60).toFixed(2)}
            </p>
            <p
              className="buttom-columns-text"
              style={{
                width: 90,
                paddingRight: 10,

                backgroundColor:
                  row.year === dayjs().year() &&
                  row.month === dayjs().month() + 1
                    ? colors.orange
                    : row.difference >= 0
                      ? colors.green
                      : colors.red,

                margin: 0,
                height: "36px",
                paddingTop: "9.5px",
              }}
            >
              {(row.difference / 60).toFixed(2)}
            </p>
          </Box>
        );
      })}
    </Box>
  );
};

export default BottomColumns;

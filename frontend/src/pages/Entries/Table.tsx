import { Box, Stack } from "@mui/material";
import { FC } from "react";
import "./index.css";
import BlueButton from "../../components/MyButton/BlueButton";
import { useLocation, useNavigate } from "react-router-dom";
import { Hours } from "../../types";

interface TableProps {
  hours: Hours;
}

const Table: FC<TableProps> = (props) => {
  const { hours } = props;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Stack direction={"column"}>
      <Box className="entry-table-row" sx={{ background: "white" }}>
        <Box className="entry-table-column1">Billable:</Box>
        <Box
          className="entry-table-column2"
          data-testid="today-total-billable"
        >
          {(hours.billable / 60).toFixed(2)}
        </Box>
      </Box>
      <Box className="entry-table-row">
        <Box className="entry-table-column1">Non-billable:</Box>
        <Box
          className="entry-table-column2"
          data-testid="today-total-nonbillable"
        >
          {(hours.nonbillable / 60).toFixed(2)}
        </Box>
      </Box>
      <Box className="entry-table-row" sx={{ background: "white" }}>
        <Box className="entry-table-column1">PTO:</Box>
        <Box className="entry-table-column2" data-testid="today-total-pto">
          {(hours.pto / 60).toFixed(2)}
        </Box>
      </Box>
      <Box className="entry-table-row" sx={{ marginBottom: "10px" }}>
        <Box
          className="entry-table-column1"
          sx={{
            fontWeight: "bold",
            fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
          }}
        >
          Total:
        </Box>
        <Box
          sx={{
            fontWeight: "bold",
            fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
          }}
          className="entry-table-column2"
          data-testid="today-total-overall"
        >
          {(hours.total / 60).toFixed(2)}
        </Box>
      </Box>
      <BlueButton
        name="New entry"
        icon="icon-edit"
        onClick={() => navigate(`${location.pathname}/new`)}
        width="111px"
        height="35px"
      />
    </Stack>
  );
};

export default Table;

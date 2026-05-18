import { Box, Button, Stack } from "@mui/material";
import { FC, useState } from "react";
import "./index.css";
import CreateNewTransaction from "./CreateNewTransaction";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import workchartHooks from "../../hooks/workchartHooks";

export interface TransactionProps {
  transaction: {
    author: string;
    author_name: string;
    date: string;
    date_closed: string | null;
    description: string;
    hours: number;
    id: number;
    is_active: boolean;
    mode: string;
    recur_at: string | null;
    recur_mode: string;
  };
  workChartId: number;
  deleteTransaction: Function;
  updateTransaction: Function;
}

const Transaction: FC<TransactionProps> = ({
  transaction,
  workChartId,
  deleteTransaction,
  updateTransaction,
}) => {
  const [isEdit, setIsEdit] = useState(false);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction({ id: transaction.id });
    }
  };

  return isEdit ? (
    <Stack
      direction={"column"}
      sx={{
        width: "91.66667%",
        minHeight: "1px",
        padding: "0 15px",
        position: "relative",
        marginTop: "30px",
      }}
    >
      <CreateNewTransaction
        cancel={() => setIsEdit(false)}
        work_chart_id={workChartId}
        transaction={transaction}
        updateTransaction={updateTransaction}
      />
    </Stack>
  ) : (
    <>
      <Stack
        direction={"column"}
        sx={{
          width: "91.66667%",
          minHeight: "1px",
          padding: "0 15px",
          position: "relative",
          marginTop: "30px",
        }}
      >
        <Box
          className="buttons"
          sx={{
            float: "right",
            width: "80px",
            position: "absolute",
            left: "95%",
          }}
        >
          <Button onClick={() => setIsEdit(true)}>
            <EditIcon />
          </Button>
          <Button onClick={handleDelete}>
            <DeleteIcon />
          </Button>
        </Box>
        <Stack direction={"row"}>
          <Box
            sx={{
              lineHeight: "30px",
              fontSize: "12px",
              color: "#999",
              width: "25%",
            }}
          >
            Recur Monthly:
          </Box>
          <Box
            sx={{
              width: "75%",
              padding: "0 15px",
              fontSize: "14px",
              color: "#222222",
              fontStyle: "italic",
            }}
          >
            {transaction.recur_at ? "Yes" : "No"}
          </Box>
        </Stack>
        {transaction.recur_at && (
          <Stack direction={"row"}>
            <Box
              sx={{
                lineHeight: "30px",
                fontSize: "12px",
                color: "#999",
                width: "25%",
              }}
            >
              Recur Mode:
            </Box>
            <Box
              sx={{
                width: "75%",
                padding: "0 15px",
                fontSize: "14px",
                color: "#222222",
              }}
            >
              {transaction.recur_mode === "cumulative"
                ? "Cumulative"
                : "Zeroing out"}
            </Box>
          </Stack>
        )}
        <Stack direction={"row"} sx={{ marginTop: "10px" }}>
          <Box
            sx={{
              lineHeight: "30px",
              fontSize: "12px",
              color: "#999",
              width: "25%",
            }}
          >
            Description:
          </Box>
          <Box
            sx={{
              width: "75%",
              padding: "0 15px",
              fontSize: "14px",
              color: "#222222",
              display: "flex",
              alignItems: "center",
            }}
          >
            {transaction.description}
          </Box>
        </Stack>
      </Stack>
      <Box
        sx={{
          width: "8.33333%",
          minHeight: "1px",
          padding: "0 15px",
          position: "relative",
        }}
      >
        {""}
      </Box>
    </>
  );
};

export default Transaction;

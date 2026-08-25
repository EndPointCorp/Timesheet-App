import { Box, Button, Stack } from "@mui/material";
import { FC, useState } from "react";
import HelpIcon from "../../components/Icons/HelpIcon";
import BlueButton from "../../components/MyButton/BlueButton";
import "./index.css";
import DarkTriangle from "../../components/DarkTriangle";
import LightTriangle from "../../components/LightTriangle/";
import LightTriangleReflected from "../../components/LightTriangleReflected";
import CreateNewTransaction from "./CreateNewTransaction";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import workEntriesHooks from "../../hooks/workEntriesHooks";
import workchartHooks from "../../hooks/workchartHooks";
import Transaction from "./Transaction";

export interface TransactionType {
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
}

const Transactions: FC<{ workChartId: number }> = (props) => {
  const { workChartId } = props;
  const [createNewMode, setCreateNewMode] = useState(false);

  const { data, refetch } = workchartHooks.useGetTransactions({
    id: workChartId,
  });
  const transactions = data as TransactionType[] | undefined;

  const { mutateAsync: deleteTransaction } =
    workchartHooks.useDeleteTransaction();

  const { mutateAsync: createTransaction } =
    workchartHooks.useCreateTransaction();

  const { mutateAsync: updateTransaction } =
    workchartHooks.useUpdateTransaction();

  const cancelNewMode = () => {
    setCreateNewMode(false);
  };

  const handleCreateTransaction = async (newTransaction: any) => {
    await createTransaction(newTransaction);
    refetch();
  };

  const handleUpdateTransaction = async (updatedTransaction: any) => {
    await updateTransaction(updatedTransaction);
    refetch();
  };

  const handleDeleteTransaction = async ({ id }: { id: number }) => {
    await deleteTransaction({ id });
    refetch();
  };

  return (
    <Box
      sx={{
        marginTop: "20px",
        backgroundColor: "rgba(0, 0, 0, 0.03)",
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingBottom: "16px",
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", marginBottom: "16px" }}
      >
        <Box
          sx={{
            width: "66.6%",
            display: "flex",
            alignItems: "center",
            maxWidth: "656.664px",
          }}
        >
          <HelpIcon
            maxWidth={400}
            margin={11}
            text={
              <>
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
                  Transactions
                </p>
                <p>
                  To add a new transaction enter an amount of hours that should
                  be set to transaction. Value can be signed integer only.
                </p>
                <p>
                  To edit a transaction click on the <EditIcon /> icon, set
                  hours amount and then click on the <CheckIcon /> icon to save
                  it.
                </p>
                <p>List is sorted by date, descending.</p>
              </>
            }
          />
          <p style={{ marginTop: "6px" }}>Transactions</p>
        </Box>
        {!createNewMode && (
          <BlueButton
            name="New"
            onClick={() => {
              setCreateNewMode(true);
            }}
            width="33.3%"
            marginRight="0"
          />
        )}
      </Stack>
      {createNewMode && (
        <CreateNewTransaction
          cancel={cancelNewMode}
          work_chart_id={workChartId}
          createTransaction={handleCreateTransaction}
        />
      )}
      {transactions?.map((transaction) => {
        return (
          <Box
            sx={{
              background: "white",
              minHeight: "115px",
              marginBottom: "15px",
              paddingBottom: "10px",
            }}
            key={transaction.id}
          >
            <Box>
              <Box className="transaction-hours">
                <Box className="hours-value">{transaction.hours}</Box>
                <Box className="hours-label">HOURS</Box>
              </Box>
              <Box className="transaction-date-start">
                <Box
                  className="active-indicator"
                  sx={{
                    background: transaction.is_active ? "#86C400" : "#d10606",
                  }}
                ></Box>
                <span style={{ textAlign: "center", fontSize: "14px" }}>
                  {transaction.date}
                </span>
              </Box>
              <DarkTriangle />
              <Box
                className="transaction-date-end"
                sx={{ textAlign: "center", fontSize: "14px" }}
              >
                {transaction.date_closed ? transaction.date_closed : "Now"}
              </Box>
              <LightTriangle />
              <Box
                className="transaction-mode"
                sx={{ fontSize: "14px", textAlign: "center" }}
              >
                {transaction.mode === "billable" ? "Billables" : "Nonbillables"}
              </Box>
              <LightTriangleReflected />
              <Box className="transaction-creator">
                <Box className="name">{transaction.author_name}</Box>
              </Box>
            </Box>

            <Box>
              <Transaction
                transaction={transaction}
                workChartId={workChartId}
                deleteTransaction={handleDeleteTransaction}
                updateTransaction={handleUpdateTransaction}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default Transactions;

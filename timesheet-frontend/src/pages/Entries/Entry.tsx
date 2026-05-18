import { Box, Button, Stack } from "@mui/material";
import "./index.css";
import { workEntriesHooks } from "../../hooks";
import { useNavigate } from "react-router-dom";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface EntryProps {
  id?: number;
  index: number;
  description: string;
  total_duration: number;
  kind_code: string;
  work_chart_label_parts: Array<string>;
  entryId: number;
  selectedEntry: number;
  setSelectedEntry: Function;
  refetch: Function;
  fees: number;
}

const Entry = (props: EntryProps) => {
  const {
    description,
    total_duration,
    kind_code,
    work_chart_label_parts,
    entryId,
    index,
    selectedEntry,
    setSelectedEntry,
    refetch,
    fees,
  } = props;
  const { mutateAsync: deleteEntry } = workEntriesHooks.useDeleteEntry();
  const navigate = useNavigate();

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const displaySnackbar = (openSnackbar: boolean) => {
    setOpenSnackbar(true);
  };
  const closeSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleClick = () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      deleteEntry({ id: entryId });
      displaySnackbar(openSnackbar);
    }
  };

  return (
    <Stack direction={"row"}>
      <Snackbar
        message="Work entry deleted"
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
      ></Snackbar>
      <Box
        className="entry"
        sx={{
          backgroundColor: index % 2 === 0 ? "rgb(249, 249, 249)" : "white",
          width: "120px",
        }}
      >
        {work_chart_label_parts.slice(1, -1).map((label: string) => {
          return (
            <span
              key={label}
              style={{
                display: "block",
                fontSize: "12.32px",
                color: "#333",
                textAlign: "left",
              }}
            >
              {label}
            </span>
          );
        })}
        <b
          style={{
            fontWeight: "bold",
            fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
            display: "block",
            fontSize: "12.32px",
            color: "#333",
            textAlign: "left",
          }}
        >
          {work_chart_label_parts[work_chart_label_parts.length - 1]}
        </b>
      </Box>
      <Box
        className="entry"
        sx={{
          backgroundColor:
            index % 2 === 0 ? "rgb(240, 240, 240)" : "rgb(243, 243, 243)",
          width: "50px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box>{(total_duration / 60).toFixed(2)}</Box>
        {fees > 0 && (
          <Box sx={{ fontSize: "0.8em", color: "#AAA", marginTop: "5px" }}>
            {"$" + fees.toFixed(2)}
          </Box>
        )}
      </Box>
      <Box
        className="entry"
        sx={{
          display: "table-cell",
          textAlign: "left",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          fontSize: "14px",
          backgroundColor: index % 2 === 0 ? "rgb(249, 249, 249)" : "white",
          width: "416px",
        }}
      >
        <span className="kind-info">{kind_code}</span>
        <br />
        {description}
      </Box>
      <Box
        className="entry"
        sx={{
          backgroundColor:
            selectedEntry === index
              ? "rgba(0, 0, 0, 0.1)"
              : index % 2 === 0
                ? "rgb(240, 240, 240)"
                : "rgb(243, 243, 243)",
          minWidth: "47px",
          padding: "9px 6px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "50px",
        }}
        onClick={() => setSelectedEntry(index)}
      >
        <Button
          onClick={() => {
            navigate(`/entries/${entryId}/edit`);
            window.scrollTo(0, 0);
          }}
          sx={{ minWidth: "30px" }}
          data-testid="entry-edit-button"
        >
          <EditIcon />
        </Button>
        <Button
          sx={{ minWidth: "30px" }}
          onClick={handleClick}
          data-testid="entry-delete-button"
        >
          <DeleteIcon />
        </Button>
      </Box>
    </Stack>
  );
};

export default Entry;

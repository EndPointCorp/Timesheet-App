import { FC, useEffect, useState } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import reportsHooks from "../../hooks/reportsHooks";
import RedButton from "../../components/MyButton/RedButton";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import React from "react";
import { Preset } from "./Reports";

const TypeSelection: FC<{
  setType: Function;
  type: string;
  setPreset: Function;
  setPresetIndex: Function;
  presetIndex: string;
  presets: Array<Preset>;
}> = (props) => {
  const { type, setType, setPreset, setPresetIndex, presetIndex, presets } =
    props;

  const { mutateAsync: deletPreset } = reportsHooks.useDeletPreset();

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAlignment: string,
  ) => {
    setType(newAlignment);
  };

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
    if (!presets[Number(presetIndex)]?.id) return;
    if (window.confirm("Are you sure you want to delete this preset?")) {
      deletPreset({ id: presets[Number(presetIndex)]?.id as number });
      displaySnackbar(openSnackbar);
    }
  };

  useEffect(() => {
    if (presets && presets.length > 0) {
      if (presetIndex === "0") {
        setPreset(null);
      } else {
        if (presetIndex === "-1") {
          setPreset(presets[presets.length - 1]);
        } else {
          setPreset(presets[Number(presetIndex)]);
        }
      }
    }
  }, [presetIndex, presets, setPreset]);

  return (
    <Box>
      <Snackbar
        message="Preset deleted"
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
      ></Snackbar>
      <ToggleButtonGroup
        color="primary"
        value={type}
        exclusive
        onChange={handleChange}
      >
        <ToggleButton value="break">Break</ToggleButton>
        <ToggleButton value="billing_at_leaf">Billing at leaf</ToggleButton>
        <ToggleButton value="billing">Billing</ToggleButton>
        <ToggleButton value="by_user">By user</ToggleButton>
        <ToggleButton value="standard">Standard</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ float: "right", display: "flex", alignItems: "center" }}>
        <p
          style={{
            color: "#999",
            fontSize: "12px",
            margin: 0,
            marginRight: "3px",
          }}
        >
          Presets:
        </p>
        {presets && (
          <FormControl>
            <select
              className="select preset-select"
              value={
                presetIndex === "-1"
                  ? (presets.length - 1).toString()
                  : presetIndex
              }
              onChange={(event: any) => {
                setPresetIndex(event.target.value);
              }}
            >
              {presets.map((child: { name: string }, key: number) => (
                <option key={key} value={key.toString()}>
                  {child.name}
                </option>
              ))}
            </select>
          </FormControl>
        )}
        {presetIndex !== "0" && (
          <Button
            variant="contained"
            className="deleteButton"
            onClick={handleClick}
            sx={{
              marginRight: "20px",
              height: "28px",
              padding: "0px",
              minWidth: "40px",
            }}
          >
            <DeleteIcon sx={{ height: "20px" }} />
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TypeSelection;

import { Box, Popover } from "@mui/material";
import React, { FC, useState } from "react";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import RolePicker from "../RolePicker";
import { Right } from "./types";
import { Role, WorkChart } from "../../types";
import WorkChartsPicker from "../WorkChartsPicker";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import HelpIcon from "../Icons/HelpIcon";
import CloseIcon from "@mui/icons-material/Close";
import PopupState, {
  bindTrigger,
  bindPopover,
  InjectedProps,
} from "material-ui-popup-state";

interface RightActionsProps {
  right: Right;
  removeRight: (id: number) => void;
  addTarget: (
    rightId: number,
    newTargetLabel: string,
    ref_obj_pk: number,
    isDirectRight?: boolean,
  ) => void;
}

const RightActions: FC<RightActionsProps> = ({
  removeRight,
  right,
  addTarget,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const addRolesToRight = (selectedRoles: Role[]) =>
    selectedRoles.forEach((role) =>
      addTarget(right.id, role.label, role.id, right.is_direct),
    );
  const addWorkChartsToRight = (selectedWorkChart: WorkChart) =>
    addTarget(
      right.id,
      selectedWorkChart.label,
      selectedWorkChart.id,
      right.is_direct,
    );

  const renderTargetPicker = (target_kind_code: string) => {
    switch (target_kind_code) {
      case "role":
      case "user":
        return <RolePicker addRolesToRight={addRolesToRight} />;
      case "work_chart":
      case "site_mgmt_action":
      case "account":
        return <WorkChartsPicker addWorkChartsToRight={addWorkChartsToRight} />;
      default:
        return "";
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <PopupState variant="popover" popupId="popover">
        {(popupState) => (
          <div>
            {right.target_kind_code !== null && (
              <Box
                {...bindTrigger(popupState)}
                sx={{
                  width: "16px",
                  height: "16px",

                  backgroundPosition: "15px center",
                  backgroundRepeat: "no-repeat",

                  fontSize: "12px",
                  cursor: "pointer",
                }}
                onMouseEnter={handlePopoverOpen}
              >
                <AddBoxIcon
                  sx={{
                    color: "#868e96",
                  }}
                />

                <Popover
                  {...bindPopover(popupState)}
                  id="mouse-over-popover"
                  open={open}
                  anchorEl={anchorEl}
                  onClose={handlePopoverClose}
                  anchorOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "left",
                  }}
                  disableRestoreFocus
                  slotProps={{
                    paper: {
                      onMouseEnter: () => setAnchorEl(anchorEl),

                      sx: {
                        pointerEvents: "auto",
                        width: "400px",
                        backgroundColor: "rgba(0, 0, 0, 0.75)",
                        padding: "5px",
                        borderRadius: "5px",
                      },
                    },
                  }}
                >
                  {renderTargetPicker(right.target_kind_code)}
                </Popover>
              </Box>
            )}
          </div>
        )}
      </PopupState>
      <Box
        sx={{ cursor: "pointer", marginRight: "15px" }}
        style={{
          float: "right",
          height: "24px",
          width: "12px",
          marginLeft: "5px",
        }}
      >
        {right.is_direct ? (
          <CloseIcon
            onClick={() => {
              if (!right.is_direct) return;
              removeRight(right.id);
            }}
            sx={{
              color: "#fb5347",
              height: "20px",
              width: "20px",
              marginLeft: "5px",
              marginTop: "1px",
            }}
          />
        ) : (
          <HelpIcon
            maxWidth={250}
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
                  Indirect Rights
                </p>
                <p>Rights from roles of the user</p>
              </>
            }
            marginLeft={5}
          />
        )}
      </Box>
    </>
  );
};

export default RightActions;

import { Box, Stack } from "@mui/material";
import { FC } from "react";
import { Right, Target } from "./types";
import windowClose from "../../assets/images/window-close.png";
import RightActions from "./RightActions";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpIcon from "../Icons/HelpIcon/HelpIcon";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  right: Right;
  removeRight: (id: number) => void;
  removeTarget: (
    rightId: number,
    targetId: number,
    isDirectRight?: boolean,
  ) => void;
  addTarget: (
    rightId: number,
    newTargetLabel: string,
    ref_obj_pk: number,
    isDirectRight?: boolean,
  ) => void;
}

const RightItem: FC<Props> = ({
  right,
  removeRight,
  removeTarget,
  addTarget,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: "#f1f1f1",
        margin: "5px",
        padding: "7px 13px",
        MsBorderRadius: "4px 4px 4px 4px",
        borderRadius: "4px 4px 4px 4px",
        backgroundPosition: "15px center",
        backgroundRepeat: "no-repeat",
        WebkitBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.2)",
        MsBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.2)",
        MoxBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.2)",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.2)",
        float: "left",
        color: "#868e96",
        fontWeight: "400",
        width: "100%",
        WebkitColumnBreakInside: "avoid",
        pageBreakInside: "avoid",
        fontSize: "13px",
      }}
    >
      <Stack justifyContent="space-between" direction="row" alignItems="center">
        {right.label}
        <Stack direction="row">
          <RightActions
            right={right}
            removeRight={removeRight}
            addTarget={addTarget}
          />
        </Stack>
      </Stack>
      {right.target_kind_code !== null && (
        <Stack direction="column">
          {right.targets.map((target: Target) => {
            return (
              <Box
                key={target.id}
                sx={{
                  backgroundColor: "#E3E3E3",
                  margin: "5px 0px",
                  padding: "3px 5px 3px 5px",
                  borderRadius: "4px 4px 4px 4px",
                  backgroundPosition: "15px center",
                  backgroundRepeat: "no-repeat",
                  boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.2)",
                  float: "left",
                  color: "#868e96",
                  fontWeight: "normal",
                  fontSize: "12px",
                  width: "100%",
                }}
              >
                {target.label}
                <CloseIcon
                  sx={{
                    color: "#868e96",
                    cursor: "pointer",
                    float: "right",
                    height: "15px",
                    marginTop: "2px",
                  }}
                  onClick={() => {
                    removeTarget(right.id, target.id, right.is_direct);
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default RightItem;

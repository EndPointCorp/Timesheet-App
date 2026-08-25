import { FC, MouseEventHandler } from "react";
import { Box } from "@mui/material";
import "../index.css";
import Circle from "../Circle";

const LeftArrow: FC<{ onClick: MouseEventHandler; circle: boolean }> = (
  props,
) => {
  const { onClick, circle } = props;
  if (circle)
    return (
      <Circle>
        <Box style={{ display: "flex" }} onClick={onClick}>
          <span className="icon-left arrow" />
        </Box>
      </Circle>
    );
  else
    return (
      <Box onClick={onClick}>
        <span className="icon-left arrow"></span>
      </Box>
    );
};

export default LeftArrow;

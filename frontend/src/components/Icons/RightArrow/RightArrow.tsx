import { FC, MouseEventHandler } from "react";
import { Box } from "@mui/material";
import "../index.css";
import Circle from "../Circle";

const RightArrow: FC<{ onClick: MouseEventHandler; circle: boolean }> = (
  props,
) => {
  const { onClick, circle } = props;
  if (circle)
    return (
      <Circle>
        <Box onClick={onClick}>
          <span className="icon-right arrow" />
        </Box>
      </Circle>
    );
  else
    return (
      <Box onClick={onClick}>
        <span className="icon-right arrow"></span>
      </Box>
    );
};

export default RightArrow;

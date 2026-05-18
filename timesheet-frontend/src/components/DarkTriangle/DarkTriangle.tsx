import { Box } from "@mui/material";
import React from "react";

const DarkTriangle = () => {
  return (
    <Box
      sx={{
        float: "left",
        fontSize: "14px !important",
        width: "0px !important",
        marginRight: "5px !important",
        height: "0px !important",
        borderStyle: "solid !important",
        borderWidth: "20px 0 20px 10px !important",
        borderColor: "transparent transparent transparent #d6d6d6 !important",
        zIndex: "1",
        position: "relative",
      }}
    ></Box>
  );
};

export default DarkTriangle;

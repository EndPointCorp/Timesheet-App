import { Box } from "@mui/material";

const LightTriangleReflected = () => {
  return (
    <Box
      sx={{
        float: "left",
        fontSize: "14px !important",
        width: "0px !important",
        marginLeft: "5px !important",
        height: "0px !important",
        borderStyle: "solid !important",
        borderWidth: "20px 10px 20px 0px !important",
        borderColor: "transparent #eeeeee transparent transparent !important",
        right: "-1px",
        position: "relative",
      }}
    ></Box>
  );
};

export default LightTriangleReflected;

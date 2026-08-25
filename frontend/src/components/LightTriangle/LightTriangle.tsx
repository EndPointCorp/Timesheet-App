import { Box } from "@mui/material";

const LightTriangle = () => {
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
        borderColor: "transparent transparent transparent #eee !important",
      }}
    ></Box>
  );
};

export default LightTriangle;

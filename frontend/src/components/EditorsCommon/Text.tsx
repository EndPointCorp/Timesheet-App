import { Box } from "@mui/material";

const Text = (props: { text: string }) => {
  const { text } = props;
  return (
    <Box
      sx={{
        color: "#899DB0",
        padding: "5px 0px",
        fontSize: "12px",
        minWidth: "60px",
      }}
    >
      {text}
    </Box>
  );
};

export default Text;

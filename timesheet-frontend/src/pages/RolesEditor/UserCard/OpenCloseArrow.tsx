import { Box } from "@mui/material";
import { FC } from "react";
import upTriangle from "../../../assets/images/up-triangle.png";

interface Props {
  opened: boolean;
  setOpened: (value: boolean) => void;
}

const OpenCloseArrow: FC<Props> = ({ opened, setOpened }) => {
  return (
    <Box
      sx={{
        backgroundColor: "white",
        cursor: "pointer",
        textAlign: "center",
        width: "626px",
        height: "20px",
        marginLeft: "-10px",
        marginBottom: "-10px",
      }}
      onClick={() => {
        setOpened(!opened);
      }}
    >
      <img
        className={opened ? "up-arrow-icon" : "down-arrow-icon"}
        src={upTriangle}
      />
    </Box>
  );
};

export default OpenCloseArrow;

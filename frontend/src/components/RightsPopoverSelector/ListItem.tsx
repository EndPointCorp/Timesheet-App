import { Box } from "@mui/material";
import { FC, memo } from "react";
import { RightType } from "../EditorsCommon/types";

interface Props {
  handleClick: (listItem: RightType) => void;
  listItem: RightType;
}

const ListItem: FC<Props> = ({ handleClick, listItem }) => {
  const onClick = () => {
    handleClick(listItem);
  };

  return (
    <Box
      sx={{
        cursor: "pointer",
        color: "#707274",
        fontSize: "12px",
        fontWeight: "bold",
        borderRadius: "4px",
        backgroundColor: "#F1F1F1",
        padding: "2px 20px",
        display: "block",
        minWidth: "100px",
        textAlign: "center",
        float: "left",
        margin: "4px 4px",
        fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
      }}
      onClick={onClick}
    >
      {listItem.label}
    </Box>
  );
};

export default memo(ListItem);

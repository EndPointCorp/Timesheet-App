import { Box } from "@mui/material";
import { FC, memo } from "react";
import {
  RolesEditorGroup,
  RolesEditorTeam,
  isGroup,
} from "../EditorsCommon/types";

interface Props {
  handleClick: (listItem: RolesEditorGroup | RolesEditorTeam) => void;
  listItem: RolesEditorGroup | RolesEditorTeam;
  type: "group" | "team";
}

const PopoverSelectorListItem: FC<Props> = ({
  handleClick,
  listItem,
  type,
}) => {
  const onClick = () => {
    handleClick(listItem);
  };

  return (
    <Box
      sx={{
        cursor: "pointer",
        color: "#707274",
        fontSize: "12px",
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
      {isGroup(listItem) ? listItem.label : listItem.display_label}
    </Box>
  );
};

export default memo(PopoverSelectorListItem);

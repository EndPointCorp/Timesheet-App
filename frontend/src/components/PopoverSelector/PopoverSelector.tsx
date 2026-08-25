import { Box, Popover } from "@mui/material";
import GreyPlusIconImage from "../../assets/images/grey-plus-icon.png";
import { FC, useState } from "react";
import PopoverSelectorListItem from "./PopoverSelectorListItem";
import {
  Groups,
  RolesEditorGroup,
  RolesEditorTeam,
} from "../EditorsCommon/types";
import AddBoxIcon from "@mui/icons-material/AddBox";

interface Props {
  list: Array<RolesEditorGroup | RolesEditorTeam>;
  type: "group" | "team";
  handleClick: (listItem: RolesEditorGroup | RolesEditorTeam) => void;
}

const PopoverSelector: FC<Props> = (props) => {
  const { list, type, handleClick } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        display: "table",
        width: "21px",
        height: "21px",
        marginTop: "4px",
        float: "inherit",

        backgroundPosition: "15px center",
        backgroundRepeat: "no-repeat",

        fontSize: "12px",
      }}
      onMouseEnter={handlePopoverOpen}
      onMouseLeave={handlePopoverClose}
    >
      <AddBoxIcon
        sx={{
          color: "#868e96",
        }}
      />
      <Popover
        id="mouse-over-popover"
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        slotProps={{
          paper: {
            onMouseEnter: () => setAnchorEl(anchorEl),
            onMouseLeave: handlePopoverClose,
            sx: {
              pointerEvents: "auto",
              width: "400px",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              padding: "5px",
              borderRadius: "5px",
            },
          },
        }}
      >
        {list.map((listItem: RolesEditorGroup | RolesEditorTeam) => (
          <PopoverSelectorListItem
            handleClick={handleClick}
            listItem={listItem}
            type={type}
            key={listItem.code}
          />
        ))}
      </Popover>
    </Box>
  );
};

export default PopoverSelector;

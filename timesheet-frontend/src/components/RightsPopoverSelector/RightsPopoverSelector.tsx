import React, { FC, useState } from "react";
import ListItem from "./ListItem";
import { RightType } from "../EditorsCommon/types";
import { Box, Popover } from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import PopupState, {
  bindTrigger,
  bindPopover,
  InjectedProps,
} from "material-ui-popup-state";
import Typography from "@mui/material/Typography";

interface Props {
  list: Array<RightType>;
  handleClick: (listItem: RightType) => void;
}

const RightsPopoverSelector: FC<Props> = (props) => {
  const { list, handleClick } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <PopupState variant="popover" popupId="popover">
      {(popupState) => (
        <div>
          <Box
            {...bindTrigger(popupState)}
            sx={{
              width: "21px",
              height: "21px",
              margin: "4px",
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
              {...bindPopover(popupState)}
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
              {list
                ?.sort((a, b) => a.label.localeCompare(b.label))
                .map((listItem: RightType) => (
                  <ListItem
                    handleClick={handleClick}
                    listItem={listItem}
                    key={listItem.code}
                  />
                ))}
            </Popover>
          </Box>
        </div>
      )}
    </PopupState>
  );
};

export default RightsPopoverSelector;

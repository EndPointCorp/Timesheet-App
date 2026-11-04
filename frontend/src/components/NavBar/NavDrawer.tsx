import React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Link } from "react-router-dom";
import { useUserStore } from "../../stores";
import useConfirmedLogout from "../../hooks/useConfirmedLogout";
import LogoutFailedSnackbar from "./LogoutFailedSnackbar";
import useSettingsMenu from "../../hooks/useSettingsMenu";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

const pages = [
  { name: "Calendar", link: "/", icon: "icon-calendar-1" },
  { name: "Today", link: "/today", icon: "icon-calendar-alt" },
  { name: "New Entry", link: "/today/new", icon: "icon-edit" },
];

export default function NavDrawer() {
  const settings = useSettingsMenu();
  const [open, setOpen] = React.useState(false);

  const closeNavDrawer = (reason: "backdropClick") => {
    setOpen(false);
  };

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const { user } = useUserStore();
  const {
    logout: handleLogout,
    failed: logoutFailed,
    dismiss: dismissLogoutFailed,
  } = useConfirmedLogout();

  const DrawerList = (
    <Box role="presentation">
      <List
        sx={{
          backgroundColor: "#222222",
          color: "white",
          borderTop: "1px solid black",
          boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
        }}
      >
        {pages.map((page) => (
          <ListItem
            key={page.name}
            className="navMenuItem"
            sx={{
              borderBottom: "1px solid black",
              boxShadow: "0 1px 1px rgba(255, 255, 255, 0.1)",
            }}
          >
            <Link
              to={page.link}
              className="navLinkText linkWidth"
              onClick={toggleDrawer(false)}
            >
              <span className={page.icon}></span>
              {page.name}
            </Link>
          </ListItem>
        ))}

        <Accordion
          sx={{
            backgroundColor: "#222222",
            color: "white",
            borderBottom: "1px solid black",
            boxShadow:
              "0 1px 1px rgba(255, 255, 255, 0.1), inset 0px 1px 0px rgba(255, 255, 255, 0.1)",
          }}
        >
          <AccordionSummary
            aria-controls="panel1-content"
            id="panel1-header"
            expandIcon={null}
          >
            Settings <ArrowDropDownIcon />
          </AccordionSummary>
          <AccordionDetails sx={{ paddingTop: "0px", paddingBottom: "0px" }}>
            <List
              sx={{
                backgroundColor: "#222222",
                color: "white",
              }}
            >
              {settings.map((setting) => (
                <ListItem
                  key={setting.name}
                  className="navMenuItem"
                  sx={{ paddingTop: "3px", paddingBottom: "3px" }}
                >
                  <Link
                    to={setting.link}
                    className="navLinkText linkWidth"
                    onClick={toggleDrawer(false)}
                  >
                    <span className={setting.icon}></span>
                    {setting.name}
                  </Link>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
        <ListItem className="navMenuItem">
          <Link to="/" className="emailText" onClick={toggleDrawer(false)}>
            {user?.email}
          </Link>
        </ListItem>
        <Divider flexItem className="drawerDivider" />
        <ListItem className="navMenuItem">
          <Link to="/" className="navLinkText" onClick={handleLogout}>
            <span className="icon-off"></span>Logout
          </Link>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <div>
      <Button
        onClick={toggleDrawer(true)}
        sx={{
          color: "white",
          position: "fixed",
          right: "0",
          top: "0",
          display: { xs: "flex", md: "none" },
        }}
      >
        <ArrowDropDownIcon fontSize="large" />
      </Button>
      <Drawer
        open={open}
        anchor="top"
        onClose={closeNavDrawer}
        transitionDuration={500}
      >
        {DrawerList}
      </Drawer>
      <LogoutFailedSnackbar open={logoutFailed} onClose={dismissLogoutFailed} />
    </div>
  );
}

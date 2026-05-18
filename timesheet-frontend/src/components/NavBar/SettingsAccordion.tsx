import * as React from "react";
import Accordion from "@mui/material/Accordion";

import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import { Link } from "react-router-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Divider from "@mui/material/Divider";

const settings = [
  { name: "Roles editor", link: "/users-editor", icon: "icon-group" },

  {
    name: "Edit work charts",
    link: "/work_charts/editor",
    icon: "icon-flow-tree",
  },
  { name: "Reports", link: "/reports", icon: "icon-doc-text" },

  { name: "Switch role", link: "/", icon: "icon-flow-cross" },
  { name: "Create user", link: "/create_user", icon: "icon-user-plus" },
  { name: "User calendar", link: "/calendar-user", icon: "icon-calendar-inv" },
];

export default function SettingsAccordion() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <div>
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
                  className="navLinkText"
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
    </div>
  );
}

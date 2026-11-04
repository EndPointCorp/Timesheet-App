import * as React from "react";
import { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import { Link, useNavigate } from "react-router-dom";
import { Button, CssBaseline, MenuList } from "@mui/material";
import "./NavBar.css";
import endpointLogo from "../../assets/images/endpointLogo.png";
import cancelIcon from "../../assets/images/cancel-white.png";
import Fade from "@mui/material/Fade";
import { useUserStore } from "../../stores";
import Grid from "@mui/material/Unstable_Grid2";
import { usersHooks } from "../../hooks";
import useConfirmedLogout from "../../hooks/useConfirmedLogout";
import LogoutFailedSnackbar from "./LogoutFailedSnackbar";
import Divider from "@mui/material/Divider";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import IconButton from "@mui/material/IconButton";
import NavDrawer from "./NavDrawer";
import useCheckPermissions from "../../hooks/useCheckPermissions";
import useSettingsMenu from "../../hooks/useSettingsMenu";
import LoadingSpinner from "../LoadingSpinner";
import useLoadingStore from "../../stores/useLoadingStore";

const pages = [
  { name: "Calendar", link: "/", icon: "icon-calendar-1" },
  { name: "Today", link: "/today", icon: "icon-calendar-alt" },
  { name: "New Entry", link: "/today/new", icon: "icon-edit" },
];

const NavBar = () => {
  const navigate = useNavigate();
  const isManager = useCheckPermissions("is_manager");
  const settings = useSettingsMenu();

  const { mutateAsync: switchRole } = usersHooks.useSwichRole();
  const { setIsLoading } = useLoadingStore();

  const { isLoading: globalIsLoading } = useLoadingStore();

  const { user } = useUserStore();
  const {
    logout: handleLogout,
    isLoggingOut,
    failed: logoutFailed,
    dismiss: dismissLogoutFailed,
  } = useConfirmedLogout();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    if (anchorEl !== event.currentTarget) {
      setAnchorEl(event.currentTarget);
    }
  }

  function handleClose() {
    setAnchorEl(null);
  }

  const [anchorNav, setAnchorNav] = React.useState<null | HTMLElement>(null);

  function openMenu(event: React.MouseEvent<HTMLElement>) {
    if (anchorNav !== event.currentTarget) {
      setAnchorNav(event.currentTarget);
    }
  }

  function closeMenu() {
    setAnchorNav(null);
  }

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(
    null,
  );
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const setSelected = (event: { currentTarget: HTMLElement }) => {
    if (event == null) return;
    event.currentTarget?.parentElement
      ?.querySelectorAll(".li")
      .forEach((x) => x.classList.remove("Mui-selected"));
    event.currentTarget.classList.add("Mui-selected");
  };

  const removeSelected = (event: {
    currentTarget: { classList: { remove: (arg0: string) => void } };
  }) => {
    event.currentTarget.classList.remove("Mui-selected");
  };

  const handleCancelClick = async (e: any) => {
    e.stopPropagation(); // Prevents the Button's click event from being triggered
    setIsLoading(true);
    try {
      await switchRole(user?.email || "");
      navigate("/");
    } catch (_err) {}
  };

  const open = Boolean(anchorEl);

  const handleClickTwo = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseTwo = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      color="primary"
      sx={{ zIndex: "1001" }}
      className="no-print"
    >
      <CssBaseline />

      <Toolbar variant="dense" sx={{ minHeight: "45px" }}>
        {globalIsLoading && <LoadingSpinner />}

        <Button
          sx={{ my: 0, color: "red", display: "block", marginLeft: "40px" }}
          className="navLinkLogo"
        >
          <Link to={isManager ? "/dashboard" : "/"} className="logo">
            <img
              src={endpointLogo}
              style={{ height: "26px", width: "124px" }}
            />
          </Link>
        </Button>

        <NavDrawer />

        <Divider
          orientation="vertical"
          flexItem
          className="divider"
          sx={{ display: { xs: "none", md: "flex" } }}
        />
        <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
          <Grid container spacing={0.5}>
            {pages.map((page) => (
              <Grid key={page.name} className="navButton navLink">
                <Button
                  key={`${page.name}_link`}
                  sx={{ my: 0, color: "white", display: "block" }}
                  component={Link}
                  to={page.link}
                >
                  <span className={page.icon}></span>
                  {page.name}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          className="divider"
          sx={{ display: { xs: "none", md: "flex" } }}
        />

        <div className="dropdown navLink">
          <Button
            className="dropbtn "
            endIcon={<ArrowDropDownIcon />}
            sx={{
              color: "white",
              textTransform: "none",
              fontFamily: "Lato",
              fontSize: "14px",
              fontWeight: "600",
              display: { xs: "none", md: "inline-flex" },
            }}
          >
            Settings
          </Button>

          <div className="dropdown-content">
            {settings.map((setting) => (
              <MenuItem
                key={setting.name}
                onClick={handleClose}
                style={{
                  marginTop: "4px",
                  marginBottom: "4px",
                  paddingRight: "0px",
                  paddingLeft: "0px",
                  width: "157.2px",
                }}
                className="settingsLink"
              >
                <Link to={setting.link} className="linkWidth">
                  <span
                    className={setting.icon}
                    style={{ marginRight: "3px", marginLeft: "10px" }}
                  ></span>
                  {setting.name}
                </Link>
              </MenuItem>
            ))}
          </div>
        </div>
        <Divider
          orientation="vertical"
          flexItem
          className="divider"
          sx={{ display: { xs: "none", md: "flex" } }}
        />
        <Button
          sx={{ my: 0, color: "white", display: { xs: "none", md: "block" } }}
          className="navLink"
          onClick={() => navigate("/switch-role")}
        >
          {user?.as ? (
            <>
              <span className="emailText">
                {user?.email}{" "}
                <span className="as-user">as {user.as.split(":")[1]} </span>
              </span>

              <img
                src={cancelIcon}
                className="close-icon"
                alt="Cancel"
                style={{
                  height: "16px",
                  width: "16px",
                  cursor: "pointer",
                  marginLeft: "8px",
                }}
                onClick={handleCancelClick}
              />
            </>
          ) : (
            <span className="emailText">{user?.email}</span>
          )}
        </Button>
        <Divider
          orientation="vertical"
          flexItem
          className="divider"
          sx={{ display: { xs: "none", md: "flex" } }}
        />
        <Button
          sx={{ my: 0, color: "white", display: { xs: "none", md: "block" } }}
          className="navLink navLinkText"
          component={Link}
          to={"/"}
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <span className="icon-off"></span>
          Logout
        </Button>
      </Toolbar>
      <LogoutFailedSnackbar open={logoutFailed} onClose={dismissLogoutFailed} />
    </AppBar>
  );
};

export default NavBar;

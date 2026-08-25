import { Box, Stack, TextField } from "@mui/material";
import React, { FC, useState } from "react";
import { theme } from "../../constants";
import MyButton from "../../components/MyButton";
import MySwitch from "../../components/MySwitch";
import List from "../../components/List";
import UserList from "../../components/EditorsCommon/UserList";
import HelpIcon from "../../components/Icons/HelpIcon";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { RightType } from "../../components/EditorsCommon/types";

interface UsersEditorProps {
  teams: Array<object>;
  groupsNoTeams: Array<object>;
  details: Array<{ name: string }>;
  timeZones: Array<{ code: string; utc_offset: number }>;
}

const UsersEditor: FC<UsersEditorProps> = (props) => {
  const { teams, groupsNoTeams, details, timeZones } = props;
  const [showInactive, setShowInactive] = useState(false);
  const [chosenTeam, setChosenTeam] = useState("all");
  const [chosenGroup, setChosenGroup] = useState("all");
  const [searchValue, setSearchVaue] = useState("");

  return (
    <Box
      sx={{
        marign: 0,
        margin: "auto",
        display: "flex",
        flexDirection: "row",
        [theme.breakpoints.down("md")]: {
          flexDirection: "column",
        },
      }}
    >
      <Stack direction="column" sx={{ marginRight: "30px" }}>
        <Stack
          direction={"row"}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <MyButton
            name={"New User"}
            navigateTo="/create_user"
            icon={"icon-user-plus"}
          />
          <MySwitch
            checked={showInactive}
            setChecked={setShowInactive}
            label={"Show inactive: "}
          />
          <form noValidate autoComplete="off">
            <TextField
              id="outlined-controlled"
              label={searchValue === "" ? "Search" : ""}
              InputLabelProps={{
                shrink: false,
              }}
              size="small"
              value={searchValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSearchVaue(event.target.value);
              }}
              sx={{
                backgroundColor: "white",
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    border: "1px solid #cccccc",
                  },
                "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    border: "1px solid #ccc",
                  },
              }}
            />
          </form>
        </Stack>
        {teams && groupsNoTeams && details && (
          <UserList
            users={details}
            searchValue={searchValue}
            showInactive={showInactive}
            teams={teams}
            groups={groupsNoTeams}
            chosenGroup={chosenGroup}
            chosenTeam={chosenTeam}
            timeZones={timeZones}
          />
        )}
      </Stack>
      <Stack direction={"column"}>
        <HelpIcon
          position={"relative"}
          left={-5}
          top={2}
          maxWidth={250}
          textAlign={"right"}
          marginLeft={65}
          text={
            <>
              <p>
                <span
                  style={{
                    display: "inline-flex",
                    verticalAlign: "middle",
                    boxSizing: "inherit",
                    textAlign: "center",
                    alignItems: "center",
                    height: "12px",
                  }}
                >
                  <HelpOutlineIcon />
                </span>{" "}
                Filter by Team
              </p>
              <p>
                Lists all the teams to select a particular team to filter the
                list
              </p>
            </>
          }
        />
        <List
          name={"Teams"}
          list={teams}
          setChosenItem={setChosenTeam}
          chosenItem={chosenTeam}
        />
        <HelpIcon
          position={"relative"}
          left={-5}
          top={2}
          maxWidth={250}
          textAlign={"right"}
          marginLeft={65}
          text={
            <>
              <p>
                <span
                  style={{
                    display: "inline-flex",
                    verticalAlign: "middle",
                    boxSizing: "inherit",
                    textAlign: "center",
                    alignItems: "center",
                    height: "12px",
                  }}
                >
                  <HelpOutlineIcon />
                </span>{" "}
                Filter by Groups
              </p>
              <p>
                Lists all the groups except teams to select a particular group
                to filter the list
              </p>
            </>
          }
        />
        <List
          name={"Other groups"}
          list={groupsNoTeams}
          setChosenItem={setChosenGroup}
          chosenItem={chosenGroup}
          displayLabel={"label"}
        />
      </Stack>
    </Box>
  );
};

export default UsersEditor;

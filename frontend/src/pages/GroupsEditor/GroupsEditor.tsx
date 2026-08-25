import { Box, Stack } from "@mui/material";
import { useState } from "react";
import { theme } from "../../constants";
import MyButton from "../../components/MyButton";
import List from "../../components/List";
import GroupsCard from "./GroupsCard";
import { Groups } from "../../components/EditorsCommon/types";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";
import {
  EditorSearchField,
  EditorToggleButtons,
} from "../../components/EditorsCommon";

const GroupsEditor = () => {
  const { data: details } = rolesEditorHooks.useGroupsDetails();
  const [chosenGroup, setChosenGroup] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  return (
    <Stack direction={"column"} sx={{ margin: 0 }}>
      <EditorToggleButtons value="groups" />
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
            <MyButton name={"New Group"} navigateTo="/create_group" />
            <EditorSearchField
              searchValue={searchValue}
              setSearchValue={setSearchValue}
            />
          </Stack>
          {details &&
            details
              .filter(
                (detail: Groups) =>
                  detail.label
                    .toLocaleLowerCase()
                    .includes(searchValue.toLocaleLowerCase()) &&
                  (chosenGroup === "all" ||
                    detail.role_ids.includes(
                      details.find((d: Groups) => {
                        return d.label === chosenGroup;
                      })?.id,
                    )),
              )
              .map((group: Groups) => (
                <GroupsCard group={group} key={group.code} groups={details} />
              ))}
        </Stack>
        <Stack direction={"column"}>
          <List
            name={"All Groups (with teams)"}
            list={details}
            setChosenItem={setChosenGroup}
            chosenItem={chosenGroup}
            displayLabel={"label"}
          />
        </Stack>
      </Box>
    </Stack>
  );
};

export default GroupsEditor;

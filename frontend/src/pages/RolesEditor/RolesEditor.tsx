import { useState, createContext, useContext } from "react";
import { teamsHooks, usersHooks } from "../../hooks";
import { Stack } from "@mui/material";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";
import UsersEditor from "./UsersEditor";
import { EditorToggleButtons } from "../../components/EditorsCommon";
import Warning from "../../components/Warning";

type RolesEditorContextType = {
  isUpdated: boolean;
  triggerUpdate: () => void;
};

const RolesEditorContext = createContext<RolesEditorContextType | undefined>(
  undefined,
);

const useRolesEditorContext = () => {
  const context = useContext(RolesEditorContext);
  if (!context) {
    throw new Error(
      "useRolesEditorContext must be used within a RolesEditorProvider",
    );
  }

  return context;
};

const RolesEditor = () => {
  const { data: details, refetch } = usersHooks.useDetails();
  const { data: teams } = teamsHooks.useTeams();
  const { data: groupsNoTeams } = rolesEditorHooks.useGroupsNoTeams();
  const { data: timeZones } = rolesEditorHooks.useTimeZones();
  // Flag to trigger re-renders after data is refreshed, ensuring the UI reflects the latest updates.
  const [isUpdated, setIsUpdated] = useState(false);

  const triggerUpdate = () => {
    refetch().then((result) => {
      if (result.status === "success") {
        setIsUpdated((prev) => !prev);
      } else if (result.status === "error") {
        console.error("Error refetching data:", result.error);
      }
    });
  };

  return (
    <RolesEditorContext.Provider value={{ isUpdated, triggerUpdate }}>
      <Stack direction={"column"} sx={{ margin: 0 }}>
        <EditorToggleButtons value="users" />

        <Warning
          width={1000}
          marginTop={20}
          marginBottom={20}
          marginLeft={"auto"}
          marginRight={"auto"}
        />

        {timeZones && (
          <UsersEditor
            teams={teams}
            details={details}
            groupsNoTeams={groupsNoTeams}
            timeZones={timeZones}
          />
        )}
      </Stack>
    </RolesEditorContext.Provider>
  );
};

export default RolesEditor;
export { useRolesEditorContext, RolesEditorContext };

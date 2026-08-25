import { Box, Button } from "@mui/material";
import { FC, useEffect, useState } from "react";
import HelpIcon from "../../components/Icons/HelpIcon";
import workchartHooks from "../../hooks/workchartHooks";
import { WorkChart } from "./General";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Autocomplete, {
  AutocompleteOption,
  UserOptionType,
} from "../../components/Autocomplete/Autocomplete";
import MySwitch from "../../components/MySwitch";
import { Right } from "../../components/EditorsCommon/types";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";

interface ChangeObjectItem {
  id: number;
  status: "remove" | "add" | "update";
}

interface Target {
  id: number;
  status: "remove" | "add" | "update";
}

interface MyRight {
  id: number;
  status: "remove" | "add" | "update";
  targets?: Target[];
}

interface UserEntity {
  isChanged: boolean;
  myrights: MyRight[];
}

export interface UserChange {
  user_id: number; // Assuming `change.id` is a number; adjust if needed
  user_entity: UserEntity;
}

const Managers: FC<{
  allUsers: Array<UserOptionType> | undefined;
  managers: Array<UserOptionType>;
  setManagers: Function;
  handleAddManager: Function;
  workChart: WorkChart;
  onToggleDontSendEmptyReports?: (val: boolean) => void;
}> = (props) => {
  const {
    allUsers,
    managers,
    setManagers,
    workChart,
    handleAddManager,
    onToggleDontSendEmptyReports,
  } = props;
  const [searchAll, setSearchAll] = useState(false);
  const [isChanaged, setIsChanged] = useState(false);
  const [localManagers, setLocalManagers] = useState(managers);
  const [autocompleteRoles, setAutocompleteRoles] = useState<
    Array<AutocompleteOption>
  >(
    localManagers.map((user, index) => {
      return { value: user, label: user.name };
    }),
  );

  const [managerChanges, setManagerChanges] = useState<UserChange[]>([]);
  const { data: rightTypes } = rolesEditorHooks.useRightTypes();

  useEffect(() => {
    setManagers(
      autocompleteRoles.map((autocompleteRole, index) => {
        return autocompleteRole.value;
      }),
    );
  }, [autocompleteRoles, setManagers]);

  const getArrayDifference = (
    newArray: Array<number>,
    currentArray: Array<number>,
  ) => {
    let changes: Array<ChangeObjectItem> = [];
    for (let i = 0; i < newArray.length; i++) {
      if (!currentArray.includes(newArray[i])) {
        changes.push({ id: newArray[i], status: "add" });
      }
    }
    for (let i = 0; i < currentArray.length; i++) {
      if (!newArray.includes(currentArray[i])) {
        changes.push({ id: currentArray[i], status: "remove" });
      }
    }
    return changes;
  };
  const handleOnManagerChange = (values: AutocompleteOption[]) => {
    const updatedManagers = values.map((v) => v.value);
    const newManagersIds = updatedManagers.map((um) => um.id);
    const currentManagersIds = managers.map((m) => m.id);
    const changes = getArrayDifference(newManagersIds, currentManagersIds);
    const projectManageRight = rightTypes?.find(
      (right: Right) => right.code === "project_manage",
    );
    if (!projectManageRight) return;
    const finalManagerChanges = changes.map((change) => {
      const userTobeMadeManager = allUsers?.find((u) => u.id === change.id);
      const userTobeMadeManagerProjectManageRight =
        userTobeMadeManager?.myrights.find((r) => r.code === "project_manage");
      if (change.status === "add") {
        if (userTobeMadeManagerProjectManageRight) {
          return {
            user_id: change.id,
            user_entity: {
              isChanged: true,
              myrights: [
                {
                  id: userTobeMadeManagerProjectManageRight?.id,
                  status: "update" as "update",
                  targets: [
                    {
                      id: workChart.id,
                      status: "add" as "add",
                    },
                  ],
                },
              ],
            },
          };
        } else {
          return {
            user_id: change.id,
            user_entity: {
              isChanged: true,
              myrights: [
                {
                  id: projectManageRight?.id,
                  status: "add" as "add",
                  targets: [
                    {
                      id: workChart.id,
                      status: "add" as "add",
                    },
                  ],
                },
              ],
            },
          };
        }
      }

      return {
        user_id: change.id,
        user_entity: {
          isChanged: true,
          myrights: [
            {
              id: userTobeMadeManagerProjectManageRight?.id || -1,
              status: "remove" as "remove",
            },
          ],
        },
      };
    });
    setManagerChanges(finalManagerChanges);
    setLocalManagers(updatedManagers);
    setIsChanged(true);
  };

  const [checked, setChecked] = useState(workChart.dont_send_empty_reports);
  const { mutateAsync: updateWorkChart } = workchartHooks.useUpdateWorkChart();
  const [savingSwitch, setSavingSwitch] = useState(false);

  return (
    <Box
      sx={{
        marginTop: "20px",
        backgroundColor: "rgba(0, 0, 0, 0.03)",
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingBottom: "16px",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <HelpIcon
          margin={11}
          maxWidth={200}
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
                Project managers
              </p>
              <p>
                Start typing and select a user that should become a current work
                chart project manager. Auto saving after selection.
              </p>
            </>
          }
        />
        <p>Project managers</p>
      </Box>

      <Autocomplete
        options={
          allUsers
            ? allUsers.reduce(
                (
                  accumulator: Array<AutocompleteOption>,
                  person: UserOptionType,
                ) => {
                  if (!person?.status_code) debugger;
                  if (searchAll || person.status_code === "enabled") {
                    accumulator.push({
                      value: person,
                      label: person.name,
                    });
                  }
                  return accumulator;
                },
                [],
              )
            : []
        }
        values={autocompleteRoles}
        setValues={handleOnManagerChange}
        placeholder="Type to search through users"
        triangle={false}
      />
      <Button
        sx={{
          backgroundImage:
            "linear-gradient(to bottom, #0098FF, #04C) !important",
          textTransform: "none",
          color: "white",
          paddingY: "2px",
          marginTop: "10px",
        }}
        onClick={() => handleAddManager(managerChanges)}
      >
        Save
      </Button>
      <MySwitch
        checked={checked}
        setChecked={async (val: boolean) => {
          setChecked(val);
          if (onToggleDontSendEmptyReports) {
            onToggleDontSendEmptyReports(val);
          }
          try {
            setSavingSwitch(true);
            await updateWorkChart({
              id: workChart.id,
              work_chart: { dont_send_empty_reports: val },
            });
          } finally {
            setSavingSwitch(false);
          }
        }}
        label={savingSwitch ? "Saving…" : "Don't send empty project reports"}
      />
    </Box>
  );
};

export default Managers;

/* 
one that doesnot work:
user_entity
: 
"{\"isChanged\":true,\"myrights\":[{\"id\":505,\"status\":\"update\",\"targets\":[{\"id\":9297,\"status\":\"add\"}]}]}"
user_id
: 
46


one that works:
user_entity
: 
"{\"isChanged\":true,\"myrights\":[{\"id\":505,\"status\":\"update\",\"targets\":[{\"id\":9297,\"status\":\"add\"}]}]}"
user_id
: 
46


one that works:
*/

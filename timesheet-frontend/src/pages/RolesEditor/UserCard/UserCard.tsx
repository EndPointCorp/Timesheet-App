import { FC, useEffect, useRef, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import MySwitch from "../../../components/MySwitch";
import Text from "../../../components/EditorsCommon/Text";
import "../index.css";
import rolesEditorHooks from "../../../hooks/rolesEditorHooks";
import GroupList from "./GroupList";
import TeamList from "./TeamList";
import RightsGranted from "../../../components/EditorsCommon/RightsGranted";
import {
  RightType,
  RolesEditorGroup,
  RolesEditorTeam,
  RolesEditorUser,
  Target,
  isGroup,
} from "../../../components/EditorsCommon/types";
import TimeZones from "./TimeZones";
import OpenCloseArrow from "./OpenCloseArrow";
import { useRolesEditorContext } from "../RolesEditor";

interface UserCardProps {
  user: RolesEditorUser;
  teams: Array<RolesEditorTeam>;
  groups: Array<RolesEditorGroup>;
  timeZones: Array<string>;
}

interface ChangeObjectItem {
  id: number;
  status: "remove" | "add" | "update";
  targets?: Array<ChangeObjectItem>;
}

interface ChangeObject {
  isChanged: boolean;
  status?: boolean;
  myrights?: Array<ChangeObjectItem>;
  myroles?: Array<ChangeObjectItem>;
  myteam?: Array<ChangeObjectItem>;
  time_zone?: string;
  name?: string;
  email?: string;
  password?: string;
}

const UserCard: FC<UserCardProps> = (props) => {
  const { user, teams, groups, timeZones } = props;
  const [opened, setOpened] = useState(false);
  const { data: rights } = rolesEditorHooks.useRightTypes();
  const { mutateAsync: sendChanges } = rolesEditorHooks.useSaveChanges();
  const { triggerUpdate } = useRolesEditorContext();

  const getTeamsFromUser = () => {
    return teams
      .filter((team, index) => {
        return user.team_ids.includes(team.role_id);
      })
      .sort((a, b) => {
        return a.display_label < b.display_label ? -1 : 1;
      });
  };

  const getGroupsFromUser = () => {
    return groups
      .filter((group, index) => {
        return user.role_ids.includes(group.id);
      })
      .sort((a, b) => {
        return a.label < b.label ? -1 : 1;
      });
  };

  const getRightsFromUser = () => {
    const userCopy: RolesEditorUser = JSON.parse(JSON.stringify(user));

    return userCopy.myrights.sort((a, b) => {
      return a.label < b.label ? -1 : 1;
    });
  };

  const getStatusCodeFromUser = () => {
    return user.status_code === "enabled";
  };

  const getTimeZoneFromUser = () => {
    return user.time_zone;
  };

  const getNameFromUser = () => {
    return user.name;
  };

  const getEmailFromUser = () => {
    return user.email;
  };

  const [timeZone, setTimeZone] = useState(getTimeZoneFromUser());
  const [userEnabled, setUserEnabled] = useState(getStatusCodeFromUser());
  const [userTeams, setUserTeams] = useState(getTeamsFromUser());
  const [userGroups, setUserGroups] = useState(getGroupsFromUser());
  const [userRights, setUserRights] = useState(getRightsFromUser());
  const [username, setUsername] = useState(getNameFromUser());
  const [email, setEmail] = useState(getEmailFromUser());
  const [password, setPassword] = useState("");

  // Inline edit state for username and email
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeZone(getTimeZoneFromUser());
    setUserEnabled(getStatusCodeFromUser());
    setUserTeams(getTeamsFromUser());
    setUserGroups(getGroupsFromUser());
    setUserRights(getRightsFromUser());
    setUsername(getNameFromUser());
    setEmail(getEmailFromUser());
  }, [user.name]); // when user.name changes we belive it is a different user then we update all aspects of that user

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingEmail) {
      emailInputRef.current?.focus();
    }
  }, [editingEmail]);

  const cancelChanges = () => {
    setTimeZone(getTimeZoneFromUser());
    setUserEnabled(getStatusCodeFromUser());
    setUserTeams(getTeamsFromUser());
    setUserGroups(getGroupsFromUser());
    setUserRights(getRightsFromUser());
    setUsername(getNameFromUser());
    setEmail(getEmailFromUser());
    setPassword("");
  };

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

  const getChanges = () => {
    let changes: ChangeObject = { isChanged: false };
    if (getStatusCodeFromUser() !== userEnabled) {
      changes.status = userEnabled;
    }
    if (getTimeZoneFromUser() !== timeZone) {
      changes.time_zone = timeZone;
    }
    if (getNameFromUser() !== username) {
      changes.name = username;
    }
    if (getEmailFromUser() !== email) {
      changes.email = email;
    }
    if ("" !== password) {
      changes.password = password;
    }
    const teamChanges = getArrayDifference(
      userTeams.map((team) => {
        return team.role_id;
      }),
      user.team_ids.filter((id) => {
        return teams
          .map((team) => {
            return team.role_id;
          })
          .includes(id);
      }),
    );

    const groupChanges = getArrayDifference(
      userGroups.map((group) => {
        return group.id;
      }),
      user.role_ids.filter((id) => {
        return groups
          .map((group) => {
            return group.id;
          })
          .includes(id);
      }),
    );

    const rightsChanges = getArrayDifference(
      userRights.map((right) => {
        return right.id;
      }),
      user.myrights.map((right) => {
        return right.id;
      }),
    );

    userRights.map((right) => {
      const right2 = user.myrights.find((e) => {
        return e.id === right.id;
      });
      if (right2 !== undefined) {
        // Replace each target with the matching saved target from `right2` to ensure correct IDs,
        // preventing `getArrayDifference` from detecting false changes due to ID mismatches.
        const preProcessedRightTargets = right.targets.map((rt) => {
          const matchingRight = right2.targets.find(
            (rt2) => rt2.ref_obj_pk === rt.id,
          );
          return matchingRight ? matchingRight : rt;
        });

        const targetChanges = getArrayDifference(
          preProcessedRightTargets.map((e) => e.id),
          right2.targets.map((e) => e.id),
        );
        if (targetChanges.length !== 0)
          rightsChanges.push({
            id: right.id,
            status: "update",
            targets: targetChanges,
          });
      } else if (right.targets && right.targets.length > 0) {
        // New right with targets picked in the same edit: attach targets to the
        // {status:"add"} entry so they get created together server-side.
        const newEntry = rightsChanges.find(
          (rc) => rc.id === right.id && rc.status === "add",
        );
        if (newEntry) {
          newEntry.targets = right.targets.map((t) => ({
            id: t.id,
            status: "add",
          }));
        }
      }
    });

    if (teamChanges.length !== 0) {
      changes.myteam = teamChanges;
    }
    if (groupChanges.length !== 0) {
      changes.myroles = groupChanges;
    }
    if (rightsChanges.length !== 0) {
      changes.myrights = rightsChanges;
    }
    if (Object.keys(changes).length > 1) {
      changes.isChanged = true;
    }
    return changes;
  };

  const saveChanges = async () => {
    const changes = getChanges();
    if (changes.isChanged) {
      const res = await sendChanges({
        userId: user.id,
        changes,
      });

      if (res?.status === 200) {
        // Refresh parent components to show updated data, so the next getChanges call detects no changes.
        // This hides the Save/Cancel buttons, providing a smoother user experience.
        triggerUpdate();
        window.alert("Changes saved");
      } else {
        console.error("Failed to save changes:", res);
        window.alert("Failed to save changes");
      }
    }
  };

  const addItem = (item: RolesEditorTeam | RolesEditorGroup) => {
    isGroup(item)
      ? setUserGroups(
          [...userGroups, item].sort((a, b) => {
            return a.label < b.label ? -1 : 1;
          }),
        )
      : setUserTeams(
          [...userTeams, item].sort((a, b) => {
            return a.display_label < b.display_label ? -1 : 1;
          }),
        );
  };

  const removeTeam = (teamToRemove: number) => {
    setUserTeams(
      userTeams.filter((team) => {
        return team.role_id !== teamToRemove;
      }),
    );
  };

  const removeGroup = (groupToRemove: number) => {
    setUserGroups(
      userGroups.filter((group) => {
        return group.id !== groupToRemove;
      }),
    );
  };

  const addRight = (rightToAdd: RightType) => {
    setUserRights([
      ...userRights,
      {
        label: rightToAdd.label,
        id: rightToAdd.id,
        target_kind_code: rightToAdd.target_kind_code,
        targets: [],
        is_direct: true,
        code: rightToAdd.code,
      },
    ]);
  };

  const removeRight = (rightToRemove: number) => {
    // Admin note (2025-10): deleting a non-direct right here removes the shared Base management role grants
    // (superuser/report on roles) from the database. This guard ensures inherited rights stay untouched.
    const originalRight = user.myrights.find(
      (right) => right.id === rightToRemove,
    );
    if (originalRight && !originalRight.is_direct) {
      return;
    }

    setUserRights(
      userRights.filter((right) => {
        return right.id !== rightToRemove;
      }),
    );
  };

  const removeTarget = (rightId: number, targetId: number) => {
    setUserRights(
      userRights.map((right) => {
        if (right.id === rightId) {
          right.targets = right.targets.filter((target) => {
            return target.id !== targetId;
          });
        }
        return right;
      }),
    );
  };

  const addTarget = (
    rightId: number,
    newTargetLabel: string,
    ref_obj_pk: number,
  ) => {
    setUserRights((prevUserRights) =>
      prevUserRights.map((right) => {
        if (right.id === rightId) {
          const newTarget: Target = {
            id: ref_obj_pk,
            label: newTargetLabel,
            ref_obj_pk,
          };

          // Add the new target to the targets list
          return {
            ...right,
            targets: [...right.targets, newTarget],
          };
        }
        return right;
      }),
    );
  };

  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const handleInputChange = (event: any) => {
    setPassword(event.target.value);
    setShowPlaceholder(false);
  };

  const handleInputFocus = () => {
    setShowPlaceholder(false);
  };

  const handleInputBlur = () => {
    if (password === "") {
      setShowPlaceholder(true);
    }
  };

  return (
    <Box
      sx={{
        background: "#FBFBFB",
        width: "626px",
        marginTop: "20px",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
        WebkitBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
      }}
    >
      <Box sx={{ padding: "10px" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            fontSize: "20px",
            fontWeight: "normal",
            color: "#222222",
            minHeight: "25px",
          }}
        >
          <Box>
            {getChanges().isChanged && (
              <>
                <Button
                  sx={{
                    height: "24px",
                    width: "24px",
                    textTransform: "none",
                    backgroundImage:
                      "linear-gradient(to bottom, #0098FF, #04C) !important",
                    color: "white",
                    marginRight: "10px",
                  }}
                  onClick={() => {
                    saveChanges();
                  }}
                >
                  Save
                </Button>

                <Button
                  sx={{
                    height: "24px",

                    textTransform: "none",
                    color: "white",
                    marginRight: "10px",
                  }}
                  className="deleteButton"
                  onClick={() => {
                    cancelChanges();
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
            {editingName ? (
              <TextField
                inputRef={nameInputRef}
                variant="standard"
                size="small"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "Escape") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                InputProps={{
                  sx: {
                    fontSize: "20px",
                    color: "#222222",
                  },
                }}
              />
            ) : (
              <Box
                component="span"
                onClick={() => setEditingName(true)}
                sx={{
                  cursor: "text",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  component="span"
                  sx={{ fontSize: "20px", color: "#222" }}
                >
                  {username}
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ marginTop: "-10px" }}>
            <MySwitch
              checked={userEnabled}
              setChecked={() => {
                setUserEnabled(!userEnabled);
              }}
              label={`${userEnabled ? "Active" : "Inactive"}`}
            />
          </Box>
        </Box>
        {editingEmail ? (
          <TextField
            inputRef={emailInputRef}
            variant="standard"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEditingEmail(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            InputProps={{
              sx: {
                paddingTop: "4px",
                fontSize: "12px",
                color: "#899DB0",
                minWidth: "60px",
              },
            }}
          />
        ) : (
          <Box
            component="span"
            onClick={() => setEditingEmail(true)}
            sx={{
              cursor: "text",
              display: "inline-flex",
              alignItems: "center",
              color: "#899DB0",
              padding: "5px 0px",
              fontSize: "12px",
              minWidth: "60px",
            }}
          >
            <Typography
              component="span"
              sx={{ fontSize: "12px", color: "#899DB0" }}
            >
              {email}
            </Typography>
          </Box>
        )}
        <Stack direction="row" sx={{ margin: "10px 0px" }}>
          <Text text={"Password: "} />
          <input
            type="password"
            placeholder={showPlaceholder ? "•".repeat(20) : ""}
            value={password}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            style={{
              border: "none",
              padding: "6px",
              background: "transparent",
              color: "rgba(0, 0, 0, 0.75)",
              outline: "none",
            }}
          />
        </Stack>
        <TeamList
          userTeams={userTeams}
          teams={teams}
          removeTeam={removeTeam}
          addTeam={addItem}
        />
        <GroupList
          userGroups={userGroups}
          groups={groups}
          user={user}
          removeGroup={removeGroup}
          addGroup={addItem}
        />
        {opened && (
          <RightsGranted
            userRights={userRights}
            removeRight={removeRight}
            removeTarget={removeTarget}
            rights={rights}
            addRight={addRight}
            addTarget={addTarget}
          />
        )}
        {opened && (
          <TimeZones
            timeZone={timeZone}
            setTimeZone={setTimeZone}
            timeZones={timeZones}
          />
        )}
        <OpenCloseArrow opened={opened} setOpened={setOpened} />
      </Box>
    </Box>
  );
};

export default UserCard;

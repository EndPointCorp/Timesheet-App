import { Box, Button } from "@mui/material";
import { FC, useState } from "react";
import { Groups, Target } from "../../../components/EditorsCommon/types";
import OpenCloseArrow from "../../RolesEditor/UserCard/OpenCloseArrow";
import GroupsList from "./GroupsList";
import { RightsGranted } from "../../../components/EditorsCommon";
import rolesEditorHooks from "../../../hooks/rolesEditorHooks";
import { RightType } from "../../../components/EditorsCommon/types";
import okIcon from "../../../assets/images/ok_icon.png";
import redButtonCancel from "../../../assets/images/red_button_cancel.png";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface Props {
  group: Groups;
  groups: Array<Groups>;
}

interface ChangeObjectItem {
  id: number;
  status: "remove" | "add" | "update";
  targets: Array<ChangeObjectItem>;
}

interface ChangeRoleObjectItem {
  id: number;
  status: "remove" | "add" | "update";
}

interface ChangeObject {
  isChanged: boolean;
  label?: string;
  myrights?: Array<ChangeObjectItem>;
  myroles?: Array<ChangeRoleObjectItem>;
}

const GroupsCard: FC<Props> = ({ group, groups }) => {
  const [opened, setOpened] = useState(false);
  const { data: rights } = rolesEditorHooks.useRightTypes();
  const { mutateAsync: sendChanges } = rolesEditorHooks.useSaveGroupChanges();

  // Keep track of both direct and indirect rights
  const [groupRights, setGroupRights] = useState([...group.direct_rights]);
  const [inDirectGroupRights, setIndirectGroupRIghts] = useState([
    ...group.indirect_rights,
  ]);

  const [roleIds, setRoleIds] = useState([...group.role_ids]);
  const [directRoleIds, setDirectRoleIds] = useState([
    ...group.direct_role_ids,
  ]);
  const [isChanged, setIsChanged] = useState(false);
  const [groupLabel, setGroupLabel] = useState(group.label);

  const removeRight = (rightId: number) => {
    setGroupRights((prevRights) =>
      prevRights.filter((right) => right.id !== rightId),
    );
    setIsChanged(true);
  };

  const addRight = (rightToAdd: RightType) => {
    const rightExists = groupRights.some((right) => right.id === rightToAdd.id);

    if (!rightExists) {
      setGroupRights((prevRights) => [
        ...prevRights,
        {
          label: rightToAdd.label,
          id: rightToAdd.id,
          target_kind_code: rightToAdd.target_kind_code,
          targets: [],
          is_direct: true,
          code: rightToAdd.code,
        },
      ]);
      setIsChanged(true);
    }
  };

  const cancelChanges = () => {
    setGroupRights([...group.direct_rights]);
    setIndirectGroupRIghts([...group.indirect_rights]); // Revert indirect rights as well
    setRoleIds([...group.role_ids]);
    setDirectRoleIds([...group.direct_role_ids]);
    setGroupLabel(group.label); // revert to original label

    setIsChanged(false);
  };

  const getArrayDifference = (
    newArray: number[],
    originalArray: number[],
  ): ChangeObjectItem[] => {
    const changes: ChangeObjectItem[] = [];
    for (const id of newArray) {
      if (!originalArray.includes(id)) {
        changes.push({ id, status: "add", targets: [] });
      }
    }
    for (const id of originalArray) {
      if (!newArray.includes(id)) {
        changes.push({ id, status: "remove", targets: [] });
      }
    }
    return changes;
  };

  const rolesDifferenceDifference = (
    newArray: number[],
    originalArray: number[],
  ): ChangeRoleObjectItem[] => {
    const changes: ChangeRoleObjectItem[] = [];
    for (const id of newArray) {
      if (!originalArray.includes(id)) {
        changes.push({ id, status: "add" });
      }
    }
    for (const id of originalArray) {
      if (!newArray.includes(id)) {
        changes.push({ id, status: "remove" });
      }
    }
    return changes;
  };

  const getTargetDifference = (
    newTargets: Target[],
    originalTargets: Target[],
  ) => {
    const changes: ChangeObjectItem[] = [];
    const newTargetIds = newTargets.map((t) => t.id);
    const originalTargetIds = originalTargets.map((t) => t.id);

    for (const id of newTargetIds) {
      if (!originalTargetIds.includes(id)) {
        changes.push({ id, status: "add", targets: [] });
      }
    }
    for (const id of originalTargetIds) {
      if (!newTargetIds.includes(id)) {
        changes.push({ id, status: "remove", targets: [] });
      }
    }
    return changes;
  };

  const getChanges = (): ChangeObject => {
    const originalRightIds = group.direct_rights.map((right) => right.id);
    const currentRightIds = groupRights.map((right) => right.id);

    const rightsChanges = getArrayDifference(currentRightIds, originalRightIds);
    const roleIdsChanges = rolesDifferenceDifference(roleIds, group.role_ids);

    // Check target changes for direct rights
    for (const currentRight of groupRights) {
      const originalRight = group.direct_rights.find(
        (r) => r.id === currentRight.id,
      );
      if (originalRight) {
        const targetChanges = getTargetDifference(
          currentRight.targets,
          originalRight.targets,
        );
        if (targetChanges.length > 0) {
          let rightChangeEntry = rightsChanges.find(
            (rc) => rc.id === currentRight.id,
          );
          if (!rightChangeEntry) {
            rightsChanges.push({
              id: currentRight.id,
              status: "update",
              targets: targetChanges,
            });
          } else if (rightChangeEntry.status === "update") {
            rightChangeEntry.targets.push(...targetChanges);
          }
        }
      }
    }

    // Check target changes for indirect rights
    for (const currentIndirectRight of inDirectGroupRights) {
      const originalIndirectRight = group.indirect_rights.find(
        (r) => r.id === currentIndirectRight.id,
      );
      if (originalIndirectRight) {
        const targetChanges = getTargetDifference(
          currentIndirectRight.targets,
          originalIndirectRight.targets,
        );
        if (targetChanges.length > 0) {
          let rightChangeEntry = rightsChanges.find(
            (rc) => rc.id === currentIndirectRight.id,
          );
          if (!rightChangeEntry) {
            rightsChanges.push({
              id: currentIndirectRight.id,
              status: "update",
              targets: targetChanges,
            });
          } else if (rightChangeEntry.status === "update") {
            rightChangeEntry.targets.push(...targetChanges);
          }
        }
      }
    }

    const changes: ChangeObject = {
      isChanged,
    };

    // If label is changed
    if (groupLabel !== group.label) {
      changes.label = groupLabel; // or `changes.label = groupLabel;` depending on API spec
    }

    if (rightsChanges.length > 0) {
      changes.myrights = rightsChanges;
    }

    if (roleIdsChanges.length > 0) {
      changes.myroles = roleIdsChanges;
    }
    return changes;
  };

  const saveChanges = async () => {
    if (isChanged) {
      const changes = getChanges();
      try {
        const res = await sendChanges({
          group_id: group.id,
          changes,
        });

        if (res?.status === 200) {
          // Update both direct and indirect rights after save
          group.direct_rights = [...groupRights];
          group.indirect_rights = [...inDirectGroupRights];
          group.role_ids = [...roleIds];
          group.direct_role_ids = [...directRoleIds];
          group.label = groupLabel;
          setIsChanged(false);
        } else {
          console.error("Failed to save changes:", res);
          window.alert("Failed to save changes");
        }
      } catch (error) {
        console.error("Error saving changes:", error);
      }
    }
  };

  const addRole = (selectedGroupId: number) => {
    setRoleIds((prevRoleIds) => [...prevRoleIds, selectedGroupId]);
    setDirectRoleIds((prevDirectRoleIds) => [
      ...prevDirectRoleIds,
      selectedGroupId,
    ]);
    setIsChanged(true);
  };

  const removeRole = (removedGroupId: number) => {
    setRoleIds((prevRoleIds) =>
      prevRoleIds.filter((prevRoleId) => prevRoleId !== removedGroupId),
    );
    setDirectRoleIds((prevDirectRoleIds) =>
      prevDirectRoleIds.filter(
        (prevDirectRoleId) => prevDirectRoleId !== removedGroupId,
      ),
    );
    setIsChanged(true);
  };

  const addTarget = (
    rightId: number,
    newTargetLabel: string,
    ref_obj_pk: number,
    isDirectRight?: boolean,
  ) => {
    if (isDirectRight) {
      setGroupRights((prevRights) =>
        prevRights.map((right) => {
          if (right.id === rightId) {
            const newTarget: Target = {
              id: ref_obj_pk,
              label: newTargetLabel,
              ref_obj_pk,
            };
            return { ...right, targets: [...right.targets, newTarget] };
          }
          return right;
        }),
      );
    } else {
      setIndirectGroupRIghts((prevRights) =>
        prevRights.map((right) => {
          if (right.id === rightId) {
            const newTarget: Target = {
              id: ref_obj_pk,
              label: newTargetLabel,
              ref_obj_pk,
            };
            return { ...right, targets: [...right.targets, newTarget] };
          }
          return right;
        }),
      );
    }
    setIsChanged(true);
  };

  const removeTarget = (
    rightId: number,
    targetId: number,
    isDirectRight?: boolean,
  ) => {
    if (isDirectRight) {
      setGroupRights(
        groupRights.map((right) => {
          if (right.id === rightId) {
            right.targets = right.targets.filter(
              (target) => target.id !== targetId,
            );
          }
          return right;
        }),
      );
    } else {
      setIndirectGroupRIghts(
        inDirectGroupRights.map((right) => {
          if (right.id === rightId) {
            right.targets = right.targets.filter(
              (target) => target.id !== targetId,
            );
          }
          return right;
        }),
      );
    }
    setIsChanged(true);
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
            minHeight: "25px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isChanged && (
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
            <span
              contentEditable="true"
              suppressContentEditableWarning={true}
              style={{ outline: "none" }}
              onBlur={(e) => {
                const newLabel = e.currentTarget.innerText.trim();
                if (newLabel !== groupLabel) {
                  setGroupLabel(newLabel);
                  setIsChanged(true);
                }
              }}
            >
              {groupLabel}
            </span>
          </Box>
        </Box>

        <GroupsList
          group={{
            ...group,
            role_ids: roleIds,
            direct_role_ids: directRoleIds,
          }}
          groups={groups}
          removeRole={removeRole}
          addGroup={addRole}
        />
        {opened && (
          <RightsGranted
            userRights={[...groupRights, ...inDirectGroupRights]}
            removeRight={removeRight}
            removeTarget={removeTarget}
            rights={rights}
            addRight={addRight}
            addTarget={addTarget}
          />
        )}
        <OpenCloseArrow opened={opened} setOpened={setOpened} />
      </Box>
    </Box>
  );
};

export default GroupsCard;

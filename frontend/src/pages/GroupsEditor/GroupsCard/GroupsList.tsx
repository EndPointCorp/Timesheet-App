import { Box } from "@mui/material";
import { FC } from "react";
import Text from "../../../components/EditorsCommon/Text";
import {
  Groups,
  RolesEditorGroup,
} from "../../../components/EditorsCommon/types";
import HelpIcon from "../../../components/Icons/HelpIcon";
import PopoverSelector from "../../../components/PopoverSelector";
import windowClose from "../../../assets/images/window-close.png";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  groups: Array<Groups>;
  group: Groups;
  removeRole: (idRemove: number) => void;
  addGroup: (id: number) => void;
}

const GroupsList: FC<Props> = ({ groups, group, removeRole, addGroup }) => {
  return (
    <Box sx={{ margin: "10px 0px", display: "flex" }}>
      <Text text={"Groups: "} />
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        {group.role_ids.map((role_id, index) => {
          const role = groups.find((e) => e.id === role_id);
          return (
            role && (
              <Box
                key={role_id}
                className="groupButton"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  color: "76736c",
                  borderRadius: "4px",
                  backgroundColor: "#E3E3E3",
                  padding: "2px 5px 2px 20px",
                  margin: "4px 4px",
                  textAlign: "center",
                  fontSize: "12px",
                  WebkitBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                  MsBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                  MozBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                  boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                }}
              >
                {role.label}
                {group.direct_role_ids.includes(role_id) ? (
                  <div>
                    <CloseIcon
                      onClick={() => {
                        removeRole(role_id);
                      }}
                      sx={{
                        color: "#868e96",
                        cursor: "pointer",
                        float: "right",
                        height: "20px",
                        width: "20px",
                        marginLeft: "10px",
                      }}
                    />
                  </div>
                ) : (
                  <HelpIcon
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
                          Indirect role
                        </p>
                        <p>Role inherited</p>
                      </>
                    }
                    float="right"
                    marginLeft={10}
                  />
                )}
              </Box>
            )
          );
        })}
        <PopoverSelector
          list={groups
            .filter((e: Groups) => !group.role_ids.includes(e.id))
            .map((e) => {
              const newValue: RolesEditorGroup = {
                code: e.code,
                id: e.id,
                label: e.label,
                value: "",
              };
              return newValue;
            })}
          type="group"
          //@ts-ignore
          handleClick={(v) => addGroup(v.id)}
        />
      </Box>
    </Box>
  );
};

export default GroupsList;

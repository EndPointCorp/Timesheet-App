import { FC } from "react";
import { Box } from "@mui/material";
import Text from "../../../components/EditorsCommon/Text";
import {
  RolesEditorGroup,
  RolesEditorTeam,
  RolesEditorUser,
} from "../../../components/EditorsCommon/types";
import HelpIcon from "../../../components/Icons/HelpIcon";
import windowClose from "../../../assets/images/window-close.png";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PopoverSelector from "../../../components/PopoverSelector";
import CloseIcon from "@mui/icons-material/Close";

interface GroupListProps {
  userGroups: Array<any>;
  user: RolesEditorUser;
  groups: Array<any>;
  removeGroup: Function;
  addGroup: (listItem: RolesEditorGroup | RolesEditorTeam) => void;
}

const GroupList: FC<GroupListProps> = (props) => {
  const { userGroups, user, groups, removeGroup, addGroup } = props;

  return (
    <Box sx={{ margin: "10px 0px", display: "flex" }}>
      <Text text={"Groups: "} />
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        {userGroups.map((group, index) => {
          return (
            <Box
              key={group.id}
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
              {group.label}
              {user.direct_role_ids.includes(group.id) ? (
                <div>
                  <CloseIcon
                    onClick={() => {
                      removeGroup(group.id);
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
          );
        })}
        <PopoverSelector
          list={groups.filter((e: any) => !userGroups.includes(e))}
          type="group"
          handleClick={addGroup}
        />
      </Box>
    </Box>
  );
};

export default GroupList;

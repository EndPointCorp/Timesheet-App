import { Box } from "@mui/material";
import { FC } from "react";
import Text from "../../../components/EditorsCommon/Text";
import {
  Groups,
  RolesEditorUser,
} from "../../../components/EditorsCommon/types";
import HelpIcon from "../../../components/Icons/HelpIcon";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface Props {
  group: Groups;
  groups: Array<Groups>;
  members: Array<RolesEditorUser>;
}

// Read-only. Membership is edited from the user's own card in the Roles
// editor, which is where the add/remove controls already live.
const MembersList: FC<Props> = ({ group, groups, members }) => {
  // A user lands here through role_ids, which already includes groups reached
  // via a sub-group. direct_role_ids is the subset they were placed in by
  // hand, so anyone outside it inherited their membership.
  const isDirect = (member: RolesEditorUser) =>
    member.direct_role_ids.includes(group.id);

  // For an inherited member, name the sub-group they came through: one of
  // their direct groups that is itself a member of this group.
  const inheritedVia = (member: RolesEditorUser) =>
    groups
      .filter(
        (candidate) =>
          member.direct_role_ids.includes(candidate.id) &&
          candidate.role_ids.includes(group.id),
      )
      .map((candidate) => candidate.label);

  return (
    <Box sx={{ margin: "10px 0px", display: "flex" }}>
      <Text text={"Members: "} />
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        {members.length === 0 && (
          <Box sx={{ color: "#899DB0", fontSize: "12px", padding: "5px 0px" }}>
            No members
          </Box>
        )}
        {members.map((member) => {
          const direct = isDirect(member);
          const via = direct ? [] : inheritedVia(member);

          return (
            <Box
              key={member.id}
              className="groupButton"
              sx={{
                display: "flex",
                alignItems: "center",
                color: "76736c",
                borderRadius: "4px",
                backgroundColor: "#E3E3E3",
                padding: direct ? "2px 20px" : "2px 5px 2px 20px",
                margin: "4px 4px",
                textAlign: "center",
                fontSize: "12px",
                WebkitBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                MsBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                MozBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
                boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
              }}
            >
              {member.name || member.email}
              {!direct && (
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
                        Indirect member
                      </p>
                      <p>
                        {via.length > 0
                          ? `Belongs through ${via.join(", ")}`
                          : "Membership inherited"}
                      </p>
                    </>
                  }
                  float="right"
                  marginLeft={10}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default MembersList;

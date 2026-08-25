import { FC } from "react";
import { Box } from "@mui/material";
import Text from "../../../components/EditorsCommon/Text";
import windowClose from "../../../assets/images/window-close.png";
import PopoverSelector from "../../../components/PopoverSelector";
import {
  RolesEditorGroup,
  RolesEditorTeam,
} from "../../../components/EditorsCommon/types";
import CloseIcon from "@mui/icons-material/Close";

interface TeamListProps {
  userTeams: Array<RolesEditorTeam>;
  teams: Array<RolesEditorTeam>;
  removeTeam: Function;
  addTeam: (listItem: RolesEditorTeam | RolesEditorGroup) => void;
}

const TeamList: FC<TeamListProps> = (props) => {
  const { userTeams, teams, removeTeam, addTeam } = props;

  return (
    <Box sx={{ margin: "10px 0px", display: "flex" }}>
      <Text text={"Teams: "} />
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        {userTeams.map((team) => (
          <Box
            key={team.code}
            className="groupButton"
            sx={{
              display: "flex",
              cursor: "pointer",
              alignItems: "center",
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
            {team.display_label}

            <div>
              <CloseIcon
                onClick={() => {
                  removeTeam(team.role_id);
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
          </Box>
        ))}
        <PopoverSelector
          list={teams.filter((e) => !userTeams.includes(e))}
          type="team"
          handleClick={addTeam}
        />
      </Box>
    </Box>
  );
};

export default TeamList;

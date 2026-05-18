import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  value: "users" | "groups";
}

const EditorToggleButtons: FC<Props> = ({ value }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "1000px",
        maxWidth: "100%",
        minWidth: "768px",
        margin: "0 auto",
        marginBottom: "20px",
        background: "#EEE",
        padding: "20px",
        position: "relative",
      }}
    >
      <ToggleButtonGroup color="primary" exclusive value={value}>
        <ToggleButton value="users" onClick={() => navigate("/users-editor")}>
          Users
        </ToggleButton>
        <ToggleButton value="groups" onClick={() => navigate("/groups-editor")}>
          Groups
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default EditorToggleButtons;

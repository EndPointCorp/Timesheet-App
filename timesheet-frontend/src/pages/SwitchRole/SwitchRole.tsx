import { Box, Stack } from "@mui/material";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import usersHooks from "../../hooks/usersHooks";
import "./index.css";
import Warning from "../../components/Warning";
import useLoadingStore from "../../stores/useLoadingStore";

type OtherUser = {
  email: string;
  status_code: string;
  display_label: string;
  name?: string;
};
const SwitchRole = () => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const { data: otherUsers } = usersHooks.useOtherUsers();
  const { mutateAsync: switchRole, success } = usersHooks.useSwichRole();
  const { setIsLoading } = useLoadingStore();

  const roles: OtherUser[] = (otherUsers ?? [])
    .filter((otherUser: OtherUser) => {
      if (showAll) return showAll;
      return otherUser.status_code === "enabled";
    })
    .map((otherUser: OtherUser) => {
      const name = otherUser.display_label.split(":")[1];
      return { ...otherUser, name };
    });

  if (success) {
    navigate("/");
  }

  return (
    <div>
      <Warning
        width={1000}
        marginTop={20}
        marginBottom={20}
        marginLeft={"auto"}
        marginRight={"auto"}
      />
      <Stack
        direction={"column"}
        sx={{
          width: "45%",
          padding: "20px",
          background: "white",
          margin: "auto",
        }}
      >
        <Box sx={{ marginBottom: "10px" }}>
          <input
            type="checkbox"
            checked={showAll}
            onClick={() => setShowAll(!showAll)}
            className="showAllCheckbox"
          />
          show all
        </Box>
        <Box
          sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
        >
          {roles.map((value: OtherUser, index) => {
            return (
              <Box
                sx={{
                  backgroundColor: "#F4F4F4",
                  marginX: "3px",
                  marginY: "5px",
                  paddingX: "7px",
                  paddingY: "4px",
                }}
                onClick={() => {
                  setIsLoading(true);
                  switchRole(value.email);
                }}
                className="switch-user-button"
              >
                {value.name}
              </Box>
            );
          })}
        </Box>
      </Stack>
    </div>
  );
};

export default SwitchRole;

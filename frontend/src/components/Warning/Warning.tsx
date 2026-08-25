import { FC } from "react";
import "./index.css";
import { Box } from "@mui/material";
import HelpIcon from "../Icons/HelpIcon";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useUserStore } from "../../stores";
import { usersHooks } from "../../hooks";
import useLoadingStore from "../../stores/useLoadingStore";

export interface WarningProps {
  width?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: any;
  marginRight?: any;
  display?: "block" | "none";
}

const Warning: FC<WarningProps> = (props) => {
  //{user.as.split(":")[1]}

  const { mutateAsync: switchRole, success } = usersHooks.useSwichRole();
  usersHooks.useGetUser(success);

  const { data: isLoading } = usersHooks.useOtherUsers();
  const { isLoading: globalIsLoading } = useLoadingStore();

  const { user, setUser } = useUserStore();
  const userName = user?.code.split("_")[1];

  const { width, marginTop, marginBottom, marginLeft, marginRight, display } =
    props;
  return (
    <Box>
      {user?.as ? (
        <Box
          className="warning-box"
          sx={{
            width: `${width}px`,
            marginTop: `${marginTop}px`,
            marginBottom: `${marginBottom}px`,
            marginLeft: `${marginLeft}`,
            marginRight: `${marginRight}`,
            display: display,
          }}
        >
          <>
            <HelpIcon
              maxWidth={200}
              marginRight={10}
              float="left"
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
                    Switched Role
                  </p>
                  <p>
                    Click on the close icon at right top corner to switch back
                    to your user
                  </p>
                </>
              }
            />
            <span className="warning-bold">Warning:</span> You are logged in as
            <span className="warning-bold switched-user">
              {user.as.split(":")[1]}
            </span>
          </>
        </Box>
      ) : (
        <div></div>
      )}
    </Box>
  );
};

export default Warning;

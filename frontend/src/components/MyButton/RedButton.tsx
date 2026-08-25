import { Button } from "@mui/material";
import { FC } from "react";

const RedButton: FC<{
  onClick: Function;
  name: string | any;
  icon?: string | any;
  iconRight?: boolean;
  width?: string;
  height?: string;
  marginRight?: string;
  deleteButton?: boolean;
}> = (props) => {
  const {
    onClick,
    name,
    icon = "",
    iconRight = false,
    width = "140px",
    height = "30px",
    marginRight = "10px",
    deleteButton = false,
  } = props;

  /*@ts-ignore*/ return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        color: "white",
        cursor: "pointer",
        width: width,
        height: height,
        textAlign: "center",
        marginRight: marginRight,
        display: "inline-block",
        borderRadius: "4px !important",
        fontSize: "13px",
        textTransform: "none",
        fontWeight: "500",
        padding: "5.5px",
        MozBoxShadow: "inset 0px 1px 0px 0px #ff7569",
        WebkitBoxShadow: "inset 0px 1px 0px 0px #ff7569",
        boxShadow: "inset 0px 1px 0px 0px #ff7569",
        backgroundImage:
          "-webkit-gradient(linear, left top, left bottom, color-stop(0.05, #fb5347), color-stop(1, #c82014)) !important",
        filter:
          "progid:DXImageTransform.Microsoft.gradient(startColorstr='$button-alert-background', endColorstr='$button-alert-background-darker') !important",
        backgroundColor: "#fb5347",
        border: "1px solid #d93125",
        textShadow: "1px 1px 0px #ff6458",
        minWidth: "0px !important",
      }}
    >
      {iconRight ? (
        <>
          {name}
          <span className={icon}></span>
        </>
      ) : (
        <>
          <span className={icon}></span>
          {name}
        </>
      )}
    </Button>
  );
};

export default RedButton;

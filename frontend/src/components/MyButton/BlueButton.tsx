import { Button } from "@mui/material";
import { FC } from "react";

const BlueButton: FC<{
  onClick: Function;
  name: string;
  icon?: string;
  iconRight?: boolean;
  width?: string;
  height?: string;
  marginRight?: string;
  disabled?: boolean;
}> = (props) => {
  const {
    onClick,
    name,
    icon = "",
    iconRight = false,
    width = "140px",
    marginRight = "10px",
    height = "30px",
    disabled = false,
  } = props;

  /*@ts-ignore*/ return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        color: "white",
        backgroundColor: "#006DCC",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
        backgroundImage: "linear-gradient(to bottom, #08C, #04C) !important",
        borderColor: "#04C #04C #002A80 !important",
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
        minWidth: "0px",
        "& .Mui-disabled": {
          backgroundColor: "#006DCC",
          boxShadow: "none !important",
          backgroundImage: "none !important",
          color: "white !important",
          border: "1px solid #004baa",
        },
      }}
      disabled={disabled}
      style={disabled ? { opacity: "0.4", color: "white" } : {}}
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

export default BlueButton;

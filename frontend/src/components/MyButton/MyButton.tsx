import { Button } from "@mui/material";
import { FC } from "react";
import { useNavigate } from "react-router-dom";

const MyButton: FC<{
  navigateTo: string;
  name: string;
  icon?: string;
  iconRight?: boolean;
}> = (props) => {
  const { name, navigateTo, icon, iconRight = false } = props;
  const navigate = useNavigate();

  return (
    <Button
      variant="contained"
      onClick={() => navigate(navigateTo)}
      sx={{
        color: "white",
        backgroundColor: "#006DCC",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
        backgroundImage: "linear-gradient(to bottom, #08C, #04C) !important",
        borderColor: "#04C #04C #002A80 !important",
        cursor: "pointer",
        width: "140px",
        height: "30px",
        textAlign: "center",
        marginRight: "10px",
        display: "inline-block",
        borderRadius: "4px !important",
        fontSize: "13px",
        textTransform: "none",
        fontWeight: "500",
        padding: "5.5px",
        "&.Mui-disabled": {
          backgroundColor: "#006DCC",
          boxShadow: "none !important",
          backgroundImage: "none !important",
          color: "white !important",
          border: "1px solid #004baa",
        },
      }}
    >
      {iconRight ? (
        <>
          {name}
          {icon && <span className={icon}></span>}
        </>
      ) : (
        <>
          {icon && <span className={icon}></span>}
          {name}
        </>
      )}
    </Button>
  );
};

export default MyButton;

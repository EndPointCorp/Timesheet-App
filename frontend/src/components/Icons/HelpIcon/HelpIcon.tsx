import { FC, useState } from "react";
import helpIcon from "../../../assets/images/helpIcon.png";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const HelpIcon: FC<{
  text: string | any;
  margin?: number;
  marginLeft?: number;
  marginRight?: number;
  float?: "left" | "right";
  maxWidth?: number;
  textAlign?: "left" | "right";
  position?: "relative" | "static" | "sticky" | "absolute";
  left?: number;
  top?: number;
  height?: number;
}> = (props) => {
  const {
    text,
    margin = 0,
    marginLeft = 0,
    marginRight = 0,
    float,
    maxWidth = 0,
    textAlign,
    left,
    top,
    position,
    height,
  } = props;
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{
        float: float,
        margin: `${margin}px`,
        marginLeft: `${marginLeft}px`,
        marginRight: `${marginRight}px`,
        textAlign: textAlign,
        left: `${left}%`,
        top: `${top}%`,
        position: position,
        height: `${height}px`,
      }}
      onMouseEnter={() => {
        setVisible(true);
      }}
      onMouseLeave={() => {
        setVisible(false);
      }}
    >
      <HelpOutlineIcon sx={{ height: "20px", width: "20px" }} />
      <div
        style={{
          display: visible ? "" : "none",
          zIndex: 1000,
          color: "white",
          padding: "6px",
          position: "absolute",
          minWidth: "150px",
          maxWidth: `${maxWidth}px`,
          left: `${left}%`,
          top: `${top}%`,
          marginTop: "0px",
          textAlign: "left",
          backgroundColor: "black",
          opacity: "85%",
          fontSize: "14px",
          marginLeft: `${marginLeft}px`,
          marginRight: `${marginRight}px`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default HelpIcon;

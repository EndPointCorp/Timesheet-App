import { CircularProgress } from "@mui/material";
import React from "react";

const LoadingSpinner = () => {
  return (
    <React.Fragment>
      <svg width={0} height={0}>
        <defs>
          <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eb453d" />
            <stop offset="100%" stopColor="#f5aa3a" />
          </linearGradient>
        </defs>
      </svg>

      <CircularProgress
        sx={{
          padding: "5px",
          position: "absolute",
          zIndex: "10",
          "svg circle": { stroke: "url(#my_gradient)" },
        }}
      />
    </React.Fragment>
  );
};

export default LoadingSpinner;

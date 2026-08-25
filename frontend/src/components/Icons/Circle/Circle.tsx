import { FC, ReactElement } from "react";

const size = 30;

const Circle: FC<{ children: ReactElement }> = (props) => {
  const { children } = props;

  return (
    <div
      style={{
        display: "flex",
        borderRadius: "50%",
        borderColor: "rgba(0, 0, 0, 0.4)",
        borderStyle: "solid",
        borderWidth: "4px",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
};

export default Circle;

import { Box } from "@mui/material";
import { FC } from "react";

interface ListProps {
  name: string;
  list: Array<any> | undefined;
  chosenItem: string;
  setChosenItem: Function;
  displayLabel?: string;
}

const List: FC<ListProps> = (props) => {
  const {
    list,
    name,
    chosenItem,
    setChosenItem,
    displayLabel = "display_label",
  } = props;

  const handleTeamClick = (label: string) => {
    if (label === chosenItem) setChosenItem("all");
    else setChosenItem(label);
  };

  return (
    <Box
      sx={{
        width: "318px",
        backgroundColor: "#eee",
        padding: "12px",
        margin: "10px 0px",
        boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
        fontSize: "14px",
      }}
    >
      <p
        style={{
          color: "#76736c",
          fontFamily: '"Lato Bold", Helvetica, Arial, sans-serif',
          fontWeight: "bold",
          marginLeft: "2px",
        }}
      >
        {name}
      </p>

      {(list || []).map((item: any, key: number) => (
        <Box
          key={key}
          sx={{
            display: "inline-block",
            cursor: "pointer",
            color: item[displayLabel] === chosenItem ? "white" : "#76736C",
            fontWeight: "500",
            borderRadius: "4px",
            backgroundColor:
              item[displayLabel] === chosenItem ? "#006DCC" : "#E3E3E3",
            padding: "2px 16px",
            margin: "4px 4px",
            textAlign: "center",
            fontSize: "12px",
            WebkitBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
            MsBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
            MozBoxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
            boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.15)",
            backgroundImage:
              item[displayLabel] === chosenItem
                ? "linear-gradient(to bottom, #08C, #04C) !important"
                : "none",
            borderColor:
              item[displayLabel] === chosenItem
                ? "#04C #04C #002A80 !important"
                : "none",
          }}
          onClick={() => {
            handleTeamClick(item[displayLabel]);
          }}
        >
          {item[displayLabel]}
        </Box>
      ))}
    </Box>
  );
};

export default List;

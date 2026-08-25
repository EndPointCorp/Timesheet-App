import { TextField } from "@mui/material";
import React, { FC } from "react";

interface Props {
  searchValue: string;
  setSearchValue: (newValue: string) => void;
}

const EditorSearchField: FC<Props> = ({ searchValue, setSearchValue }) => {
  return (
    <TextField
      id="outlined-controlled"
      label="Search"
      size="small"
      value={searchValue}
      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
      }}
      sx={{
        backgroundColor: "white",
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          border: "1px solid #cccccc",
        },
        "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
          border: "1px solid #ccc",
        },
      }}
    />
  );
};

export default EditorSearchField;

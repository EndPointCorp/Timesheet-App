import { FC, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";
import { Role } from "../../types";
import CloseIcon from "@mui/icons-material/Close";
import LoadingSpinner from "../LoadingSpinner";
import List from "@mui/material/List";

const Root = styled("div")({
  color: "#ffffff",
  padding: "20px",
  borderRadius: "10px",
});

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    "& fieldset": {
      borderColor: "#004baa",
    },
    "&:hover fieldset": {
      borderColor: "#8a8a8a",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#ffffff",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#8a8a8a",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    display: "none",
  },
});

const StyledList = styled(List)({
  backgroundColor: "white",
  color: "black",
});

const StyledChip = styled(Chip)({
  backgroundImage: "linear-gradient(to bottom, #0098FF, #04C) !important",
  color: "#ffffff",
  margin: "5px",
  "& .MuiChip-deleteIcon": {
    color: "white",
  },
  "& .MuiChip-deleteIcon:hover": {
    color: "white",
  },
});

const StyledButton = styled(Button)({
  backgroundImage: "linear-gradient(to bottom, #0098FF, #04C) !important",
  color: "#ffffff",
  textTransform: "none",
  width: "100%",
  "&:hover": {
    backgroundColor: "#006dcc",
  },
  "&.Mui-disabled": {
    backgroundColor: "#003366",
    color: "#8a8a8a",
  },
});

type RolePickerProps = {
  addRolesToRight: (selectedRoles: Role[]) => void;
};

const RolePicker: FC<RolePickerProps> = ({ addRolesToRight }) => {
  const [roletags, setRoleTags] = useState<Role[]>([]);
  const [searchString, setSearchString] = useState<string>("");
  const { data: roles, isLoading, isError } = rolesEditorHooks.useRoles();

  const handleAddRolesToRight = () => {
    addRolesToRight(roletags);
    setRoleTags([]);
  };

  return (
    <Root>
      {/* Loading and Error Handling */}
      {isLoading && (
        <div style={{ paddingBottom: "30px" }}>
          <LoadingSpinner />
        </div>
      )}
      {isError && (
        <Alert severity="error">
          Failed to fetch roles. Please try again later.
        </Alert>
      )}
      {!isLoading && !isError && roles && (
        /*
                  <Autocomplete
            options={allTeams?.map(
              (
                team: { code: string; display_label: string },
                index: number
              ) => {
                return { value: team.code, label: team.display_label };
              }
            )}
            values={teams}
            setValues={setTeams}
            placeholder="Type to search through teams"
            triangle={false}
          />
         */
        <Autocomplete
          multiple
          options={roles}
          getOptionLabel={(option) => option.label}
          value={roletags}
          onChange={(event, newValue) => setRoleTags(newValue as Role[])}
          inputValue={searchString}
          onInputChange={(event, newInputValue) =>
            setSearchString(newInputValue)
          }
          renderInput={(params) => (
            <StyledTextField
              {...params}
              placeholder="Type to search through roles"
              variant="outlined"
              fullWidth
            />
          )}
          /*renderOption={(option, getOptionLabel) => <StyledList {...getOptionLabel} />} */
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <StyledChip
                label={option.label}
                {...getTagProps({ index })}
                deleteIcon={<CloseIcon />}
              />
            ))
          }
        />
      )}

      {/* Add Button */}
      <div style={{ marginTop: "10px" }}>
        <StyledButton
          variant="contained"
          onClick={handleAddRolesToRight}
          disabled={roletags.length === 0}
        >
          Add
        </StyledButton>
      </div>
    </Root>
  );
};

export default RolePicker;

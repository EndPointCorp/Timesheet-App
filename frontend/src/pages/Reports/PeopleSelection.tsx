import { useState, FC, useEffect } from "react";
import { Box } from "@mui/material";
import HelpIcon from "../../components/Icons/HelpIcon";
import Autocomplete from "../../components/Autocomplete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import {
  AutocompleteOption,
  PeopleOptionType,
} from "../../components/Autocomplete/Autocomplete";

const PeopleSelection: FC<{
  allRoles: Array<PeopleOptionType> | undefined;
  roles: Array<PeopleOptionType>;
  setRoles: Function;
}> = (props) => {
  const { allRoles, roles, setRoles } = props;
  const [searchAll, setSearchAll] = useState(false);
  const [autocompleteRoles, setAutocompleteRoles] = useState<
    Array<AutocompleteOption>
  >([]);

  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  useEffect(() => {
    setAutocompleteRoles(
      roles.map((role, index) => {
        return { value: role, label: role.display_label };
      }),
    );
  }, [roles]);

  const areRolesEqual = (
    roles1: Array<PeopleOptionType>,
    roles2: Array<PeopleOptionType>,
  ): boolean => {
    if (roles1.length !== roles2.length) return false;
    for (let i = 0; i < roles1.length; i++) {
      if (roles1[i].email !== roles2[i].email) return false;
    }
    return true;
  };

  const handleSetAutocompleteRoles = (
    newAutocompleteRoles: Array<AutocompleteOption>,
  ) => {
    setAutocompleteRoles(newAutocompleteRoles);
    const newRoles = newAutocompleteRoles.map(
      (autocompleteRole) => autocompleteRole.value,
    );
    if (!areRolesEqual(newRoles, roles)) {
      setRoles(newRoles);
    }
  };
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end" }}>
      <Box sx={{ width: "21px", height: "30px", paddingTop: "6px" }}>
        <HelpIcon
          maxWidth={250}
          text={
            <>
              <p>
                {" "}
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
                Users
              </p>
              <p>
                Start typing first letter of users to choose roles. Empty list
                will have reportable users by default
              </p>
            </>
          }
        />
      </Box>
      <Box sx={{ width: "269px", marginLeft: "3px" }}>
        <Autocomplete
          options={
            allRoles
              ? allRoles.reduce(
                  (
                    accumulator: Array<AutocompleteOption>,
                    person: PeopleOptionType,
                  ) => {
                    // Exclude users already selected
                    const isAlreadySelected = roles.some(
                      (role) => role.email === person.email,
                    );
                    if (
                      !isAlreadySelected &&
                      (searchAll || person.status_code === "enabled")
                    ) {
                      accumulator.push({
                        value: person,
                        label: person.display_label,
                      });
                    }
                    return accumulator;
                  },
                  [],
                )
              : []
          }
          values={autocompleteRoles}
          setValues={handleSetAutocompleteRoles}
          placeholder="People (leave empty to include all)"
          triangle={true}
          autoHighlight
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          width: "94px",
          fontSize: "11px",
          color: "#4d4d4d",
          cursor: "pointer",
          fontWeight: "500",
          backgroundColor: "#ccc",
          height: "30px",
        }}
        onClick={() => {
          setSearchAll(!searchAll);
        }}
      >
        <input
          type="checkbox"
          checked={searchAll}
          onChange={() => setSearchAll(!searchAll)}
          className="search-all-checkbox"
          style={{
            margin: 0,
            marginLeft: "4px",
            marginTop: isSafari() ? "7px" : "0px",
          }}
        ></input>
        <label
          style={{
            paddingBottom: "3px",
            margin: 0,
            float: "left",
            cursor: "pointer",
            marginLeft: "6px",
            marginRight: "2px",
            marginTop: "7px",
            fontSize: "9.5px",
          }}
        >
          search all
        </label>
        <Box sx={{ marginTop: "5px" }}>
          <HelpIcon
            maxWidth={250}
            marginLeft={2}
            marginRight={2}
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
                  Show all roles
                </p>
                <p>
                  Checking this option only allows you to search through all the
                  users in the system - including inactive. It does not mean
                  that the report will include the time billed by all the users.
                  If you want that effect - just leave the field empty, it will
                  not narrow the scope of the report to any user, making it
                  include all the timesheet entries.
                </p>
              </>
            }
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PeopleSelection;

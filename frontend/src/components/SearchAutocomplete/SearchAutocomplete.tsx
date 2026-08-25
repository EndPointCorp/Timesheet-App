import React, { useEffect, useState } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import { WorkChart } from "../../types";
import workchartHooks from "../../hooks/workchartHooks";

interface SearchAutocompleteProps {
  id?: string; // Make it optional and provide a default ID
  placeholder?: string; // Provide a default placeholder
  inputValue: string;
  onSelect: (chart: WorkChart | null) => void;
  setInputValue: (value: string) => void;
  inputClass?: string; // Optional input class for additional styling
  includeHidden?: boolean; // New property to toggle hidden charts
  includeDead?: boolean;
  // Set true when non-leaf work-chart nodes are valid targets (e.g. reporting
  // rights, site-management rights). Leave false for time-entry pickers that
  // require a leaf.
  includeNonleafs?: boolean;
}

const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  id = "default-autocomplete", // Default ID for the component
  placeholder = "Search...", // Default placeholder text
  onSelect,
  inputClass = "", // Default to an empty string if no class is provided
  inputValue,
  setInputValue,
  includeHidden = false, // Default to not showing hidden charts
  includeDead = false,
  includeNonleafs = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState<string>(""); // Controlled search term for debounce
  const { data: searchResults = [], isLoading } = workchartHooks.useGetSearch({
    term: searchTerm,
    includeHidden,
    includeDead,
    includeNonleafs,
  });

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Custom debounced effect for updating search term
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length >= 3) {
        setSearchTerm(inputValue);
      } else {
        setSearchTerm(""); // Clear search if input length is less than 3
      }
    }, 400); // 400ms delay

    return () => {
      clearTimeout(handler); // Clear timeout if input changes before delay completes
    };
  }, [inputValue]);

  return (
    <Autocomplete
      id={id}
      options={searchResults}
      getOptionLabel={(option: WorkChart) => option.label || ""}
      loading={isLoading}
      inputValue={inputValue}
      onInputChange={(event, value) => {
        if (event === null) return;
        setInputValue(value);
      }}
      onChange={(event, value) => onSelect(value)}
      PaperComponent={(props) => (
        <div
          {...props}
          style={{
            backgroundColor: "white",
            color: "black",
            border: "1px solid #ccc",
          }}
        />
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder={placeholder}
          variant="outlined"
          className={inputClass}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "white", // Set the background color to white
            },

            "& fieldset": {
              borderColor: "#004baa",
            },
            "&:hover fieldset": {
              borderColor: "#8a8a8a",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#ffffff",
            },

            "& .MuiInputLabel-root": {
              color: "#8a8a8a",
            },
          }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default SearchAutocomplete;

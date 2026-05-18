import { FC, SyntheticEvent, useEffect } from "react";
import useAutocomplete, {
  AutocompleteGetTagProps,
} from "@mui/base/useAutocomplete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { autocompleteClasses } from "@mui/material/Autocomplete";

const Root = styled("div")(
  ({ theme }) => `
    color: ${
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.65)"
        : "rgba(0,0,0,.85)"
    };
    font-size: 14px;
  `,
);

const InputWrapper = styled("div")(
  ({ theme }) => `
    width: 100%;
    background-color: ${theme.palette.mode === "dark" ? "#141414" : "#fff"};
    display: flex;
    flex-wrap: wrap;
    border-color: #b3b3b3;
    border: 1px solid #cccccc;
    border-radius: 2px;
    position: relative;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  
    &.focused {
      outline-width: 0;
    }
  
    & input {
      background-color: ${theme.palette.mode === "dark" ? "#141414" : "#fff"};
      color: ${
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.65)"
          : "rgba(0,0,0,.85)"
      };
      height: 28px;
      box-sizing: border-box;
      width: 0;
      min-width: 30px;
      flex-grow: 1;
      border: 0;
      margin: 0;
      outline: 0;
    }
  `,
);

interface TagProps extends ReturnType<AutocompleteGetTagProps> {
  label: string;
}

function Tag(props: TagProps) {
  const { label, onDelete, ...other } = props;
  return (
    <div {...other}>
      <span>{label}</span>
      <CloseIcon
        onClick={() => {
          onDelete(label);
        }}
      />
    </div>
  );
}

const StyledTag = styled(Tag)<TagProps>(
  ({ theme }) => `
    display: flex;
    align-items: center;
    height: 23px;
    margin: 2px;
    font: 14px;
    height: 23px;
    line-height: 22px;
    border-radius: 20px;
    background: linear-gradient(to bottom, #005cbb 0%, #005cbb 47%, #005cbb 100%);
    background-image: linear-gradient(to bottom, #0088cc, #0044cc) !important;
    color: #FFF;
    font-weight: bold;
    box-sizing: content-box;
    padding: 0 4px 0 10px;
    outline: 0;
    overflow: hidden;
  
 
  
    & span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  
    & svg {
      font-size: 12px;
      cursor: pointer;
      padding: 4px;
    }
  `,
);

const Listbox = styled("ul")(
  ({ theme }) => `
    
    margin: 2px 0 0;
    width: 365px;
    position: absolute;
    list-style: none;
    background-color: ${theme.palette.mode === "dark" ? "#141414" : "#fff"};
   
    overflow: auto;
    max-height: 250px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1;
  
    & li {
      padding: 5px 12px;
      display: flex;
  
      & span {
        flex-grow: 1;
      }
  
      & svg {
        color: transparent;
      }
    }
  
    & li[aria-selected='true'] {
      background-color: ${
        theme.palette.mode === "dark" ? "#2b2b2b" : "#fafafa"
      };
      font-weight: 600;
  
      & svg {
        color: #1890ff;
      }
    }
  
    & li.${autocompleteClasses.focused} {
      background-color: ${
        theme.palette.mode === "dark" ? "#FFFFFF" : "#0098FF"
      };
      color: #FFFFFF;
      background-image: linear-gradient(to bottom, #0098FF, #0044cc) !important;
      cursor: pointer;
  
      & svg {
        color: currentColor;
      }
    }
  `,
);

export interface AutocompleteOption {
  value: any;
  label: string;
}

export interface AutocompleteProps {
  options: Array<AutocompleteOption>;
  values: Array<AutocompleteOption>;
  setValues: Function;
  placeholder: string;
  triangle: boolean;
  autoHighlight?: boolean;
}

const Autocomplete: FC<AutocompleteProps> = (props) => {
  const {
    options,
    values,
    setValues,
    placeholder,
    triangle = true,
    autoHighlight = true,
  } = props;
  const opts = options ?? [];
  const vals = values ?? [];

  const {
    getRootProps,
    getInputLabelProps,
    getInputProps,
    getTagProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    value,
    focused,
    setAnchorEl,
  } = useAutocomplete({
    id: "customized-hook-demo",
    value: vals,
    multiple: true,
    options: opts,
    autoHighlight: autoHighlight,
    getOptionLabel: (option) => option.label,
    onChange: (event, newValue) => {
      setValues(newValue); // Update the value when an option is selected
    },
  });

  // useEffect(() => {
  //   setValues(value);
  // }, [value]);

  return (
    <Root>
      <div {...getRootProps()}>
        <InputWrapper ref={setAnchorEl} className={focused ? "focused" : ""}>
          {value.map((option: AutocompleteOption, index: number) => {
            return (
              <StyledTag label={option.label} {...getTagProps({ index })} />
            );
          })}
          {!focused && value?.length === 0 ? (
            <label
              style={{
                color: "#333",
                fontSize: "14px",
                margin: "2px",
              }}
            >
              {placeholder}
            </label>
          ) : null}
          <input {...getInputProps()} />
          {triangle && (
            <div
              style={{
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderWidth: "14px 10px 14px 0px",
                borderColor:
                  "transparent rgba(0, 0, 0, 0.2) transparent transparent",
                position: "absolute",
                right: 0,
                bottom: 0,

                pointerEvents: "none",
              }}
            ></div>
          )}
        </InputWrapper>
      </div>
      {groupedOptions?.length > 0 ? (
        <Listbox {...getListboxProps()} sx={{ paddingLeft: "0px" }}>
          {(groupedOptions as typeof options).map((option, index) => (
            <li {...getOptionProps({ option, index })}>
              <span>{option.label}</span>
              <CheckIcon fontSize="small" />
            </li>
          ))}
        </Listbox>
      ) : null}
    </Root>
  );
};

export interface PeopleOptionType {
  email: string;
  status_code: string;
  display_label: string;
}

type Target = {
  ref_obj_pk: number;
};

type Right = {
  id: number;
  code: string;
  targets: Target[];
};

export interface UserOptionType {
  id: number;
  email: string;
  status_code: string;
  name: string;
  myrights: Right[];
}

export default Autocomplete;

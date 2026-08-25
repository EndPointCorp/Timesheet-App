import { Box, Switch } from "@mui/material";
import { ChangeEvent, FC } from "react";
import "./index.css";

interface MySwitchProps {
  checked: boolean;
  setChecked: (checked: boolean) => void;
  label: string;
  ariaLabel?: string;
  dataTestId?: string;
  onToggle?: (checked: boolean) => void;
}

const MySwitch: FC<MySwitchProps> = ({
  checked,
  setChecked,
  label,
  ariaLabel,
  dataTestId,
  onToggle,
}) => {
  const handleChange = (_event: ChangeEvent<HTMLInputElement>, next: boolean) => {
    setChecked(next);
    onToggle?.(next);
  };

  const computedAriaLabel =
    ariaLabel || label?.trim() || "toggle";

  return (
    <Box>
      <p className="switch"> {label}</p>
      <Switch
        role="switch"
        data-testid={dataTestId}
        checked={checked}
        onChange={handleChange}
        inputProps={{ "aria-label": computedAriaLabel }}
        sx={{
          backgroundColor: checked ? "#55a4f2" : "",
          backgroundImage: checked
            ? "linear-gradient(to bottom, #0098FF, #04C)"
            : "",
        }}
      />
    </Box>
  );
};

export default MySwitch;

import { FC } from "react";
import "./index.css";

export interface TextInputProps {
  value: string;
  setValue: Function;
  marginBottom?: string;
  placeHolder?: string;
  password?: boolean;
  styles?: object;
}

const TextInput: FC<TextInputProps> = (props) => {
  const {
    value,
    setValue,
    marginBottom = "0",
    placeHolder = "",
    password = false,
  } = props;
  return (
    <input
      type={password ? "password" : "text"}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeHolder}
      className="text-input"
      style={{
        marginBottom: marginBottom,
      }}
    />
  );
};

export default TextInput;

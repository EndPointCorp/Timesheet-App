import { Stack } from "@mui/material";
import TextInput from "../../components/TextInput";
import React, { useEffect, useState } from "react";
import BlueButton from "../../components/MyButton/BlueButton";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";
import { useNavigate } from "react-router-dom";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";


const NewGroup = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const { mutateAsync: createGroup } = rolesEditorHooks.useCreateGroup();
  const [errors, setErrors] = useState<Array<string>>([]);

  const handleCreateGroup = async () => {
    const normalizedLabel = groupName.trim().toLowerCase();
    const res = await createGroup({
      label: normalizedLabel,
      code: code,
      description: description,
    });
      if (res && typeof res === "object" && "data" in res && res.data)

   {
    setErrors([]);
    setOpenSnackbar(true);
       setTimeout(() => {
          navigate("/groups-editor");
        }, 1500)
        ;
      }
      else if (
        res &&
        typeof res === "object" &&
        "response" in res &&
        res.response &&
        typeof res.response === "object" &&
        "data" in res.response &&
        res.response.data &&
        //@ts-ignore
        res.response.data.errors
      ){
        const errorData = res.response.data as { errors?: string[] };
        setErrors([...(errorData.errors || ["A group with that name already exists."])]);
      } else {
        setErrors(["A group with that name already exists."]);
      }

  };

    const [openSnackbar, setOpenSnackbar] = React.useState(false);
    const closeSnackbar = (
      event: React.SyntheticEvent | Event,
      reason?: SnackbarCloseReason,
    ) => {
      if (reason === "clickaway") {
        return;
      }
      setOpenSnackbar(false);
    };


  useEffect(() => {
    setCode(groupName.replace(/\s+/g, "_").toLowerCase());
  }, [groupName]);

  return (
    <Stack
      direction={"column"}
      sx={{
        width: "33.3%",
        padding: "20px",
        background: "#f2f2f2",
        border: "solid 1px #e6e6e6",
        margin: "auto",
        position: "absolute",
        left: "0",
        top: "10em",
        right: "0",
      }}
    >

              <Snackbar
                message="Group created!"
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={closeSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
              ></Snackbar>
                      {errors.length > 0 && (
                        <Stack
                          direction={"column"}
                          sx={{
                            marginBottom: "20px",
                          }}
                        >
                          {errors.map((error, index) => (
                            <p
                              key={error}
                              style={{
                                color: "#FF4300",
                                fontSize: "14px",
                                border: "1px solid #FF4300",
                                background: "#FFDDD0",
                                textAlign: "center",
                                padding: "12px",
                              }}
                            >
                              {error}
                            </p>
                          ))}
                        </Stack>
                      )}
      <TextInput
        value={groupName}
        setValue={setGroupName}
        marginBottom={"12px"}
        placeHolder="Group name"
      />
      <TextInput
        value={code}
        setValue={setCode}
        marginBottom={"12px"}
        placeHolder="Code - auto populated"
      />
      <TextInput
        value={description}
        setValue={setDescription}
        marginBottom={"12px"}
        placeHolder="Description"
      />
      <BlueButton
        name="Create group"
        onClick={handleCreateGroup}
        width="100%"
      />
    </Stack>
  );
};

export default NewGroup;

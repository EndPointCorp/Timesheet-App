import { Box, Stack } from "@mui/material";
import React, { useState } from "react";
import TextInput from "../../components/TextInput";
import rolesEditorHooks from "../../hooks/rolesEditorHooks";
import dayjs from "dayjs";
import BlueButton from "../../components/MyButton/BlueButton";
import { teamsHooks, usersHooks } from "../../hooks";
import Autocomplete from "../../components/Autocomplete";
import { AutocompleteOption } from "../../components/Autocomplete/Autocomplete";
import { useNavigate } from "react-router-dom";
import MyDatePicker2 from "../../components/MyDatePicker2";
import Warning from "../../components/Warning";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";

const NewUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [teams, setTeams] = useState(Array<AutocompleteOption>);
  const [joinDate, setJoinDate] = useState(dayjs());
  const [timeZone, setTimeZone] = useState("US/Eastern");
  const { data: timeZones } = rolesEditorHooks.useTimeZones();
  const { data: allTeams } = teamsHooks.useTeams();
  const { mutateAsync: createUser } = usersHooks.useCreateUser();
  const [errors, setErrors] = useState<Array<string>>([]);
  const navigate = useNavigate();

  const handleCreateUser = async () => {
    if (password === passwordConfirmation) {
      // Convert selected teams to the format expected by the server
      const selectedTeams = teams
        .map((team) => {
          // Find the full team object from allTeams
          const fullTeam = allTeams.find(
            (allTeam: { code: string }) => allTeam.code === team.value,
          );

          // Return only the code property as this is what the controller needs
          return fullTeam ? { code: fullTeam.code } : null;
        })
        .filter(Boolean) // Remove any null values
        .map((team) => ({ code: (team as any).code })); // Ensure we have the exact structure needed

      console.log("Selected teams being sent to server:", selectedTeams);

      const res = await createUser({
        name: name,
        email: email,
        time_zone_code: timeZone,
        start_date: joinDate.format("ddd MMM DD YYYY"),
        password: password,
        teams: selectedTeams,
      });

      if (
        res &&
        typeof res === "object" &&
        "data" in res &&
        res.data &&
        typeof res.data === "object" &&
        "id" in res.data
      ) {
        setErrors([]);
        // Show success toast
        setOpenSnackbar(true);

        // Redirect to roles editor after 1.5 seconds (matching AngularJS behavior)
        setTimeout(() => {
          navigate("/users-editor");
        }, 1500);
      } else if (
        res &&
        typeof res === "object" &&
        "response" in res &&
        res.response &&
        typeof res.response === "object" &&
        "data" in res.response &&
        res.response.data &&
        //@ts-ignore
        res.response.data.errors
      ) {
        const errorData = res.response.data as { errors?: string[] };
        setErrors([...(errorData.errors || ["An unknown error occurred."])]);
      } else {
        setErrors(["An unknown error occurred."]);
      }
    } else {
      setErrors(["Passwords do not match"]);
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

  return (
    <div>
      <Warning
        width={1000}
        marginTop={20}
        marginBottom={20}
        marginLeft={"auto"}
        marginRight={"auto"}
      />
      <Stack
        direction={"column"}
        sx={{
          width: { xs: "75%", md: "33.3%" },
          margin: "auto",
          position: "absolute",
          left: "0",
          top: "10em",
          right: "0",
        }}
      >
        <Snackbar
          message="User created!"
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
        <Stack
          direction={"column"}
          sx={{
            padding: "20px",
            background: "#f2f2f2",
            border: "solid 1px #e6e6e6",
            left: "0",
            top: "10em",
            right: "0",
          }}
        >
          <TextInput
            value={name}
            setValue={setName}
            marginBottom={"12px"}
            placeHolder="Name"
          />
          <TextInput
            value={email}
            setValue={setEmail}
            marginBottom={"12px"}
            placeHolder="Email"
          />
          <select
            value={timeZone}
            onChange={(event: any) => {
              setTimeZone(event.target.value);
            }}
            className="select-dropdown-menu time-zone-select"
          >
            {timeZones?.map((value: string, key: number) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
          <TextInput
            value={password}
            setValue={setPassword}
            password={true}
            marginBottom={"12px"}
            placeHolder="Password"
          />
          <TextInput
            value={passwordConfirmation}
            setValue={setPasswordConfirmation}
            marginBottom={"12px"}
            placeHolder="Password Confirmation"
            password={true}
          />

          <MyDatePicker2
            date={joinDate}
            setDate={setJoinDate}
            format="dddd, YYYY-MM-DD"
            value={joinDate}
            label="Set Joining Date"
            InputLabelProps={{
              shrink: false,
              style: {
                left: "30%",
                top: "-5%",
                width: "40%",
                textAlign: "center",
                transform: "translate(14px, -9px) scale(0.75)",
                backgroundColor: "rgba(255, 255, 255, 0.75)",
                borderRadius: "25px",
                boxShadow:
                  "12px 0 15px -4px rgba(255, 255, 255, 0.6), -12px 0 8px -4px rgba(255, 255, 255, 0.6)",
              },
            }}
          />

          <Autocomplete
            options={allTeams?.map(
              (
                team: { code: string; display_label: string },
                index: number,
              ) => {
                return { value: team.code, label: team.display_label };
              },
            )}
            values={teams}
            setValues={setTeams}
            placeholder="Type to search through teams"
            triangle={false}
          />
          <Box sx={{ height: "12px" }}></Box>
          <BlueButton
            name="Create User"
            onClick={() => {
              handleCreateUser();
            }}
            width="100%"
          />
        </Stack>
      </Stack>
    </div>
  );
};

export default NewUser;

import { FC, useState } from "react";
import Button from "@mui/material/Button";
import { usersHooks } from "../../hooks";
import { useUserStore } from "../../stores";
import {
  alpha,
  Box,
  Container,
  CssBaseline,
  InputBase,
  OutlinedInputProps,
  styled,
  TextField,
  TextFieldProps,
  Typography,
} from "@mui/material";
import { Navigate } from "react-router-dom";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import React from "react";
import "./Login.css";

const Login: FC = () => {
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const displaySnackbar = (openSnackbar: boolean) => {
    setOpenSnackbar(true);
  };
  const closeSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const { error: loadUserError, isLoading: isUserLoading } =
    usersHooks.useGetUser(loginSuccess);
  const { user } = useUserStore();
  const { isLoading: isCheckingSession } = usersHooks.useSession();

  const { mutateAsync: login, isLoading, error } = usersHooks.useLogin();

  const handleSubmit = async () => {
    const res = await login({
      email: email,
      password: password,
    });
    if (res?.success) {
      setLoginSuccess(true);
      console.log("Log in successful");
    } else {
      setLoginSuccess(false);
      console.log("Authentication failed");
      displaySnackbar(openSnackbar);
    }
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  if (isCheckingSession || isLoading || isUserLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Box sx={{ margin: "20px", padding: "15px" }}>
          {isCheckingSession
            ? "Checking your session, please wait."
            : "Logging in now, please wait."}
        </Box>
      </Box>
    );
  }

  if (error) {
    // @ts-ignore
    return <span>Error: {error?.message}</span>;
  }

  if (loadUserError) {
    // @ts-ignore
    return <span>Error: {loadUserError?.message}</span>;
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Snackbar
        message="Authentication failed. Incorrect username or password."
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ "&.MuiSnackbar-root": { marginTop: "40px" } }}
      ></Snackbar>

      <CssBaseline />
      <Box
        sx={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            mt: 1,
            backgroundColor: "#EEEEEE",
            border: "1px solid #cccccc",
            padding: "20px",
          }}
        >
          <TextField
            margin="normal"
            fullWidth
            id="email"
            placeholder="Email"
            name="email"
            autoComplete="email"
            autoFocus
            onChange={onChangeEmail}
            sx={{ backgroundColor: "white" }}
          />
          <TextField
            margin="normal"
            fullWidth
            name="password"
            placeholder="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={onChangePassword}
            sx={{ backgroundColor: "white" }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              textTransform: "none",
              backgroundImage:
                "linear-gradient(to bottom, #0098FF, #04C) !important",
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;

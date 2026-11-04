import Snackbar from "@mui/material/Snackbar";

type Props = { open: boolean; onClose: () => void };

// Shown when the server did not confirm a logout. The person is still logged
// in, so say that and say what to do.
const LogoutFailedSnackbar = ({ open, onClose }: Props) => (
  <Snackbar
    open={open}
    autoHideDuration={6000}
    onClose={onClose}
    anchorOrigin={{ vertical: "top", horizontal: "center" }}
    message="Could not log out. You are still logged in. Check your connection and try again."
  />
);

export default LogoutFailedSnackbar;

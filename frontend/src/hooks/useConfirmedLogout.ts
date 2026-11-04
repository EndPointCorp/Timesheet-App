import { useState } from "react";
import { usersHooks } from ".";
import { useUserStore } from "../stores";

// The behaviour of both Logout buttons (top bar and mobile menu). The person
// is logged out only after the server confirms. Until then they stay logged
// in, and if the server does not confirm, `failed` tells the button to say so.
const useConfirmedLogout = () => {
  const { setUser } = useUserStore();
  const { mutateAsync: signOut, isLoading: isLoggingOut } =
    usersHooks.useLogout();
  const [failed, setFailed] = useState(false);

  const logout = async (event?: { preventDefault: () => void }) => {
    // The button is a link to "/". Hold it back so the page does not move
    // until the server has answered.
    event?.preventDefault();
    const confirmed = await signOut();
    if (confirmed) setUser(null);
    setFailed(!confirmed);
  };

  return { logout, isLoggingOut, failed, dismiss: () => setFailed(false) };
};

export default useConfirmedLogout;

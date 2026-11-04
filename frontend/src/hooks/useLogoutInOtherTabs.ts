import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores";

// A logout in one tab writes "logout" to localStorage, and every other tab
// hears it as a "storage" event. Each tab keeps its own copy of the user in
// memory, so this tab has to forget it too. If it only moved to the login
// page, the login page would see the user still set and send the person
// straight back into the app with a session that no longer exists.
const useLogoutInOtherTabs = () => {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "logout") {
        setUser(null);
        navigate("/login");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [navigate, setUser]);
};

export default useLogoutInOtherTabs;

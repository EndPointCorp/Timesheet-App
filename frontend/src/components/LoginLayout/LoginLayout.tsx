import { useOutlet, Navigate } from "react-router-dom";
import { useUserStore } from "../../stores";

const LoginLayout = () => {
  const outlet = useOutlet();
  const { user } = useUserStore();

  if (user) {
    return <Navigate to="/" />;
  }
  return <div>{outlet}</div>;
};

export default LoginLayout;

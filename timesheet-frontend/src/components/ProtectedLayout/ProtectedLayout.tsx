import React from "react";
import { useUserStore } from "../../stores";
import { Navigate, useOutlet } from "react-router-dom";
import NavBar from "../NavBar";
import User from "../../types/user";
import useCheckPermissions from "../../hooks/useCheckPermissions";

interface ProtectedLayoutProps {
  requiredPermissions?: (keyof User)[];
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  requiredPermissions,
}) => {
  const { user } = useUserStore();
  const outlet = useOutlet();
  const hasPermission = useCheckPermissions(requiredPermissions);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirects to "/unauthorized" if any requiredPermissions exist and the user lacks permission.
  if ((requiredPermissions?.length ?? 0) > 0 && !hasPermission) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div style={{ paddingBottom: "50px" }}>
      <NavBar />
      {outlet}
    </div>
  );
};

export default ProtectedLayout;

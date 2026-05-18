import { useUserStore } from "../stores";
import User from "../types/user";

const useCheckPermissions = (permissions?: keyof User | (keyof User)[]) => {
  const { user } = useUserStore();

  // If there is no user (user is not logged in), return false
  if (!user) {
    return false;
  }

  // If no specific permissions are provided, return false
  if (!permissions) {
    return false;
  }

  // Check if the provided permissions parameter is an array of permissions
  if (Array.isArray(permissions)) {
    // If it is an array, check if the user has at least one of the permissions in the array
    return permissions.some((permission) => !!user[permission]);
  } else {
    // If it is a single permission, check if the user has that specific permission
    return !!user[permissions];
  }
};

export default useCheckPermissions;

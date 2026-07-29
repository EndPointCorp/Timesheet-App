import dayjs from "dayjs";
import { useUserStore } from "../stores";
import useCheckPermissions from "./useCheckPermissions";

export interface SettingItem {
  name: string;
  link: string;
  icon: string;
}

// Builds the Settings menu for the current (or assumed) user, keeping only the
// items they have the right to see. Shared by the desktop NavBar and the mobile
// NavDrawer so the two menus can't drift apart in either their contents or their
// permission gating.
const useSettingsMenu = (): SettingItem[] => {
  const { user } = useUserStore();
  const isManager = useCheckPermissions("is_manager");
  const isAdmin = useCheckPermissions("is_admin");
  const canEditCharts = useCheckPermissions("can_edit_charts");
  const canSwitchRoles = useCheckPermissions("can_switch_roles");
  const canCreateUsers = useCheckPermissions("can_create_users");
  const userName = user?.code.split("_")[1];

  const allSettings = [
    {
      name: "Roles editor",
      link: "/users-editor",
      icon: "icon-group",
      isShowSetting: isAdmin,
    },
    {
      name: "Edit work charts",
      link: "/work_charts/editor",
      icon: "icon-flow-tree",
      isShowSetting: canEditCharts,
    },
    {
      name: "Reports",
      link: "/reports",
      icon: "icon-doc-text",
      isShowSetting: true,
    },
    {
      name: "Switch role",
      link: "/switch-role",
      icon: "icon-flow-cross",
      isShowSetting: canSwitchRoles,
    },
    {
      name: "Create user",
      link: "/create_user",
      icon: "icon-user-plus",
      isShowSetting: canCreateUsers,
    },
    {
      name: "User calendar",
      link: `/calendar-user/${dayjs().format("YYYY/M")}/${userName}`,
      icon: "icon-calendar-inv",
      isShowSetting: isManager,
    },
  ];

  return allSettings
    .filter(({ isShowSetting }) => isShowSetting)
    .map(({ name, link, icon }) => ({ name, link, icon }));
};

export default useSettingsMenu;

import { Pagination, Stack } from "@mui/material";
import React, { FC, useEffect, useMemo } from "react";
import UserCard from "../../pages/RolesEditor/UserCard";

interface UserListProps {
  users: Array<any>;
  showInactive: boolean;
  teams: Array<any>;
  groups: Array<any>;
  chosenTeam: string;
  chosenGroup: string;
  searchValue: string;
  timeZones: Array<{ code: string; utc_offset: number }>;
}

const UserList: FC<UserListProps> = (props) => {
  const {
    users,
    showInactive,
    teams,
    groups,
    chosenTeam,
    chosenGroup,
    searchValue,
    timeZones,
  } = props;
  const [page, setPage] = React.useState(1);

  useEffect(() => {
    setPage(1);
  }, [chosenGroup, chosenTeam, searchValue, showInactive]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const status_code = showInactive ? "disabled" : "enabled";
        return (
          user.status_code === status_code &&
          user.name
            .toLocaleLowerCase()
            .includes(searchValue.toLocaleLowerCase()) &&
          (chosenGroup === "all" ||
            user.role_ids.includes(
              groups.find((group) => {
                return group.label === chosenGroup;
              }).id,
            )) &&
          (chosenTeam === "all" ||
            user.team_ids.includes(
              teams.find((team) => {
                return team.display_label === chosenTeam;
              }).role_id,
            ))
        );
      })
      .sort((a, b) => {
        // Sort alphabetically by name (case-insensitive)
        const an = (a.name || "").toLocaleLowerCase();
        const bn = (b.name || "").toLocaleLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        // Tie-breaker to keep ordering stable
        return (a.id || 0) - (b.id || 0);
      });
  }, [
    users,
    groups,
    teams,
    showInactive,
    chosenGroup,
    chosenTeam,
    searchValue,
  ]);

  const usersPage = useMemo(() => {
    const a = filteredUsers
      .slice((page - 1) * 8, Math.min(page * 8, filteredUsers.length))
      .map((user, index) => {
        return (
          <UserCard
            key={index}
            user={user}
            teams={teams}
            groups={groups}
            timeZones={timeZones}
          />
        );
      });
    return a;
  }, [page, filteredUsers, groups, teams, timeZones]);

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  return (
    <Stack direction="column">
      {usersPage}
      {filteredUsers.length > 0 && (
        <Pagination
          count={
            (filteredUsers.length - (filteredUsers.length % 8)) / 8 +
            (filteredUsers.length % 8 > 0 ? 1 : 0)
          }
          page={page}
          onChange={handleChange}
          variant="outlined"
          showFirstButton
          showLastButton
          sx={{
            paddingTop: "20px",
            "& .Mui-selected": {
              backgroundImage:
                "linear-gradient(to bottom, #0098FF, #04C) !important",
              color: "white",
            },
            "& .Mui-selected:hover": {
              color: "white!important",
            },
            "& .MuiPaginationItem-root:hover": {
              backgroundColor: "#dfdfdf",
              color: "#04C",
            },
            "& .MuiPaginationItem-root": {
              borderRadius: "4px",
            },
          }}
        />
      )}
    </Stack>
  );
};

export default UserList;

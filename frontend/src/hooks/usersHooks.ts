import { useMutation, useQuery, useQueryClient } from "react-query";
import { users as api } from "../api";
import { CreateUserParams, LoginParams } from "../api/users";
import { useUserStore } from "../stores";
import { QueryKeys } from "../types";
import { useState } from "react";
import useLoadingStore from "../stores/useLoadingStore";

const useLogin = () =>
  useMutation((params: LoginParams) => api.login(params), {});

const useLogout = () => useMutation(() => api.signOut(), {});

// Asks the server who is signed in and, if someone is, saves that user. Used
// by the login page so a session the browser forgot about is picked up instead
// of the person being stuck at a form the server will refuse.
const useSession = () => {
  const { setUser } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const session = await api.getSession();
      if (session.state === "signed-in") setUser(session.user);
      return session;
    },
    queryKey: [QueryKeys.GetSession],
    retry: false,
    refetchOnWindowFocus: false,
    cacheTime: 0,
  });
};

const useGetUser = (loginSuccess: boolean) => {
  const { setUser } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getUser();
      setUser(data?.data);
      return data?.data;
    },
    queryKey: [QueryKeys.GetUser, loginSuccess],
    retry: false,
    enabled: loginSuccess,
  });
};

const useGetAllRoles = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getAllRoles();
      if (data === undefined) return [];
      let res = [];
      for (let i = 0; i < data.data.length; i++) {
        res.push({
          status_code: data.data[i].status_code,
          display_label: data.data[i].display_label.substring(6),
          email: data.data[i].email,
        });
      }
      return res;
    },
    queryKey: [QueryKeys.AllRoles],
    retry: false,
    enabled: !!user,
  });
};

const useUsers = () => {
  const { user } = useUserStore();
  return useQuery({
    queryFn: async () => {
      const data = await api.getUsers();
      return data?.data;
    },
    queryKey: [QueryKeys.Users],
    retry: false,
    enabled: !!user,
  });
};

const useDetails = () => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();
  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      const data = await api.getDetails();
      setIsLoading(false);
      return data?.data;
    },
    queryKey: [QueryKeys.Details],
    retry: false,
    enabled: !!user,
  });
};

const useOtherUsers = () => {
  const { user } = useUserStore();
  const { setIsLoading } = useLoadingStore();
  return useQuery({
    queryFn: async () => {
      setIsLoading(true);
      const data = await api.getOtherUsers();
      setIsLoading(false);
      return data?.data;
    },
    queryKey: [QueryKeys.OtherUsers],
    retry: false,
    enabled: !!user,
  });
};

const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation((params: CreateUserParams) => api.createUser(params), {
    onSuccess: () => {
      // Invalidate the Details query to refresh the user list
      queryClient.invalidateQueries([QueryKeys.Details]);
    },
  });
};

const useSwichRole = () => {
  const [success, setSuccess] = useState<boolean>(false);
  const { setIsLoading } = useLoadingStore();
  const { setUser } = useUserStore();
  const queryClient = useQueryClient();

  const mutation = useMutation((email: string) => api.swichRole(email), {
    onSuccess: async (data) => {
      localStorage.removeItem("user");
      const userData = await api.getUser();
      setUser(userData?.data);
      setSuccess(true);
      setIsLoading(false);

      // Invalidate calendar cache to ensure fresh data after role switch
      queryClient.invalidateQueries([QueryKeys.Calendar]);
      queryClient.invalidateQueries([QueryKeys.Rows]);
      queryClient.invalidateQueries([QueryKeys.Pto]);
      queryClient.invalidateQueries([QueryKeys.getHoursSummary]);
      // Also invalidate entries-related queries so entry detail/list refetches
      queryClient.invalidateQueries([QueryKeys.Search]); // entries list
      queryClient.invalidateQueries([QueryKeys.Delete]); // entry detail by id
    },
    onError: () => {
      setSuccess(false);
    },
  });

  return { ...mutation, success };
};

const usersHooks = {
  useLogin,
  useLogout,
  useGetUser,
  useSession,
  useGetAllRoles,
  useUsers,
  useDetails,
  useCreateUser,
  useOtherUsers,
  useSwichRole,
};

export default usersHooks;

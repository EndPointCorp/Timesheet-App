import axios from "axios";
import qs from "qs";
import { URL } from "../constants";

export type LoginParams = {
  email: string | null;
  password: string | null;
};

const login = async (params: LoginParams) => {
  try {
    const res = await axios({
      method: "POST",
      url: `users/sign_in.json`,
      baseURL: URL,
      data: qs.stringify(
        {
          user: {
            ...params,
            remember_me: 1,
          },
        },
        {
          arrayFormat: "brackets",
        },
      ),
      withCredentials: false,
    });

    return res.data;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:15 ~ login ~ error:", error);
  }
};

const clearAllCookies = () => {
  // Get all cookies in an array
  const cookies = document.cookie.split(";");

  // Iterate through each cookie and delete it
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;

    // Delete the cookie by setting its expiration date in the past
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
  localStorage.removeItem("user");
};

const logout = async () => {
  try {
    const res = await axios({
      method: "DELETE",
      url: `users/sign_out.json`,
      baseURL: URL,
    });

    // Clear all cookies after logout
    clearAllCookies();

    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:15 ~ logout ~ error:", error);
  }
};

export const handleAutoLogout = async () => {
  await logout();

  // Broadcast logout to other tabs (the value doesn't matter; using timestamp helps trigger the event)
  localStorage.setItem("logout", Date.now().toString());

  // Redirect to the login page
  window.location.replace("/#/login");
};

let isLoggingOut = false; // Prevents multiple logouts at once

export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response, // Return response if successful
    (error) => {
      // Check if error response status is 401
      if (error.response && error.response.status === 401) {
        if (!isLoggingOut) {
          isLoggingOut = true;
          handleAutoLogout();
        }
      }
      return Promise.reject(error);
    },
  );
};

const getUser = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `users/current.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ getUser ~ error:", error);
  }
};

const getAllRoles = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `users/all_roles.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ getAllRoles ~ error:", error);
  }
};

const getUsers = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `users.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ getUsers ~ error:", error);
  }
};

const getDetails = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `users/details.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ getDetails ~ error:", error);
  }
};

const getOtherUsers = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: `users/others.json`,
      baseURL: URL,
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ getOtherUsers ~ error:", error);
  }
};

export type CreateUserParams = {
  name: string;
  email: string;
  time_zone_code: string;
  start_date: string;
  password: string;
  teams: Array<{ code: string }>;
};

const createUser = async (params: CreateUserParams) => {
  console.log("Teams sent to API:", params.teams);

  // The Rails controller expects teams as an object with numeric keys
  // It iterates with `params[:teams].each do |k, v|` which expects a hash structure
  let teamsObject: { [key: number]: { code: string } } = {};
  params.teams.forEach((team, index) => {
    teamsObject[index] = { code: team.code };
  });

  const formattedData = {
    ...params,
    teams: teamsObject,
  };

  console.log(
    "Formatted data being sent:",
    qs.stringify(formattedData, { arrayFormat: "brackets" }),
  );

  try {
    const res = await axios({
      method: "POST",
      url: `users`,
      baseURL: URL,
      data: qs.stringify(formattedData, {
        arrayFormat: "brackets",
      }),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ createUser ~ error:", error);
    return error;
  }
};

const swichRole = async (email: string) => {
  try {
    const res = await axios({
      method: "POST",
      url: `users/assume.json`,
      baseURL: URL,
      data: qs.stringify({
        email,
      }),
    });
    return res;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:43 ~ swichRole ~ error:", error);
  }
};

export {
  login,
  logout,
  getUser,
  getAllRoles,
  getUsers,
  getDetails,
  createUser,
  getOtherUsers,
  swichRole,
};

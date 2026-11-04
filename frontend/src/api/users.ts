import axios from "axios";
import qs from "qs";
import { URL } from "../constants";
import type { User } from "../types";

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

// Ends the session on the server. It is confirmed when the server says OK, or
// says 401, because a 401 means there is no session left to end. Anything else
// (a server error, no connection) is not confirmed, and nothing is cleared.
const logout = async (): Promise<boolean> => {
  try {
    await axios({
      method: "DELETE",
      url: `users/sign_out.json`,
      baseURL: URL,
      validateStatus: (status) =>
        status === 401 || (status >= 200 && status < 300),
    });

    // Clear all cookies after logout
    clearAllCookies();

    return true;
  } catch (error) {
    console.log("🚀 ~ file: users.ts:15 ~ logout ~ error:", error);
    return false;
  }
};

// The Logout button. The person stays logged in unless the server confirms,
// so the browser and the server never disagree about who is signed in.
// Returns whether it logged out.
export const signOut = async (): Promise<boolean> => {
  const confirmed = await logout();
  if (confirmed) {
    // Tell other tabs (the value doesn't matter; the change triggers the event)
    localStorage.setItem("logout", Date.now().toString());
  }
  return confirmed;
};

export const handleAutoLogout = async () => {
  await logout();

  // Broadcast logout to other tabs (the value doesn't matter; using timestamp helps trigger the event)
  localStorage.setItem("logout", Date.now().toString());

  // Redirect to the login page
  window.location.replace("/#/login");
};

let isLoggingOut = false; // Prevents multiple logouts at once

const logoutOnce = () => {
  if (!isLoggingOut) {
    isLoggingOut = true;
    handleAutoLogout();
  }
};

// The server answers 401 both when the session is gone and when a logged-in
// user is not allowed to do something. Only the first should end the session,
// so a 401 is checked against the same endpoint getUser uses. If the session is
// gone that request gets a 401 too, and the interceptor below logs out on it.
// One check at a time: a page load often gets several 401s together.
const SESSION_CHECK_URL = "users/current.json";
let sessionCheck: Promise<unknown> | null = null;

const checkSession = () => {
  if (sessionCheck || isLoggingOut) return;
  sessionCheck = axios({
    method: "GET",
    url: SESSION_CHECK_URL,
    baseURL: URL,
  })
    .catch(() => undefined)
    .finally(() => {
      sessionCheck = null;
    });
};

export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response, // Return response if successful
    (error) => {
      if (error.response && error.response.status === 401) {
        if (error.config && error.config.url === SESSION_CHECK_URL) {
          logoutOnce();
        } else {
          checkSession();
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

export type Session =
  | { state: "signed-in"; user: User }
  | { state: "signed-out" }
  | { state: "unknown" };

// Asks the server who is signed in. The server is the source of truth, not the
// browser's saved copy. A 401 here is an answer ("nobody"), not a failure, so
// it is accepted as a normal response. That keeps it away from the interceptor,
// which would otherwise treat it as an expired session and start a logout.
// If the server cannot answer at all, the result is "unknown" so the caller
// does not guess.
export const getSession = async (): Promise<Session> => {
  try {
    const res = await axios({
      method: "GET",
      url: SESSION_CHECK_URL,
      baseURL: URL,
      validateStatus: (status) =>
        status === 401 || (status >= 200 && status < 300),
    });
    return res.status === 401
      ? { state: "signed-out" }
      : { state: "signed-in", user: res.data };
  } catch (error) {
    return { state: "unknown" };
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

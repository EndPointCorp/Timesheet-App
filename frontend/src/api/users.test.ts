import type {
  AxiosAdapter,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type Reply = { status: number; data?: unknown; delayMs?: number };

// The module keeps its logout state at module level, so each test loads a fresh
// copy. The adapter stands in for the server and records every call it gets.
const load = (
  reply: (config: AxiosRequestConfig) => Reply,
  signedIn = true,
) => {
  jest.resetModules();
  const axios = require("axios").default;
  const users = require("./users");
  // The app keeps the signed in user here. Most tests are about a person who
  // is signed in when something goes wrong.
  const { useUserStore } = require("../stores");
  useUserStore.setState({ user: signedIn ? { id: 7 } : null });
  const calls: string[] = [];

  const adapter: AxiosAdapter = (config: InternalAxiosRequestConfig) =>
    new Promise((resolve, reject) => {
      const { status, data, delayMs = 0 } = reply(config);
      calls.push(`${String(config.method).toUpperCase()} ${config.url}`);
      setTimeout(() => {
        const response: AxiosResponse = {
          data,
          status,
          statusText: "",
          headers: {},
          config,
        };
        if (status === 0) {
          reject(
            Object.assign(new Error("Network Error"), {
              config,
              isAxiosError: true,
            }),
          );
          return;
        }
        const accepted = config.validateStatus
          ? config.validateStatus(status)
          : status >= 200 && status < 300;
        if (accepted) {
          resolve(response);
        } else {
          reject(
            Object.assign(new Error(`Request failed with status ${status}`), {
              response,
              config,
              isAxiosError: true,
            }),
          );
        }
      }, delayMs);
    });

  axios.defaults.adapter = adapter;
  users.setupAxiosInterceptors();
  return { axios, calls, useUserStore };
};

// A server where every request is refused with 401, and current.json says
// whether the session is still there.
const refusingServer =
  (sessionAlive: boolean) =>
  (config: AxiosRequestConfig): Reply => {
    if (config.url === "users/sign_out.json") return { status: 204 };
    if (config.url === "users/current.json") {
      return sessionAlive
        ? { status: 200, data: {}, delayMs: 30 }
        : { status: 401, delayMs: 30 };
    }
    return { status: 401 };
  };

const refusedRequest = (axios: any, url: string) =>
  axios({ method: "POST", url, baseURL: "/api" }).catch(() => undefined);

const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

const probes = (calls: string[]) =>
  calls.filter((call) => call === "GET users/current.json");

beforeEach(() => localStorage.clear());

describe("a 401 from the server", () => {
  it("keeps the user logged in when the session is still there", async () => {
    const { axios, calls } = load(refusingServer(true));

    await refusedRequest(axios, "users");
    await settle();

    expect(probes(calls)).toHaveLength(1);
    expect(calls).not.toContain("DELETE users/sign_out.json");
    expect(localStorage.getItem("logout")).toBeNull();
  });

  it("logs the user out when the session is gone", async () => {
    const { axios, calls } = load(refusingServer(false));

    await refusedRequest(axios, "users");
    await settle();

    expect(probes(calls)).toHaveLength(1);
    expect(calls).toContain("DELETE users/sign_out.json");
    expect(localStorage.getItem("logout")).not.toBeNull();
  });

  it("checks the session once when several requests are refused together", async () => {
    const { axios, calls } = load(refusingServer(true));

    await Promise.all(
      ["users", "work_days", "work_months", "ptos", "work_charts"].map((url) =>
        refusedRequest(axios, url),
      ),
    );
    await settle();

    expect(probes(calls)).toHaveLength(1);
    expect(calls).not.toContain("DELETE users/sign_out.json");
  });

  it("stops checking once it has started logging out", async () => {
    const { axios, calls } = load(refusingServer(false));

    await refusedRequest(axios, "users");
    await settle();
    await Promise.all([
      refusedRequest(axios, "work_days"),
      refusedRequest(axios, "ptos"),
    ]);
    await settle();

    expect(probes(calls)).toHaveLength(1);
  });

  it("logs out at once when the session check itself gets a 401", async () => {
    const { axios, calls } = load(refusingServer(false));

    await axios({
      method: "GET",
      url: "users/current.json",
      baseURL: "/api",
    }).catch(() => undefined);
    await settle();

    expect(probes(calls)).toHaveLength(1);
    expect(calls).toContain("DELETE users/sign_out.json");
  });
});

describe("asking the server who is signed in", () => {
  const ask = (reply: (config: AxiosRequestConfig) => Reply) => {
    const { calls } = load(reply);
    // load() resets modules, so take the function from the same fresh copy.
    const users = require("./users");
    return { calls, getSession: users.getSession };
  };

  it("returns the user when the session is alive", async () => {
    const { getSession } = ask(() => ({ status: 200, data: { id: 7 } }));

    expect(await getSession()).toEqual({
      state: "signed-in",
      user: { id: 7 },
    });
  });

  it("says signed out on a 401 and does not start a logout", async () => {
    const { getSession, calls } = ask(() => ({ status: 401 }));

    expect(await getSession()).toEqual({ state: "signed-out" });
    await settle();

    expect(calls).toEqual(["GET users/current.json"]);
    expect(localStorage.getItem("logout")).toBeNull();
  });

  it("says unknown when the server fails, so the page does not guess", async () => {
    const { getSession } = ask(() => ({ status: 500 }));

    expect(await getSession()).toEqual({ state: "unknown" });
  });
});

describe("the Logout button", () => {
  const signOutWith = (reply: (config: AxiosRequestConfig) => Reply) => {
    const { calls } = load(reply);
    const users = require("./users");
    localStorage.setItem("user", JSON.stringify({ id: 7 }));
    return { calls, signOut: users.signOut };
  };

  it("logs out when the server confirms", async () => {
    const { signOut } = signOutWith(() => ({ status: 204 }));

    expect(await signOut()).toBe(true);
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("logout")).not.toBeNull();
  });

  it("counts a 401 as logged out, because there is no session left", async () => {
    const { signOut } = signOutWith(() => ({ status: 401 }));

    expect(await signOut()).toBe(true);
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("keeps the user logged in when the server fails", async () => {
    const { signOut } = signOutWith(() => ({ status: 500 }));

    expect(await signOut()).toBe(false);
    expect(localStorage.getItem("user")).not.toBeNull();
    expect(localStorage.getItem("logout")).toBeNull();
  });

  it("keeps the user logged in when the server cannot be reached", async () => {
    const { signOut } = signOutWith(() => ({ status: 0 }));

    expect(await signOut()).toBe(false);
    expect(localStorage.getItem("user")).not.toBeNull();
    expect(localStorage.getItem("logout")).toBeNull();
  });
});

describe("an automatic logout, when the session has really ended", () => {
  const sessionGone =
    (signOutStatus: number) =>
    (config: AxiosRequestConfig): Reply => {
      if (config.url === "users/sign_out.json")
        return { status: signOutStatus };
      if (config.url === "users/current.json") return { status: 401 };
      return { status: 401 };
    };

  it("forgets the user even when the sign out call fails", async () => {
    const { axios, useUserStore } = load(sessionGone(500));
    localStorage.setItem("user", JSON.stringify({ id: 7 }));

    await refusedRequest(axios, "users");
    await settle();

    expect(useUserStore.getState().user).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("logs out again when the session ends a second time in the same page", async () => {
    const { axios, calls, useUserStore } = load(sessionGone(204));

    await refusedRequest(axios, "users");
    await settle();
    // The person signs in again without reloading the page.
    useUserStore.setState({ user: { id: 7 } });
    await refusedRequest(axios, "users");
    await settle();

    expect(
      calls.filter((call) => call === "DELETE users/sign_out.json"),
    ).toHaveLength(2);
    expect(useUserStore.getState().user).toBeNull();
  });

  it("ignores a 401 when nobody is signed in, like a wrong password", async () => {
    const { axios, calls } = load(sessionGone(204), false);

    await refusedRequest(axios, "users/sign_in.json");
    await settle();

    expect(calls).toEqual(["POST users/sign_in.json"]);
    expect(localStorage.getItem("logout")).toBeNull();
  });
});

describe("signing in", () => {
  const params = { email: "a@b.c", password: "x" };

  it("returns the server's answer when the sign in works", async () => {
    load(() => ({ status: 200, data: { success: true } }), false);
    const { login } = require("./users");
    expect(await login(params)).toEqual({ success: true });
  });

  it("says the password was refused when the server answers 401", async () => {
    load(() => ({ status: 401, data: { error: "Invalid" } }), false);
    const { login } = require("./users");
    expect(await login(params)).toEqual({
      success: false,
      problem: "refused",
    });
  });

  it("says the server could not be reached when there is no answer", async () => {
    load(() => ({ status: 0 }), false);
    const { login } = require("./users");
    expect(await login(params)).toEqual({
      success: false,
      problem: "unreachable",
    });
  });

  it("says the server could not be reached on a server error", async () => {
    load(() => ({ status: 500 }), false);
    const { login } = require("./users");
    expect(await login(params)).toEqual({
      success: false,
      problem: "unreachable",
    });
  });
});

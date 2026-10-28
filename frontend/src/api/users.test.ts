import type {
  AxiosAdapter,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type Reply = { status: number; data?: unknown; delayMs?: number };

// The module keeps its logout state at module level, so each test loads a fresh
// copy. The adapter stands in for the server and records every call it gets.
const load = (reply: (config: AxiosRequestConfig) => Reply) => {
  jest.resetModules();
  const axios = require("axios").default;
  const users = require("./users");
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
        if (status >= 200 && status < 300) {
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
  return { axios, calls };
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

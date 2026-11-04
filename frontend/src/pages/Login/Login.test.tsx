import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import Login from "./Login";
import { useUserStore } from "../../stores";
import { users } from "../../api";

jest.mock("../../api/users", () => ({
  ...jest.requireActual("../../api/users"),
  getSession: jest.fn(),
  login: jest.fn(),
}));

const getSession = users.getSession as jest.Mock;
const login = users.login as jest.Mock;

const openLoginPage = () => {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  localStorage.clear();
  useUserStore.setState({ user: null });
  getSession.mockReset();
  login.mockReset();
});

describe("the login page", () => {
  it("goes home when the server still has the session", async () => {
    getSession.mockResolvedValue({ state: "signed-in", user: { id: 7 } });

    openLoginPage();

    expect(await screen.findByText("home page")).toBeInTheDocument();
    expect(useUserStore.getState().user).toEqual({ id: 7 });
  });

  it("shows the form when the server says nobody is signed in", async () => {
    getSession.mockResolvedValue({ state: "signed-out" });

    openLoginPage();

    expect(await screen.findByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.queryByText("home page")).not.toBeInTheDocument();
  });

  it("shows the form when the server cannot be reached", async () => {
    getSession.mockResolvedValue({ state: "unknown" });

    openLoginPage();

    expect(await screen.findByPlaceholderText("Email")).toBeInTheDocument();
  });
});

describe("a sign in that does not work", () => {
  const trySigningIn = async () => {
    getSession.mockResolvedValue({ state: "signed-out" });
    openLoginPage();
    fireEvent.change(await screen.findByPlaceholderText("Email"), {
      target: { value: "a@b.c" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
  };

  it("blames the password when the server refused it", async () => {
    login.mockResolvedValue({ success: false, problem: "refused" });

    await trySigningIn();

    expect(
      await screen.findByText(/Incorrect username or password/),
    ).toBeInTheDocument();
  });

  it("says the server could not be reached, and does not blame the password", async () => {
    login.mockResolvedValue({ success: false, problem: "unreachable" });

    await trySigningIn();

    expect(
      await screen.findByText(/Could not reach the server/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Incorrect username or password/),
    ).not.toBeInTheDocument();
  });
});

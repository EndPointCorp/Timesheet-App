import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import Login from "./Login";
import { useUserStore } from "../../stores";
import { users } from "../../api";

jest.mock("../../api/users", () => ({
  ...jest.requireActual("../../api/users"),
  getSession: jest.fn(),
}));

const getSession = users.getSession as jest.Mock;

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

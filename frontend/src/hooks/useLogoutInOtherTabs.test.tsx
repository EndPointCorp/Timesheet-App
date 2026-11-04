import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import useLogoutInOtherTabs from "./useLogoutInOtherTabs";
import { useUserStore } from "../stores";

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter initialEntries={["/reports"]}>{children}</MemoryRouter>
);

// Another tab changes localStorage, and this tab hears about it as a
// "storage" event. Only a change made by another tab fires it.
const otherTabWrites = (key: string) =>
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  });

const mount = () =>
  renderHook(
    () => {
      useLogoutInOtherTabs();
      return useLocation();
    },
    { wrapper },
  );

beforeEach(() => {
  localStorage.clear();
  useUserStore.setState({ user: { id: 7 } as any });
});

describe("when another tab logs out", () => {
  it("forgets the user in this tab, so the login page cannot send it back", () => {
    mount();

    otherTabWrites("logout");

    expect(useUserStore.getState().user).toBeNull();
  });

  it("goes to the login page", () => {
    const { result } = mount();

    otherTabWrites("logout");

    expect(result.current.pathname).toBe("/login");
  });

  it("ignores other changes in local storage", () => {
    const { result } = mount();

    otherTabWrites("something-else");

    expect(useUserStore.getState().user).toEqual({ id: 7 });
    expect(result.current.pathname).toBe("/reports");
  });
});

import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactNode } from "react";
import useConfirmedLogout from "./useConfirmedLogout";
import { useUserStore } from "../stores";
import { users } from "../api";

jest.mock("../api/users", () => ({
  ...jest.requireActual("../api/users"),
  signOut: jest.fn(),
}));

const signOut = users.signOut as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const clickLogout = async (result: {
  current: ReturnType<typeof useConfirmedLogout>;
}) => {
  const event = { preventDefault: jest.fn() };
  await act(async () => {
    await result.current.logout(event);
  });
  return event;
};

beforeEach(() => {
  signOut.mockReset();
  useUserStore.setState({ user: { id: 7 } as any });
});

describe("the Logout button", () => {
  it("forgets the user once the server has confirmed", async () => {
    signOut.mockResolvedValue(true);
    const { result } = renderHook(() => useConfirmedLogout(), { wrapper });

    await clickLogout(result);

    expect(useUserStore.getState().user).toBeNull();
    expect(result.current.failed).toBe(false);
  });

  it("keeps the user and reports it when the server did not confirm", async () => {
    signOut.mockResolvedValue(false);
    const { result } = renderHook(() => useConfirmedLogout(), { wrapper });

    await clickLogout(result);

    expect(useUserStore.getState().user).toEqual({ id: 7 });
    expect(result.current.failed).toBe(true);
  });

  it("stops the link from navigating, so the page waits for the answer", async () => {
    signOut.mockResolvedValue(false);
    const { result } = renderHook(() => useConfirmedLogout(), { wrapper });

    const event = await clickLogout(result);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("clears the message when it is dismissed", async () => {
    signOut.mockResolvedValue(false);
    const { result } = renderHook(() => useConfirmedLogout(), { wrapper });
    await clickLogout(result);

    act(() => result.current.dismiss());

    expect(result.current.failed).toBe(false);
  });
});

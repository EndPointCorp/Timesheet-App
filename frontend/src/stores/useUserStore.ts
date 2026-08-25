import { create } from "zustand";
import { User } from "../types";

export type UserStore = {
  user: null | User;
  setUser: (user: User | null) => void;
};

const useUserStore = create<UserStore>((set) => {
  // Initialize user state from local storage
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  return {
    user,
    setUser: (user) => {
      set({ user });
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    },
  };
});

export default useUserStore;

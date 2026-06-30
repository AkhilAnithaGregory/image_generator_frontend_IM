import { create } from "zustand";

type User = {
  _id: string;
  username: string;
  email: string;
};

type AuthState = {
  user: User | null;
  token: string | null;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    set({ user, token });

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  logout: () => {
    set({ user: null, token: null });

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getAuthHeaders: () => {
    const token = get().token || localStorage.getItem("token");
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  },
}));
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import {
  performLogin,
  performLogout,
  performSignup,
  fetchCurrentUser,
} from "@/lib/auth";
import { getAccessToken } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await performLogin(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            token: data.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const data = await performSignup(name, email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            token: data.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await performLogout();
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            isLoading: false,
          });
        }
      },

      fetchUser: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        try {
          const user = await fetchCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      initialize: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        await get().fetchUser();
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

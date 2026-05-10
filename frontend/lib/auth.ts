import { createContext, useContext } from "react";
import { User, AuthResponse } from "@/types";
import { authApi, setTokens, clearTokens } from "./api";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

// Helper to get stored user
export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper to store user
export const storeUser = (user: User): void => {
  localStorage.setItem("user", JSON.stringify(user));
};

// Auth operations
/**
 * Backend returns AuthResponse with flat fields (token, userId, email, fullName, plan...).
 * Frontend's AuthResponse type expects { token, refreshToken, user }.
 * This adapter unifies them.
 */
function unwrapAuth(raw: Record<string, unknown>): AuthResponse {
  const d = (raw?.data ?? raw) as Record<string, unknown>;
  const user: User = {
    id: (d.userId as string) || (d.id as string) || "",
    email: (d.email as string) || "",
    name: (d.fullName as string) || (d.name as string) || "",
    fullName: (d.fullName as string) || "",
    plan: (d.plan as User["plan"]) || "FREE",
    profilePictureUrl: (d.profilePictureUrl as string) || undefined,
    streak: (d.dailyStreak as number) ?? 0,
    dailyStreak: (d.dailyStreak as number) ?? 0,
  };
  return {
    token: d.token as string,
    refreshToken: (d.refreshToken as string) || (d.token as string),
    user,
  };
}

export const performLogin = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await authApi.login(email, password);
  const data = unwrapAuth(response.data);
  setTokens(data.token, data.refreshToken);
  storeUser(data.user);
  return data;
};

export const performSignup = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await authApi.signup(name, email, password);
  const data = unwrapAuth(response.data);
  setTokens(data.token, data.refreshToken);
  storeUser(data.user);
  return data;
};

export const performLogout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch {
    // Ignore logout errors
  } finally {
    clearTokens();
  }
};

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await authApi.me();
  const d = (response.data?.data ?? response.data) as Record<string, unknown>;
  const user: User = {
    id: (d.userId as string) || (d.id as string) || "",
    email: (d.email as string) || "",
    name: (d.fullName as string) || (d.name as string) || "",
    fullName: (d.fullName as string) || "",
    plan: (d.plan as User["plan"]) || "FREE",
    profilePictureUrl: (d.profilePictureUrl as string) || undefined,
    streak: (d.dailyStreak as number) ?? 0,
    dailyStreak: (d.dailyStreak as number) ?? 0,
  };
  storeUser(user);
  return user;
};

// Score color helpers
export const getScoreColor = (score: number): string => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
};

export const getScoreBg = (score: number): string => {
  if (score >= 80) return "bg-green-500/20 border-green-500/30";
  if (score >= 60) return "bg-yellow-500/20 border-yellow-500/30";
  return "bg-red-500/20 border-red-500/30";
};

export const getScoreLabel = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Work";
  return "Poor";
};

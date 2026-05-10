"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    fetchUser,
    updateUser,
    initialize,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    fetchUser,
    updateUser,
  };
}

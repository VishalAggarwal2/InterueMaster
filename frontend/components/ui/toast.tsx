"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#18181b",
          color: "#f4f4f5",
          border: "1px solid #3f3f46",
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "inherit",
        },
        success: {
          iconTheme: {
            primary: "#6366f1",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}

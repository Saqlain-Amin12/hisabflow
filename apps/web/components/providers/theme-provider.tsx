"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return <>{children}</>;
}

export const useTheme = () => ({ theme: "light" as const, setTheme: () => {}, resolvedTheme: "light" as const });

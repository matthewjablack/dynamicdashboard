"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Utility function to get initial theme
const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
    // If no saved theme, check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  return "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  console.log("[ThemeProvider] Rendering");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Handle initial theme setup and localStorage sync
  useEffect(() => {
    console.log("[ThemeProvider] Mounted");
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    console.log("[ThemeProvider] Toggling theme");
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    // Immediately update the DOM to prevent flash
    const root = window.document.documentElement;
    root.classList.remove(theme);
    root.classList.add(newTheme);
  };

  console.log("[ThemeProvider] Rendering with theme:", theme);
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  console.log("[useTheme] Called from:", new Error().stack?.split("\n")[2]);
  const context = useContext(ThemeContext);
  if (context === undefined) {
    console.error("[useTheme] Context is undefined. Make sure useTheme is called within a ThemeProvider");
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

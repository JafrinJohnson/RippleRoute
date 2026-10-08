"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "rippleroute_theme";
const ACCENT_STORAGE_KEY = "rippleroute_accent";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("violet");
  const [mounted, setMounted] = useState(false);

  // Load persisted theme & accent safely on client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        const savedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);

        const initialTheme = savedTheme === "light" ? "light" : "dark";
        const initialAccent = ["violet", "cyan", "pink"].includes(savedAccent)
          ? savedAccent
          : "violet";

        setTheme(initialTheme);
        setAccent(initialAccent);

        // Apply to <html> tag
        document.documentElement.setAttribute("data-theme", initialTheme);
        document.documentElement.setAttribute("data-accent", initialAccent);
        if (initialTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (err) {
      console.warn("Theme storage access warning:", err);
    } finally {
      setMounted(true);
    }
  }, []);

  const changeTheme = (newTheme) => {
    const next = newTheme === "light" ? "light" : "dark";
    setTheme(next);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, next);
        document.documentElement.setAttribute("data-theme", next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (err) {
      console.warn("Failed saving theme to localStorage:", err);
    }
  };

  const toggleTheme = () => {
    changeTheme(theme === "dark" ? "light" : "dark");
  };

  const changeAccent = (newAccent) => {
    if (!["violet", "cyan", "pink"].includes(newAccent)) return;
    setAccent(newAccent);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
        document.documentElement.setAttribute("data-accent", newAccent);
      }
    } catch (err) {
      console.warn("Failed saving accent to localStorage:", err);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: changeTheme,
        toggleTheme,
        accent,
        setAccent: changeAccent,
        isDark: theme === "dark",
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

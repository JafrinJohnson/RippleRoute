"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getTranslation } from "@/lib/i18n";

const LanguageContext = createContext(null);

const LANG_STORAGE_KEY = "rippleroute_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(LANG_STORAGE_KEY);
        const initialLang = saved === "ta" ? "ta" : "en";
        setLanguageState(initialLang);
        document.documentElement.setAttribute("lang", initialLang);
        document.documentElement.setAttribute("data-lang", initialLang);
      }
    } catch (err) {
      console.warn("Language storage access warning:", err);
    } finally {
      setMounted(true);
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    const nextLang = lang === "ta" ? "ta" : "en";
    setLanguageState(nextLang);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LANG_STORAGE_KEY, nextLang);
        document.documentElement.setAttribute("lang", nextLang);
        document.documentElement.setAttribute("data-lang", nextLang);
      }
    } catch (err) {
      console.warn("Failed saving language preference:", err);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ta" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (key) => {
      return getTranslation(language, key);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isTamil: language === "ta",
        mounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

"use client";

// =============================================================================
// Nzzor — Language Context
// Provides the current language + a translate function `t(key)` to the whole
// app. Choice is persisted in localStorage so it survives page navigation.
// =============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { STRINGS } from "./strings";

const LangContext = createContext({ lang: "en", setLang: () => {}, t: (k) => k });

const STORAGE_KEY = "nzzor_lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("en");

  // load saved language on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fr") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    // reflect on <html lang="..."> for accessibility / SEO
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
    }
  }, []);

  // translate function
  const t = useCallback(
    (key) => {
      const entry = STRINGS[key];
      if (!entry) return key; // missing key — show the key so it's obvious
      return entry[lang] || entry.en || key;
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

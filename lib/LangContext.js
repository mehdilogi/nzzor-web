"use client";

// =============================================================================
// Nzzor — Language Context
// Provides the current language, a translate function `t(key)`, and the text
// direction (rtl for Arabic, ltr otherwise) to the whole app.
// Choice is persisted in localStorage so it survives page navigation.
// =============================================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { STRINGS } from "./strings";

const LANGS = ["en", "fr", "ar"];
const RTL_LANGS = ["ar"];
const STORAGE_KEY = "nzzor_lang";

const LangContext = createContext({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  t: (k) => k,
});

// Apply <html lang> and <html dir> so the browser mirrors layout for RTL.
function applyHtml(lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("en");

  // load saved language on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(saved)) {
        setLangState(saved);
        applyHtml(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    applyHtml(l);
  }, []);

  const t = useCallback(
    (key) => {
      const entry = STRINGS[key];
      if (!entry) {
        // Missing key. In development, return the raw key so it's glaringly
        // obvious which string needs adding (this is how we catch them). In
        // production, humanize the last segment so a real visitor never sees
        // something like "search.room" — they get "Room" instead.
        if (process.env.NODE_ENV === "production") {
          const seg = String(key).split(".").pop().replace(/_/g, " ");
          return seg.charAt(0).toUpperCase() + seg.slice(1);
        }
        return key;
      }
      return entry[lang] || entry.en || key;
    },
    [lang]
  );

  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

  return (
    <LangContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

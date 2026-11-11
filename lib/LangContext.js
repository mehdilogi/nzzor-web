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
// French is the site's reference language (with Arabic, Art. 7.2.2 of the
// merchant agreement) and the language Google should index. The server always
// renders French; a visitor's saved choice is applied after the page has
// hydrated. Defaulting to "en" here made the server send English while the
// browser switched to French: six React hydration errors on every load, an
// English page for Google under <html lang="fr">, and a flash of English.
const DEFAULT_LANG = "fr";

// Corrections that win over lib/strings.js, keyed by string key.
// - why.pay_*: CIB and Edahabia only (Art. 5: no international cards).
const OVERRIDES = {
  "why.pay_t": {
    fr: "Payez en CIB ou Edahabia",
    en: "Pay with CIB or Edahabia",
    ar: "ادفع ببطاقة CIB أو الذهبية",
  },
  "why.pay_d": {
    fr: "Paiement sécurisé par la SATIM, sur le réseau interbancaire algérien. Vos données de carte ne passent jamais par Nzzor.",
    en: "Secure payment through SATIM, on Algeria's interbank network. Your card details never pass through Nzzor.",
    ar: "دفع آمن عبر SATIM على الشبكة ما بين البنوك الجزائرية. بيانات بطاقتك لا تمر أبداً عبر Nzzor.",
  },
};

// Strings that exist in English only. When a key has no translation for the
// current language, its English text is looked up here before falling back
// to English. Add a line whenever English shows through on a French page.
const BY_ENGLISH = {
  "Add dates": { fr: "Ajouter des dates", ar: "أضف التواريخ" },
};
const RTL_LANGS = ["ar"];
const STORAGE_KEY = "nzzor_lang";

const LangContext = createContext({
  lang: DEFAULT_LANG,
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
  // Same value on the server and on the first client render, so hydration
  // matches. The saved choice is applied in the effect below, after hydration.
  const [lang, setLangState] = useState(DEFAULT_LANG);

  // load saved language on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(saved) && saved !== DEFAULT_LANG) {
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
      const entry = OVERRIDES[key] || STRINGS[key];
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
      if (entry[lang]) return entry[lang];
      const en = entry.en;
      if (en && BY_ENGLISH[en] && BY_ENGLISH[en][lang]) return BY_ENGLISH[en][lang];
      return en || entry.fr || key;
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

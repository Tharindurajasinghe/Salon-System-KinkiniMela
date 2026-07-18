"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { getDictionary, SUPPORTED_LANGS, DEFAULT_LANG } from "@/lib/i18n";

/**
 * LanguageProvider
 * ----------------
 * Provides the current language + dictionary to the whole app and a toggle
 * used by the navbar language switcher. The choice is stored in a cookie so
 * the server can read it on the next request (SSR-safe, no localStorage as DB).
 *
 * Usage in a component:
 *   const { t, lang, setLang } = useLanguage();
 *   <h1>{t("nav.home")}</h1>
 */
const LanguageContext = createContext(null);

// Read "key.path.value" out of the nested dictionary object.
function resolve(dict, path) {
  return path.split(".").reduce((obj, key) => (obj ? obj[key] : undefined), dict) ?? path;
}

export function LanguageProvider({ initialLang = DEFAULT_LANG, children }) {
  const [lang, setLangState] = useState(
    SUPPORTED_LANGS.includes(initialLang) ? initialLang : DEFAULT_LANG
  );

  const dict = getDictionary(lang);

  const setLang = useCallback((next) => {
    if (!SUPPORTED_LANGS.includes(next)) return;
    setLangState(next);
    // Persist for one year so SSR picks it up next visit.
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }, []);

  // Translation helper.
  const t = useCallback((path) => resolve(dict, path), [dict]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

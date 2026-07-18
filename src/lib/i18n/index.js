import en from "./dictionaries/en";
import si from "./dictionaries/si";

// Registry of all supported languages.
export const dictionaries = { en, si };
export const SUPPORTED_LANGS = ["en", "si"];
export const DEFAULT_LANG = "en";

/** Safely resolve a dictionary for a language code. */
export function getDictionary(lang) {
  return dictionaries[lang] || dictionaries[DEFAULT_LANG];
}

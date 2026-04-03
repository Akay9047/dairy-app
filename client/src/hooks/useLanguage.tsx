import { createContext, useContext, useState, useEffect } from "react";
import { Language, t as translate } from "../lib/i18n";

interface LangContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: Parameters<typeof translate>[1]) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "hinglish",
  setLang: () => {},
  t: (k) => k as string,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("dairy_lang");
    return (stored as Language) ?? "hinglish";
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("dairy_lang", l);
  };

  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  return useContext(LangContext);
}

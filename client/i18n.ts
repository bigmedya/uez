import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tr from "./locales/tr.json";
import en from "./locales/en.json";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

const savedLang = typeof window !== "undefined" ? localStorage.getItem("uez-lang") : null;
const initialLang = savedLang === "en" || savedLang === "tr" ? savedLang : "tr";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: "tr",
  supportedLngs: ["tr", "en"],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("uez-lang", lng);
  }
});

export default i18n;

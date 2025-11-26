import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';

const resources = {
  en: {
    translation: translationEN,
  },
  fr: {
    translation: translationFR,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'fr', // Fallback to French
    debug: true, // Enable debug to see what's happening

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser language
      caches: ['localStorage'], // Cache language choice in localStorage
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

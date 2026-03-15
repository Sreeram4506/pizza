import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationEN from './locales/en/translation.json';
import translationIT from './locales/it/translation.json';
import translationES_MX from './locales/es-MX/translation.json';
import translationES_AR from './locales/es-AR/translation.json';
import translationPT from './locales/pt/translation.json';
import translationUR from './locales/ur/translation.json';
import translationAR from './locales/ar/translation.json';

const resources = {
  en: { translation: translationEN },
  it: { translation: translationIT },
  'es-MX': { translation: translationES_MX },
  'es-AR': { translation: translationES_AR },
  pt: { translation: translationPT },
  ur: { translation: translationUR },
  ar: { translation: translationAR }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie']
    }
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import hi from './locales/hi.json';
import kn from './locales/kn.json';
import en from './locales/en.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import ml from './locales/ml.json';
import or from './locales/or.json';

const resources = {
  hi: { translation: hi },
  kn: { translation: kn },
  en: { translation: en },
  ta: { translation: ta },
  te: { translation: te },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu },
  pa: { translation: pa },
  ml: { translation: ml },
  or: { translation: or },
};

const savedLang = localStorage.getItem('vridhi_language');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang || 'hi', // Default to Hindi on first visit as strictly required
    fallbackLng: 'hi',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'vridhi_language',
      caches: ['localStorage']
    }
  });

export default i18n;

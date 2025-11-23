import { useState, useEffect } from 'react';
import { translations, Language } from '../lib/translations';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    // Charger la langue depuis localStorage
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    } else {
      // Détecter la langue du navigateur
      const browserLang = navigator.language.split('-')[0] as Language;
      if (translations[browserLang]) {
        setLanguage(browserLang);
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return {
    language,
    changeLanguage,
    t: translations[language]
  };
}

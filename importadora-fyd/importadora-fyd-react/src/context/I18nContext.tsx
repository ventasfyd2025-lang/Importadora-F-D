'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations } from '@/lib/i18n';

type Language = 'es' | 'en';
type Translations = typeof translations.es;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export { I18nContext };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  // Detect browser language on initial load
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (browserLang === 'en' || browserLang === 'es') {
      setLanguage(browserLang);
    }
  }, []);

  const t = (key: string): string => {
    const translationsForLang = translations[language];
    return translationsForLang[key as keyof Translations] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
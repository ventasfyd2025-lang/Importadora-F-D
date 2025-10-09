'use client';

import React, { useContext } from 'react';
import { useI18n } from '@/context/I18nContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white"
      aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#F16529]">
        {language === 'es' ? 'ES' : 'EN'}
      </span>
      <span className="hidden sm:inline">
        {language === 'es' ? 'English' : 'Español'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '@/services/storage';

import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const translations: Record<Language, any> = { fr, en };

export type Language = 'fr' | 'en';

interface I18nContextType {
  t: (path: string) => string;
  locale: Language;
  toggleLanguage: () => void;
}

export const I18nContext = createContext<I18nContextType>({
  t: (key) => key,
  locale: 'fr',
  toggleLanguage: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Language>('fr');

  useEffect(() => {
    storage.getItem<Language>(STORAGE_KEYS.LOCALE || 'locale').then(l => {
      if (l) setLocale(l);
    });
  }, []);

  const t = useCallback((path: string) => {
    const keys = path.split('.');
    let value: any = translations[locale];
    for (const key of keys) {
      value = value?.[key];
    }
    return value || path;
  }, [locale]);

  const toggleLanguage = () => {
    const next = locale === 'fr' ? 'en' : 'fr';
    setLocale(next);
    storage.setItem(STORAGE_KEYS.LOCALE || 'locale', next);
  };

  return (
    <I18nContext.Provider value={{ t, locale, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

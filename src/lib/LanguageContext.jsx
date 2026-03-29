import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import en from './i18n/en';
import es from './i18n/es';
import he from './i18n/he';

const translations = { en, es, he };

const LanguageContext = createContext();

// Resolve a dot-notation key (e.g. 'status.pending') against a translations object.
// If vars are provided, replace {placeholder} tokens in the result.
function resolve(dict, key, vars) {
  const keys = key.split('.');
  let val = dict;
  for (const k of keys) {
    val = val?.[k];
    if (val === undefined) return key; // fallback: return the key itself
  }
  if (typeof val !== 'string') return key;
  if (vars) {
    return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
  }
  return val;
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState('en');

  // Load language from the logged-in user's profile on mount
  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user?.language && translations[user.language]) {
          setLangState(user.language);
        }
      })
      .catch(() => {});
  }, []);

  // Apply dir and lang attributes to the document root for RTL support
  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Save new language to user profile and update local state
  const setLanguage = async (newLang) => {
    if (!translations[newLang]) return;
    setLangState(newLang);
    try {
      await base44.auth.updateMe({ language: newLang });
    } catch {
      // Silently fail — the UI still updates immediately
    }
  };

  const t = (key, vars) => resolve(translations[lang] || en, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

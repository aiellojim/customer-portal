// src/lib/i18n.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import zhTW from '../locales/zh-TW.js';
import en   from '../locales/en.js';

const PACKS = { 'zh-TW': zhTW, en };

export const LOCALES = [
  { code: 'zh-TW', label: '繁中' },
  { code: 'en',    label: 'EN'   },
  // { code: 'ja', label: '日本語' },  ← Phase 6 補上
];

// 從 localStorage / navigator.language 取預設語系
function detectLocale() {
  const saved = localStorage.getItem('cp-locale');
  if (saved && PACKS[saved]) return saved;
  const nav = navigator.language;
  if (nav.startsWith('zh')) return 'zh-TW';
  if (nav.startsWith('ja')) return 'ja';
  return 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const setLocale = useCallback((code) => {
    if (!PACKS[code]) return;
    localStorage.setItem('cp-locale', code);
    setLocaleState(code);
    // 更新 html lang 屬性
    document.documentElement.lang = code;
  }, []);

  // t('key') or t('key', { n: 3, email: 'a@b.com' })
  const t = useCallback((key, vars = {}) => {
    const pack = PACKS[locale] ?? PACKS['en'];
    let str = pack[key] ?? PACKS['en'][key] ?? key;
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  }, [locale]);

  // 日期格式跟著語系走
  const fmtDate = useCallback((dateStr) => {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'numeric', day: 'numeric',
    }).format(new Date(dateStr));
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, fmtDate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

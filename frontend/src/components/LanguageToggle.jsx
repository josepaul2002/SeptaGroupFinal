import { createContext, useContext, useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (text) => text,
  langMode: 'english_only',
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('septa-lang') || 'en');
  const [langMode, setLangMode] = useState('english_only');

  useEffect(() => {
    axios.get(`${API}/settings`).then(r => {
      const mode = r.data?.content_language_mode || 'english_only';
      setLangMode(mode);
      if (mode === 'english_only') setLang('en');
      else if (mode === 'malayalam_primary') setLang('ml');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('septa-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Content translation: respects language mode
  const t = (text) => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    if (typeof text === 'object') {
      if (langMode === 'english_only') return text.en || '';
      if (langMode === 'malayalam_primary') return text.ml || text.en || '';
      // toggle mode
      return text[lang] || text.en || '';
    }
    return String(text);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, langMode }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Toggle only shows when langMode is 'toggle'
export default function LanguageToggle({ className = "" }) {
  const { lang, setLang, langMode } = useLanguage();

  if (langMode !== 'toggle') return null;

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
      className={`flex items-center gap-2 text-xs font-inter transition-colors ${className}`}
      data-testid="language-toggle"
      aria-label={`Switch to ${lang === 'en' ? 'Malayalam' : 'English'}`}
    >
      <Globe size={14} strokeWidth={1.5} />
      <span className="uppercase tracking-wider">{lang === 'en' ? 'മലയാളം' : 'EN'}</span>
    </button>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

// Language context
const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (text) => text
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// Language provider
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Check localStorage or default to English
    const saved = localStorage.getItem('septa-lang');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('septa-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Translation helper - gets text from bilingual object
  const t = (text) => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    if (typeof text === 'object') {
      return text[lang] || text.en || '';
    }
    return String(text);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Language toggle button
export default function LanguageToggle({ className = "" }) {
  const { lang, setLang } = useLanguage();

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ml' : 'en');
  };

  return (
    <button
      onClick={toggleLang}
      className={`flex items-center gap-2 text-xs font-inter transition-colors ${className}`}
      data-testid="language-toggle"
      aria-label={`Switch to ${lang === 'en' ? 'Malayalam' : 'English'}`}
    >
      <Globe size={14} strokeWidth={1.5} />
      <span className="uppercase tracking-wider">
        {lang === 'en' ? 'മലയാളം' : 'EN'}
      </span>
    </button>
  );
}

// Static translations for UI elements
export const uiTranslations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.services': 'Services',
    'nav.projects': 'Projects',
    'nav.ecosystem': 'Ecosystem',
    'nav.contact': 'Contact',
    
    // CTA
    'cta.request_quote': 'Request a Quote',
    'cta.view_projects': 'View Projects',
    'cta.send_enquiry': 'Send Enquiry',
    'cta.learn_more': 'Learn More',
    'cta.view_case_study': 'View Case Study',
    'cta.explore_ecosystem': 'Explore Ecosystem',
    
    // Form
    'form.name': 'Your Name',
    'form.phone': 'Phone Number',
    'form.email': 'Email',
    'form.project_type': 'Project Type',
    'form.location': 'Project Location',
    'form.budget': 'Budget Range',
    'form.timeline': 'Timeline',
    'form.message': 'Message',
    'form.submit': 'Submit',
    'form.success': 'Enquiry received. We will contact you within 24 hours.',
    
    // Project types
    'project.institutional': 'Institutional',
    'project.healthcare': 'Healthcare',
    'project.commercial': 'Commercial',
    'project.residential': 'Residential',
    'project.mixed_use': 'Mixed-use',
    
    // Sections
    'section.our_work': 'Our Work',
    'section.selected_projects': 'Selected Projects',
    'section.how_we_work': 'How Septa Works',
    'section.septa_standard': 'The Septa Standard',
    'section.services': 'Services',
    'section.testimonials': 'Client Voices',
    'section.ecosystem': 'Partner Network',
    'section.contact': 'Start a Conversation',
    
    // Footer
    'footer.tagline': 'Built with Clarity. Delivered with Discipline.',
    'footer.copyright': '© 2024 Septa Group. All rights reserved.',
  },
  ml: {
    // Navigation
    'nav.home': 'ഹോം',
    'nav.about': 'ഞങ്ങളെക്കുറിച്ച്',
    'nav.services': 'സേവനങ്ങൾ',
    'nav.projects': 'പ്രോജക്ടുകൾ',
    'nav.ecosystem': 'ഇക്കോസിസ്റ്റം',
    'nav.contact': 'ബന്ധപ്പെടുക',
    
    // CTA
    'cta.request_quote': 'ക്വോട്ട് അഭ്യർത്ഥിക്കുക',
    'cta.view_projects': 'പ്രോജക്ടുകൾ കാണുക',
    'cta.send_enquiry': 'അന്വേഷണം അയയ്ക്കുക',
    'cta.learn_more': 'കൂടുതൽ അറിയുക',
    'cta.view_case_study': 'കേസ് സ്റ്റഡി കാണുക',
    'cta.explore_ecosystem': 'ഇക്കോസിസ്റ്റം കാണുക',
    
    // Form
    'form.name': 'നിങ്ങളുടെ പേര്',
    'form.phone': 'ഫോൺ നമ്പർ',
    'form.email': 'ഇമെയിൽ',
    'form.project_type': 'പ്രോജക്ട് തരം',
    'form.location': 'പ്രോജക്ട് സ്ഥാനം',
    'form.budget': 'ബജറ്റ് പരിധി',
    'form.timeline': 'സമയപരിധി',
    'form.message': 'സന്ദേശം',
    'form.submit': 'സമർപ്പിക്കുക',
    'form.success': 'അന്വേഷണം ലഭിച്ചു. 24 മണിക്കൂറിനുള്ളിൽ ഞങ്ങൾ നിങ്ങളെ ബന്ധപ്പെടും.',
    
    // Project types
    'project.institutional': 'ഇൻസ്റ്റിറ്റ്യൂഷണൽ',
    'project.healthcare': 'ആരോഗ്യ പരിരക്ഷ',
    'project.commercial': 'വാണിജ്യ',
    'project.residential': 'റസിഡൻഷ്യൽ',
    'project.mixed_use': 'മിക്സഡ്-യൂസ്',
    
    // Sections
    'section.our_work': 'ഞങ്ങളുടെ പ്രവൃത്തി',
    'section.selected_projects': 'തിരഞ്ഞെടുത്ത പ്രോജക്ടുകൾ',
    'section.how_we_work': 'സെപ്ത എങ്ങനെ പ്രവർത്തിക്കുന്നു',
    'section.septa_standard': 'സെപ്ത സ്റ്റാൻഡേർഡ്',
    'section.services': 'സേവനങ്ങൾ',
    'section.testimonials': 'ക്ലയന്റ് ശബ്ദങ്ങൾ',
    'section.ecosystem': 'പാർട്ണർ നെറ്റ്‌വർക്ക്',
    'section.contact': 'ഒരു സംഭാഷണം ആരംഭിക്കുക',
    
    // Footer
    'footer.tagline': 'വ്യക്തതയോടെ നിർമ്മിച്ചു. അച്ചടക്കത്തോടെ ഡെലിവറി.',
    'footer.copyright': '© 2024 സെപ്ത ഗ്രൂപ്പ്. എല്ലാ അവകാശങ്ങളും സംരക്ഷിതം.',
  }
};

// Helper to get UI translation
export function useTranslation(key) {
  const { lang } = useLanguage();
  return uiTranslations[lang]?.[key] || uiTranslations.en[key] || key;
}

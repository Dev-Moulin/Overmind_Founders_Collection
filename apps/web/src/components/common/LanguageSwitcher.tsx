import { useTranslation } from 'react-i18next';

/**
 * Language Switcher Component
 * Toggles between French and English
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language.startsWith('fr') ? 'fr' : 'en';
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    console.log('[LanguageSwitcher] Switching from', currentLang, 'to', newLang);
    i18n.changeLanguage(newLang);
  };

  const currentLangCode = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const currentLang = currentLangCode === 'fr' ? 'FR' : 'EN';
  const nextLang = currentLangCode === 'fr' ? 'EN' : 'FR';

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 bg-white/10 hover:bg-white/20 text-white border border-white/20"
      title={`Switch to ${nextLang}`}
    >
      {currentLang}
    </button>
  );
}

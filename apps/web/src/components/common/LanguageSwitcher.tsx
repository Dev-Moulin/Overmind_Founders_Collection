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
      className="glass-button text-xs font-bold uppercase tracking-wider"
      style={{ padding: '6px 15px' }}
      title={`Switch to ${nextLang}`}
    >
      {currentLang}
    </button>
  );
}

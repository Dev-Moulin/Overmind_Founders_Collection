import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { WalletConnectButton } from '../common/ConnectButton';
import { NetworkSwitch } from './NetworkSwitch';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ADMIN_WALLET } from '../../config/constants';
import '../../glitch-title.css';

export function Header() {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const location = useLocation();

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  // Handle logo click - scroll to top if on homepage
  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      // Scroll the carousel container to top (hero section)
      const container = document.querySelector('.carousel-page-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => {
    const base = 'text-sm font-medium transition-colors';
    return isActive(path)
      ? `${base} text-slate-400`
      : `${base} text-white/70 hover:text-white`;
  };

  return (
    <header className="relative z-50 flex items-center px-6 py-3 gap-4 border-b border-white/10 bg-black/20 backdrop-blur-sm overflow-visible">
      <div className="flex items-center gap-6 shrink-0">
        <Link to="/" onClick={handleLogoClick} className="hover:opacity-80 transition-opacity">
          <span className="glitch-nav flex flex-col items-start leading-tight">
            <span className="glitch-nav-bold" data-text={t('homePage.title')}>
              {t('homePage.title')}
            </span>
            <span className="glitch-nav-light">
              {t('homePage.subtitle')}
            </span>
          </span>
        </Link>

        {isConnected && isAdmin && (
          <nav className="flex items-center gap-4 flex-wrap">
            <Link to="/admin/audit" className={navLinkClass('/admin/audit')}>
              {t('header.nav.admin')}
            </Link>
          </nav>
        )}
      </div>

      {/* Slot pour l'AlphabetIndex (injecté via portal quand le carousel est visible) */}
      <div id="navbar-alphabet-slot" className="flex-1 min-w-0 flex justify-center items-end translate-y-[15px] overflow-visible" />

      <div className="flex items-center gap-3 shrink-0">
        <LanguageSwitcher />
        <NetworkSwitch />
        <WalletConnectButton />
      </div>
    </header>
  );
}

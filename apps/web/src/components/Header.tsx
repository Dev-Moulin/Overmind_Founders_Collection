import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { WalletConnectButton } from './ConnectButton';
import { NetworkSwitch } from './NetworkSwitch';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ADMIN_WALLET } from '../config/constants';

export function Header() {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const location = useLocation();

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => {
    const base = 'text-sm font-medium transition-colors';
    return isActive(path)
      ? `${base} text-purple-400`
      : `${base} text-white/70 hover:text-white`;
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold text-white hover:text-purple-400 transition-colors">
          {t('header.title')}
        </Link>

        {isConnected && (
          <nav className="flex items-center gap-4 flex-wrap">
            {/* Pages cachées temporairement - seront supprimées plus tard
            <Link to="/propose" className={navLinkClass('/propose')}>
              {t('header.nav.propose')}
            </Link>
            <Link to="/vote" className={navLinkClass('/vote')}>
              {t('header.nav.vote')}
            </Link>
            <Link to="/results" className={navLinkClass('/results')}>
              {t('header.nav.results')}
            </Link>
            <Link to="/my-votes" className={navLinkClass('/my-votes')}>
              {t('header.nav.myVotes')}
            </Link>
            */}
            {isAdmin && (
              <Link to="/admin/audit" className={navLinkClass('/admin/audit')}>
                {t('header.nav.admin')}
              </Link>
            )}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <NetworkSwitch />
        <WalletConnectButton />
      </div>
    </header>
  );
}

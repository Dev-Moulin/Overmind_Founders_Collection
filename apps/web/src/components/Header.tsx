import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { WalletConnectButton } from './ConnectButton';

export function Header() {
  const { isConnected } = useAccount();
  const location = useLocation();

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
          INTUITION Founders Totem
        </Link>

        {isConnected && (
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/propose" className={navLinkClass('/propose')}>
              Proposer
            </Link>
            <Link to="/vote" className={navLinkClass('/vote')}>
              Voter
            </Link>
            <Link to="/results" className={navLinkClass('/results')}>
              Résultats
            </Link>
            <Link to="/my-votes" className={navLinkClass('/my-votes')}>
              Mes Votes
            </Link>
          </nav>
        )}
      </div>

      <WalletConnectButton />
    </header>
  );
}

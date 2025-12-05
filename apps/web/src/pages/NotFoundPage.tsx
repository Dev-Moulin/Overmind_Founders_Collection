import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export function NotFoundPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-slate-400 mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Page non trouvée
        </h1>
        <p className="text-white/70 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="glass-button">
            Retour à l'accueil
          </Link>

          {isConnected && (
            <Link to="/propose" className="glass-button">
              Proposer un Totem
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

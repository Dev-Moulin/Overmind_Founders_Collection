import type { ReactNode } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

interface NetworkGuardProps {
  children: ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  // Si on n'est pas sur Base Mainnet, afficher le message d'erreur
  if (chainId !== base.id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">
            Mauvais réseau détecté
          </h2>
          <p className="text-white/70 mb-6">
            Veuillez passer sur Base Mainnet pour utiliser cette application.
          </p>
          <button
            onClick={() => switchChain?.({ chainId: base.id })}
            disabled={isPending}
            className="glass-button w-full"
          >
            {isPending ? 'Changement en cours...' : 'Switch to Base Mainnet'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

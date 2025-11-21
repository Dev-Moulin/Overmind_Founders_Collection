import type { ReactNode } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { useWhitelist } from '../hooks/useWhitelist';

interface NetworkGuardProps {
  children: ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const { isEligible, isLoading: isCheckingWhitelist } = useWhitelist(address);

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

  // Si connecté, vérifier l'éligibilité
  if (isConnected && address) {
    if (isCheckingWhitelist) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="glass-card p-8 max-w-md text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Vérification en cours...
            </h2>
            <p className="text-white/70">
              Vérification de votre éligibilité pour participer au vote.
            </p>
          </div>
        </div>
      );
    }

    if (!isEligible) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="glass-card p-8 max-w-md text-center">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Non éligible
            </h2>
            <p className="text-white/70 mb-4">
              Vous devez posséder un NFT INTUITION Founders pour participer à
              ce vote.
            </p>
            <p className="text-sm text-white/50">
              Adresse du contrat NFT :<br />
              <code className="text-purple-400">
                0x98e2...8f8c
              </code>
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { currentIntuitionChain } from '../../config/wagmi';
import { getCurrentNetwork } from '../../lib/networkConfig';
import { useWhitelist } from '../../hooks';

interface NetworkGuardProps {
  children: ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { t } = useTranslation();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const { isEligible, isLoading: isCheckingWhitelist } = useWhitelist(address);

  const currentNetwork = getCurrentNetwork();
  const expectedChainId = currentIntuitionChain.id;
  const networkName = currentNetwork === 'mainnet' ? 'Mainnet' : 'Testnet';

  // Si on n'est pas sur le bon réseau INTUITION L3, afficher le message d'erreur
  if (chainId !== expectedChainId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">
            {t('networkGuard.wrongNetwork')}
          </h2>
          <p className="text-white/70 mb-6">
            {t('networkGuard.switchToNetwork', { name: networkName, id: expectedChainId })}
          </p>
          <button
            onClick={() => switchChain?.({ chainId: expectedChainId })}
            disabled={isPending}
            className="glass-button w-full"
          >
            {isPending ? t('networkGuard.switching') : t('networkGuard.switchButton', { name: networkName })}
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
              {t('networkGuard.verifying')}
            </h2>
            <p className="text-white/70">
              {t('networkGuard.checkingEligibility')}
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
              {t('networkGuard.notEligible')}
            </h2>
            <p className="text-white/70 mb-4">
              {t('networkGuard.needNft')}
            </p>
            <p className="text-sm text-white/50">
              {t('networkGuard.nftContractAddress')}<br />
              <code className="text-slate-400">
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

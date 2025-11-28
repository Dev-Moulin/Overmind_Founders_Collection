import { useAccount } from 'wagmi';
import { useNetwork } from '../hooks/useNetwork';
import { ADMIN_WALLET } from '../config/constants';

/**
 * NetworkSwitch Component
 * Badge/pill button to switch between Testnet and Mainnet
 * Only visible to authorized wallet address
 */
export function NetworkSwitch() {
  const { address } = useAccount();
  const { network, toggleNetwork, isTestnet } = useNetwork();

  // Only show to authorized wallet
  const isAuthorized = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  if (!isAuthorized) {
    return null;
  }

  return (
    <button
      onClick={toggleNetwork}
      className={`
        px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
        transition-all duration-200 hover:scale-105 active:scale-95
        border-2 shadow-lg
        ${
          isTestnet
            ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30'
            : 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30'
        }
      `}
      title={`Switch to ${isTestnet ? 'Mainnet' : 'Testnet'}`}
    >
      {network}
    </button>
  );
}

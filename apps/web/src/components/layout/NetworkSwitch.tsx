import { useAccount } from 'wagmi';
import { useNetwork } from '../../hooks';
import { ADMIN_WALLET } from '../../config/constants';

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
      className={`glass-button text-xs font-bold uppercase tracking-wider ${
        isTestnet ? 'text-red-400' : 'text-green-400'
      }`}
      style={{ padding: '6px 15px' }}
      title={`Switch to ${isTestnet ? 'Mainnet' : 'Testnet'}`}
    >
      {network}
    </button>
  );
}

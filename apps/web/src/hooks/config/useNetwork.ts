import { useState, useEffect, useCallback } from 'react';
import { type Network, getCurrentNetwork, setCurrentNetwork, getNetworkConfig } from '../../lib/networkConfig';

/**
 * Hook to manage network switching between Testnet and Mainnet
 */
export function useNetwork() {
  const [network, setNetwork] = useState<Network>(() => getCurrentNetwork());

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = getCurrentNetwork();
    if (stored !== network) {
      setNetwork(stored);
    }
  }, []);

  const switchNetwork = useCallback((newNetwork: Network) => {
    setCurrentNetwork(newNetwork);
    setNetwork(newNetwork);

    // Force page reload to reinitialize Apollo Client with new endpoints
    window.location.reload();
  }, []);

  const toggleNetwork = useCallback(() => {
    const newNetwork = network === 'testnet' ? 'mainnet' : 'testnet';
    switchNetwork(newNetwork);
  }, [network, switchNetwork]);

  const config = getNetworkConfig(network);

  return {
    network,
    config,
    switchNetwork,
    toggleNetwork,
    isTestnet: network === 'testnet',
    isMainnet: network === 'mainnet',
  };
}

/**
 * Network Configuration for INTUITION Protocol
 * Manages switching between Testnet and Mainnet
 */

export type Network = 'testnet' | 'mainnet';

export interface NetworkConfig {
  name: string;
  chainId: number;
  graphqlHttp: string;
  graphqlWs: string;
  rpcHttp: string;
  rpcWs: string;
  explorerUrl: string;
}

/**
 * Network configurations
 */
export const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  testnet: {
    name: 'Intuition Testnet',
    chainId: 13579,
    graphqlHttp: 'https://testnet.intuition.sh/v1/graphql',
    graphqlWs: 'wss://testnet.intuition.sh/v1/graphql',
    rpcHttp: 'https://testnet.rpc.intuition.systems/http',
    rpcWs: 'wss://testnet.rpc.intuition.systems/ws',
    explorerUrl: 'https://testnet.explorer.intuition.systems',
  },
  mainnet: {
    name: 'Intuition Mainnet',
    chainId: 1155,
    graphqlHttp: 'https://mainnet.intuition.sh/v1/graphql',
    graphqlWs: 'wss://mainnet.intuition.sh/v1/graphql',
    rpcHttp: 'https://rpc.intuition.systems/http',
    rpcWs: 'wss://rpc.intuition.systems/ws',
    explorerUrl: 'https://explorer.intuition.systems',
  },
};

/**
 * Get current network from localStorage (default: testnet)
 */
export function getCurrentNetwork(): Network {
  const stored = localStorage.getItem('intuition-network');
  return (stored === 'mainnet' ? 'mainnet' : 'testnet') as Network;
}

/**
 * Set current network in localStorage
 */
export function setCurrentNetwork(network: Network): void {
  localStorage.setItem('intuition-network', network);
}

/**
 * Get configuration for current network
 */
export function getNetworkConfig(network?: Network): NetworkConfig {
  const currentNetwork = network ?? getCurrentNetwork();
  return NETWORK_CONFIGS[currentNetwork];
}

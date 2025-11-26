import { createPublicClient, http } from 'viem';
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
import { getNetworkConfig } from '../lib/networkConfig';
import { currentIntuitionChain } from './wagmi';

// Get current network configuration
const networkConfig = getNetworkConfig();

// INTUITION L3 configuration (dynamic based on network selection)
export const INTUITION_CONFIG = {
  // MultiVault contract address (dynamic based on chain ID)
  multiVaultAddress: getMultiVaultAddressFromChainId(currentIntuitionChain.id),

  // GraphQL API endpoint (dynamic based on network)
  graphqlEndpoint: networkConfig.graphqlHttp,

  // Chain configuration (dynamic)
  chain: currentIntuitionChain,
  chainId: currentIntuitionChain.id, // 13579 (testnet) or 13580 (mainnet)

  // RPC endpoints (dynamic based on network)
  rpcUrl: networkConfig.rpcHttp,
  wsUrl: networkConfig.rpcWs,

  // Explorer (dynamic based on network)
  explorerUrl: networkConfig.explorerUrl,
};

// Public client for reading from the blockchain (dynamic)
export const publicClient = createPublicClient({
  chain: currentIntuitionChain,
  transport: http(networkConfig.rpcHttp),
});

// Helper to get API URL
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

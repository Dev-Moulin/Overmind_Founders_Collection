import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// INTUITION contract addresses on Base Mainnet
export const INTUITION_CONFIG = {
  // MultiVault contract address on Base Mainnet
  multiVaultAddress: '0x430BbF52503Bd4801E51182f4cB9f8F534225DE5' as const,

  // GraphQL API endpoint
  graphqlEndpoint: 'https://api.intuition.systems/graphql',

  // Chain configuration
  chain: base,
  chainId: base.id,
};

// Public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Helper to get API URL
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

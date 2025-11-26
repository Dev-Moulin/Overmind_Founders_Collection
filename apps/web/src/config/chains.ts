import { defineChain } from 'viem';

/**
 * INTUITION Mainnet chain definition
 * Chain ID: 1155
 */
export const intuitionMainnet = defineChain({
  id: 1155,
  name: 'Intuition Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TRUST',
    symbol: 'TRUST',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.intuition.systems/http'],
      webSocket: ['wss://rpc.intuition.systems/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Intuition Explorer',
      url: 'https://explorer.intuition.systems',
    },
  },
});

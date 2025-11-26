import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { intuitionTestnet } from '@0xintuition/protocol';
import { intuitionMainnet } from './chains';
import { getCurrentNetwork } from '../lib/networkConfig';

// Read network from localStorage BEFORE creating wagmi config
// This ensures wagmi is initialized with the correct chain
const network = getCurrentNetwork();
const intuitionChain = network === 'mainnet' ? intuitionMainnet : intuitionTestnet;

export const config = getDefaultConfig({
  appName: 'INTUITION Founders Totem',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
  // Include both chains: INTUITION L3 (dynamic based on network selection), Base Mainnet for NFT verification
  chains: [intuitionChain, base],
  ssr: false,
});

// Export the current INTUITION chain for use in hooks and config
export const currentIntuitionChain = intuitionChain;

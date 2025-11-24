import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { mock } from 'wagmi/connectors';

/**
 * Anvil test accounts (default accounts from foundry)
 * Private keys are well-known test keys, never use in production
 */
export const ANVIL_ACCOUNTS = [
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Anvil #0
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Anvil #1
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Anvil #2
] as const;

/**
 * Test wagmi config with mock connector for blockchain tests
 * Uses Anvil local RPC at http://127.0.0.1:8545
 */
export const testConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    mock({
      accounts: [...ANVIL_ACCOUNTS],
    }),
  ],
  transports: {
    [base.id]: http('http://127.0.0.1:8545'),
    [baseSepolia.id]: http('http://127.0.0.1:8545'),
  },
});

/**
 * Check if Anvil is running on local port
 */
export async function isAnvilRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:8545', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

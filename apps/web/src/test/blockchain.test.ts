import { describe, it, expect, beforeAll } from 'vitest';
import { isAnvilRunning, ANVIL_ACCOUNTS } from './wagmi';

/**
 * Blockchain integration tests with Anvil
 *
 * These tests require Anvil to be running locally.
 * In CI, Anvil is started automatically.
 * Locally, run: anvil --port 8545
 */
describe('Blockchain Tests', () => {
  describe('Anvil Connection', () => {
    it('should have test accounts configured', () => {
      expect(ANVIL_ACCOUNTS).toHaveLength(3);
      expect(ANVIL_ACCOUNTS[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should check anvil running status', async () => {
      const running = await isAnvilRunning();
      // This test just verifies the function works
      expect(typeof running).toBe('boolean');
    });
  });

  describe('When Anvil is running', () => {
    let anvilAvailable: boolean;

    beforeAll(async () => {
      anvilAvailable = await isAnvilRunning();
    });

    it.skipIf(!process.env.ANVIL_RUNNING)('should connect to local RPC', async () => {
      if (!anvilAvailable) {
        console.log('Skipping: Anvil not running locally');
        return;
      }

      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      expect(data.result).toBeDefined();
    });

    it.skipIf(!process.env.ANVIL_RUNNING)('should get balance of test account', async () => {
      if (!anvilAvailable) {
        console.log('Skipping: Anvil not running locally');
        return;
      }

      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [ANVIL_ACCOUNTS[0], 'latest'],
          id: 1,
        }),
      });

      const data = await response.json();
      expect(data.result).toBeDefined();
    });
  });
});

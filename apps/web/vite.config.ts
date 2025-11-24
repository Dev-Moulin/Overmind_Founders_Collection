import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cspPlugin from 'vite-plugin-csp-guard';

export default defineConfig({
  plugins: [
    react(),
    cspPlugin({
      dev: { run: true },
      policy: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': [
          "'self'",
          // INTUITION API
          'https://api-testnet.intuition.systems',
          'https://testnet.intuition.sh',
          // Base RPC
          'https://mainnet.base.org',
          'https://sepolia.base.org',
          'wss://mainnet.base.org',
          'wss://sepolia.base.org',
          // WalletConnect
          'wss://relay.walletconnect.com',
          'wss://relay.walletconnect.org',
          'https://verify.walletconnect.com',
          'https://verify.walletconnect.org',
          // RainbowKit
          'https://api.rainbow.me',
          // IPFS
          'https://gateway.pinata.cloud',
          'https://ipfs.io',
        ],
        'frame-src': [
          "'self'",
          'https://verify.walletconnect.com',
          'https://verify.walletconnect.org',
        ],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
      },
    }),
  ],
});

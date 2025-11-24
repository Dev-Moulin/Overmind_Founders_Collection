/**
 * Content Security Policy configuration
 *
 * This file defines CSP directives for the application.
 * In production, these should be set via HTTP headers on the server.
 * For development and static hosting, use the meta tag in index.html.
 */

/**
 * CSP Directives for INTUITION Founders Totem
 *
 * Configured to allow:
 * - Self-hosted scripts and styles
 * - Inline styles (required for Tailwind)
 * - INTUITION API connections
 * - WalletConnect WebSocket connections
 * - IPFS gateway images
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],

  'script-src': [
    "'self'",
    // Allow eval for development (remove in production)
    // "'unsafe-eval'",
  ],

  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
  ],

  'img-src': [
    "'self'",
    'data:',
    'https:', // Allow HTTPS images (IPFS gateways, avatars)
  ],

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

  'frame-ancestors': ["'none'"], // Prevent clickjacking

  'base-uri': ["'self'"],

  'form-action': ["'self'"],

  'object-src': ["'none'"],
};

/**
 * Build CSP string from directives
 */
export function buildCSPString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * CSP meta tag content (for index.html)
 *
 * Add this to your index.html:
 * <meta http-equiv="Content-Security-Policy" content="..." />
 */
export const CSP_META_CONTENT = buildCSPString();

/**
 * Example index.html meta tag:
 *
 * <meta
 *   http-equiv="Content-Security-Policy"
 *   content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api-testnet.intuition.systems https://testnet.intuition.sh wss://relay.walletconnect.com https://verify.walletconnect.com; frame-ancestors 'none';"
 * />
 */

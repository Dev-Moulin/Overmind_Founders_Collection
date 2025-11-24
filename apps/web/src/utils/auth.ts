import { verifyMessage } from 'viem';

/**
 * Maximum age for auth message (5 minutes)
 */
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;

/**
 * Used nonces storage (in-memory for frontend, should be server-side in production)
 */
const usedNonces = new Set<string>();

/**
 * Generate authentication message for wallet signature
 *
 * Creates a message with nonce and timestamp for replay attack protection.
 *
 * @param address - Ethereum address to authenticate
 * @returns Object with message and nonce
 *
 * @example
 * ```ts
 * const { message, nonce, timestamp } = generateAuthMessage('0x123...');
 * const signature = await walletClient.signMessage({ message });
 * ```
 */
export function generateAuthMessage(address: string): {
  message: string;
  nonce: string;
  timestamp: number;
} {
  const nonce = crypto.randomUUID();
  const timestamp = Date.now();

  const message = `Bienvenue sur INTUITION Founders Totem!

Signez ce message pour vous authentifier.

Adresse: ${address}
Nonce: ${nonce}
Timestamp: ${timestamp}

Cette signature ne coûte aucun gas et n'autorise aucune transaction.`;

  return { message, nonce, timestamp };
}

/**
 * Parse nonce and timestamp from auth message
 *
 * @param message - The auth message
 * @returns Parsed nonce and timestamp, or null if invalid
 */
export function parseAuthMessage(message: string): {
  nonce: string;
  timestamp: number;
} | null {
  const nonceMatch = message.match(/Nonce: ([a-f0-9-]+)/i);
  const timestampMatch = message.match(/Timestamp: (\d+)/);

  if (!nonceMatch || !timestampMatch) {
    return null;
  }

  return {
    nonce: nonceMatch[1],
    timestamp: parseInt(timestampMatch[1], 10),
  };
}

/**
 * Verify wallet signature
 *
 * Validates the signature and checks nonce/timestamp for replay protection.
 *
 * @param address - Expected signer address
 * @param message - The signed message
 * @param signature - The signature to verify
 * @returns true if valid, false otherwise
 *
 * @example
 * ```ts
 * const isValid = await verifyWalletSignature(
 *   '0x123...',
 *   message,
 *   signature
 * );
 * ```
 */
export async function verifyWalletSignature(
  address: `0x${string}`,
  message: string,
  signature: `0x${string}`
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 1. Verify the cryptographic signature
    const isValidSignature = await verifyMessage({
      address,
      message,
      signature,
    });

    if (!isValidSignature) {
      return { valid: false, error: 'Signature invalide' };
    }

    // 2. Parse and validate nonce/timestamp
    const parsed = parseAuthMessage(message);
    if (!parsed) {
      return { valid: false, error: 'Format de message invalide' };
    }

    // 3. Check timestamp (max 5 minutes)
    const age = Date.now() - parsed.timestamp;
    if (age > MAX_MESSAGE_AGE_MS) {
      return { valid: false, error: 'Message expiré (max 5 minutes)' };
    }

    // 4. Check nonce hasn't been used (replay protection)
    if (usedNonces.has(parsed.nonce)) {
      return { valid: false, error: 'Nonce déjà utilisé (replay attack)' };
    }

    // 5. Mark nonce as used
    usedNonces.add(parsed.nonce);

    // Clean old nonces periodically (keep last 1000)
    if (usedNonces.size > 1000) {
      const toDelete = Array.from(usedNonces).slice(0, 500);
      toDelete.forEach((n) => usedNonces.delete(n));
    }

    return { valid: true };
  } catch (error) {
    console.error('Signature verification error:', error);
    return { valid: false, error: 'Erreur de vérification' };
  }
}

/**
 * Clear used nonces (for testing)
 */
export function clearUsedNonces(): void {
  usedNonces.clear();
}

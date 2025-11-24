import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { generateAuthMessage, verifyWalletSignature } from '../utils/auth';

/**
 * Authentication status
 */
export type AuthStatus = 'idle' | 'pending' | 'authenticated' | 'error';

/**
 * Result of useWalletAuth hook
 */
export interface UseWalletAuthResult {
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
  logout: () => void;
}

/**
 * Hook for wallet authentication with signature verification
 *
 * Uses nonce and timestamp for replay attack protection.
 *
 * @example
 * ```tsx
 * function AuthButton() {
 *   const { authenticate, isAuthenticated, status } = useWalletAuth();
 *
 *   if (isAuthenticated) {
 *     return <p>Authentifié!</p>;
 *   }
 *
 *   return (
 *     <button onClick={authenticate} disabled={status === 'pending'}>
 *       {status === 'pending' ? 'Signature...' : 'S\'authentifier'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useWalletAuth(): UseWalletAuthResult {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setError('Wallet non connecté');
      setStatus('error');
      return false;
    }

    try {
      setStatus('pending');
      setError(null);

      // 1. Generate auth message with nonce
      const { message } = generateAuthMessage(address);

      // 2. Request signature from wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify signature
      const result = await verifyWalletSignature(
        address,
        message,
        signature as `0x${string}`
      );

      if (!result.valid) {
        setError(result.error || 'Vérification échouée');
        setStatus('error');
        return false;
      }

      // 4. Store auth state (could be JWT in production)
      sessionStorage.setItem('wallet_auth', JSON.stringify({
        address,
        authenticatedAt: Date.now(),
      }));

      setStatus('authenticated');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'authentification';

      // Handle user rejection
      if (errorMessage.includes('User rejected') || errorMessage.includes('denied')) {
        setError('Signature refusée');
      } else {
        setError(errorMessage);
      }

      setStatus('error');
      return false;
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('wallet_auth');
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    error,
    isAuthenticated: status === 'authenticated',
    authenticate,
    logout,
  };
}

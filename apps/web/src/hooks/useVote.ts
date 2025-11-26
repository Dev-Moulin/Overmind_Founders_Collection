import { useState, useCallback, useRef } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, type Hex, type Address } from 'viem';
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
import { intuitionTestnet, MultiVaultAbi } from '@0xintuition/protocol';
import { toast } from 'sonner';

export type VoteStatus =
  | 'idle'
  | 'checking'
  | 'depositing'
  | 'success'
  | 'error';

export interface VoteError {
  code: string;
  message: string;
  step: 'checking' | 'depositing';
}

export interface UseVoteResult {
  vote: (claimId: Hex, amount: string, isFor: boolean) => Promise<void>;
  status: VoteStatus;
  error: VoteError | null;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  reset: () => void;
}

/**
 * Hook pour gérer le processus de vote sur un claim existant
 *
 * Sur INTUITION L3 Testnet, TRUST est le token NATIF (comme ETH).
 * Pas besoin d'approve ERC20 - on envoie directement avec msg.value.
 *
 * @example
 * ```tsx
 * function VoteModal({ claimId }) {
 *   const { vote, status, error, isLoading, currentStep, totalSteps } = useVote();
 *
 *   const handleVote = async () => {
 *     await vote(claimId, "0.01", true); // Vote FOR with 0.01 TRUST
 *   };
 *
 *   return (
 *     <div>
 *       {isLoading && <p>Step {currentStep}/{totalSteps}</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       <button onClick={handleVote}>Vote</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVote(): UseVoteResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<VoteStatus>('idle');
  const [error, setError] = useState<VoteError | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(2); // checking + depositing

  // Ref to track current status for error handling in async callbacks
  const statusRef = useRef<VoteStatus>('idle');

  const multiVaultAddress = getMultiVaultAddressFromChainId(intuitionTestnet.id);

  // Helper to update both state and ref
  const updateStatus = useCallback((newStatus: VoteStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const reset = useCallback(() => {
    updateStatus('idle');
    setError(null);
    setCurrentStep(0);
  }, [updateStatus]);

  const vote = useCallback(
    async (claimId: Hex, amount: string, isFor: boolean) => {
      if (!address) {
        setError({
          code: 'WALLET_NOT_CONNECTED',
          message: 'Veuillez connecter votre wallet',
          step: 'checking',
        });
        updateStatus('error');
        return;
      }

      if (!walletClient || !publicClient) {
        setError({
          code: 'CLIENT_NOT_READY',
          message: 'Wallet client not ready',
          step: 'checking',
        });
        updateStatus('error');
        return;
      }

      try {
        reset();
        const amountWei = parseEther(amount);

        // Step 1: Check balance
        updateStatus('checking');
        setCurrentStep(1);
        toast.info('Vérification de la balance...');

        const balance = await publicClient.getBalance({ address });
        if (balance < amountWei) {
          throw new Error(
            `Balance TRUST insuffisante. Vous avez ${(Number(balance) / 1e18).toFixed(4)} TRUST mais il faut ${amount} TRUST.`
          );
        }

        // Step 2: Deposit (TRUST is native token on INTUITION L3)
        updateStatus('depositing');
        setCurrentStep(2);
        toast.info('Veuillez signer la transaction de vote...');

        // NOTE: For deposits on triples in INTUITION V2:
        // The SDK uses curveId = 1n for all deposits (default bonding curve)
        // See @0xintuition/sdk/src/experimental/utils.ts line 607:
        //   termIds.map(() => 1n), // curveIds (all 1 for default curve)
        //
        // FOR vs AGAINST is NOT determined by curveId, but by which vault you deposit to:
        // - FOR = deposit on the triple's term_id (positive vault)
        // - AGAINST = deposit on the triple's counter_term_id (negative vault)
        //
        // Currently this hook only supports FOR votes.
        if (!isFor) {
          throw new Error('Les votes AGAINST ne sont pas encore supportés. Il faut le counter_term_id du triple.');
        }

        const curveId = 1n; // Default bonding curve for all deposits (per SDK)

        // Call depositBatch directly on the contract
        // TRUST is native on INTUITION L3, so we send it as msg.value
        // Args: receiver, termIds[], curveIds[], assets[], minShares[]
        const { request } = await publicClient.simulateContract({
          account: walletClient.account,
          address: multiVaultAddress,
          abi: MultiVaultAbi,
          functionName: 'depositBatch',
          args: [
            address as Address,  // receiver - shares go to the voter
            [claimId],           // termIds - the claim/triple term_id
            [curveId],           // curveIds - 1n = default bonding curve
            [amountWei],         // assets - amount to deposit
            [0n],                // minShares - minimum shares to receive (0 = no minimum)
          ],
          value: amountWei, // TRUST is native token, send as msg.value
        });

        toast.loading('Envoi du vote...', { id: 'deposit' });

        const depositTxHash = await walletClient.writeContract(request);

        // Wait for deposit confirmation
        const depositReceipt = await publicClient.waitForTransactionReceipt({
          hash: depositTxHash,
        });

        if (depositReceipt.status !== 'success') {
          throw new Error('Transaction de vote échouée');
        }

        toast.success(
          `Vote ${isFor ? 'FOR' : 'AGAINST'} enregistré avec succès !`,
          { id: 'deposit' }
        );

        updateStatus('success');
        setError(null);
      } catch (err: unknown) {
        console.error('Vote error:', err);

        let errorMessage = 'Une erreur inattendue est survenue';
        let errorCode = 'UNKNOWN_ERROR';
        const errorStep: 'checking' | 'depositing' = statusRef.current === 'depositing' ? 'depositing' : 'checking';

        const errWithMessage = err as { message?: string };

        // Parse error messages
        if (errWithMessage.message?.includes('User rejected') || errWithMessage.message?.includes('user rejected')) {
          errorMessage = 'Transaction rejetée par l\'utilisateur';
          errorCode = 'USER_REJECTED';
        } else if (errWithMessage.message?.includes('insufficient funds') || errWithMessage.message?.includes('InsufficientBalance')) {
          errorMessage = 'Balance TRUST insuffisante pour cette transaction';
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (errWithMessage.message?.includes('Balance TRUST insuffisante')) {
          errorMessage = errWithMessage.message;
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (errWithMessage.message) {
          errorMessage = errWithMessage.message;
        }

        setError({
          code: errorCode,
          message: errorMessage,
          step: errorStep,
        });
        updateStatus('error');

        toast.error(errorMessage);
      }
    },
    [
      address,
      walletClient,
      publicClient,
      multiVaultAddress,
      reset,
      updateStatus,
    ]
  );

  return {
    vote,
    status,
    error,
    isLoading: ['checking', 'depositing'].includes(status),
    currentStep,
    totalSteps,
    reset,
  };
}

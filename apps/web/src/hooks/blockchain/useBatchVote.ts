/**
 * useBatchVote - Batch Vote Execution
 *
 * Hook for executing a vote cart as batch transactions.
 * Orchestrates the multi-step process:
 * 1. batchRedeem (if any positions need to be withdrawn)
 * 2. batchDeposit (all votes in one transaction)
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 * @see Contract Reference: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/17_EthMultiVault_V2_Reference.md
 */

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Hex, type Address, formatEther } from 'viem';
import { getMultiVaultAddressFromChainId, MultiVaultAbi } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import { toast } from 'sonner';
import type {
  VoteCart,
  VoteCartItem,
  VoteCartStatus,
  VoteCartError,
} from '../../types/voteCart';

/**
 * Default Curve ID for MultiVault
 * In INTUITION V2, curveId=1 is the default bonding curve for all deposits
 */
const DEFAULT_CURVE_ID = 1n;

/**
 * Result of batch vote execution
 */
export interface BatchVoteResult {
  /** Redeem transaction hash (if any withdrawals) */
  redeemTxHash?: Hex;
  /** Deposit transaction hash */
  depositTxHash: Hex;
  /** Total shares redeemed */
  totalRedeemed: bigint;
  /** Total assets deposited */
  totalDeposited: bigint;
}

/**
 * Result of useBatchVote hook
 */
export interface UseBatchVoteResult {
  /** Execute the batch vote from cart */
  executeBatch: (cart: VoteCart) => Promise<BatchVoteResult | null>;
  /** Current execution status */
  status: VoteCartStatus;
  /** Error if any */
  error: VoteCartError | null;
  /** Is currently executing */
  isLoading: boolean;
  /** Reset state */
  reset: () => void;
  /** Current step for progress display */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
}

/**
 * Hook to execute batch votes from a cart
 *
 * @example
 * ```tsx
 * function CartSubmit({ cart }) {
 *   const { executeBatch, status, error, isLoading, currentStep, totalSteps } = useBatchVote();
 *
 *   const handleSubmit = async () => {
 *     const result = await executeBatch(cart);
 *     if (result) {
 *       console.log('Batch executed:', result);
 *       // Clear cart, show success, etc.
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleSubmit} disabled={isLoading}>
 *       {isLoading ? `Étape ${currentStep}/${totalSteps}` : 'Valider le panier'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBatchVote(): UseBatchVoteResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<VoteCartStatus>('idle');
  const [error, setError] = useState<VoteCartError | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setCurrentStep(0);
    setTotalSteps(1);
  }, []);

  /**
   * Execute batch redeem for items that need withdrawal
   */
  const executeBatchRedeem = useCallback(
    async (itemsToRedeem: VoteCartItem[]): Promise<Hex | null> => {
      if (!address || !walletClient || !publicClient) return null;
      if (itemsToRedeem.length === 0) return null;

      // Prepare arrays for batch redeem
      const termIds: Hex[] = [];
      const curveIds: bigint[] = [];
      const shares: bigint[] = [];
      const minAssets: bigint[] = [];

      for (const item of itemsToRedeem) {
        if (!item.currentPosition) continue;

        // Use the termId of the current position (opposite to new vote direction)
        const redeemTermId =
          item.currentPosition.direction === 'for'
            ? item.termId
            : item.counterTermId;

        termIds.push(redeemTermId);
        curveIds.push(DEFAULT_CURVE_ID);
        shares.push(item.currentPosition.shares);
        minAssets.push(0n); // No slippage protection for simplicity
      }

      console.log('[useBatchVote] Executing batchRedeem:', {
        receiver: address,
        termIds,
        curveIds: curveIds.map((c) => c.toString()),
        shares: shares.map((s) => s.toString()),
      });

      // Simulate and execute
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: multiVaultAddress,
        abi: MultiVaultAbi,
        functionName: 'redeemBatch',
        args: [
          address as Address, // receiver
          termIds,
          curveIds,
          shares,
          minAssets,
        ],
      });

      const txHash = await walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status !== 'success') {
        throw new Error('Batch redeem transaction failed');
      }

      return txHash;
    },
    [address, walletClient, publicClient, multiVaultAddress]
  );

  /**
   * Execute batch deposit for all items
   */
  const executeBatchDeposit = useCallback(
    async (items: VoteCartItem[]): Promise<Hex> => {
      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Prepare arrays for batch deposit
      const termIds: Hex[] = [];
      const curveIds: bigint[] = [];
      const assets: bigint[] = [];
      const minShares: bigint[] = [];
      let totalValue = 0n;

      for (const item of items) {
        // Use termId for FOR, counterTermId for AGAINST
        const depositTermId =
          item.direction === 'for' ? item.termId : item.counterTermId;

        termIds.push(depositTermId);
        curveIds.push(DEFAULT_CURVE_ID);
        assets.push(item.amount);
        minShares.push(0n); // No slippage protection for simplicity
        totalValue += item.amount;
      }

      console.log('[useBatchVote] Executing batchDeposit:', {
        receiver: address,
        termIds,
        curveIds: curveIds.map((c) => c.toString()),
        assets: assets.map((a) => formatEther(a)),
        totalValue: formatEther(totalValue),
      });

      // Simulate and execute
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: multiVaultAddress,
        abi: MultiVaultAbi,
        functionName: 'depositBatch',
        args: [
          address as Address, // receiver
          termIds,
          curveIds,
          assets,
          minShares,
        ],
        value: totalValue, // TRUST is native token on Intuition L3
      });

      const txHash = await walletClient.writeContract(request);

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status !== 'success') {
        throw new Error('Batch deposit transaction failed');
      }

      return txHash;
    },
    [address, walletClient, publicClient, multiVaultAddress]
  );

  /**
   * Execute the full batch vote process
   */
  const executeBatch = useCallback(
    async (cart: VoteCart): Promise<BatchVoteResult | null> => {
      if (!address) {
        setError({
          code: 'WALLET_NOT_CONNECTED',
          message: 'Veuillez connecter votre wallet',
          step: 'validating',
        });
        setStatus('error');
        toast.error('Veuillez connecter votre wallet');
        return null;
      }

      if (!walletClient || !publicClient) {
        setError({
          code: 'CLIENT_NOT_READY',
          message: 'Wallet client not ready',
          step: 'validating',
        });
        setStatus('error');
        toast.error('Wallet client not ready');
        return null;
      }

      if (!cart || cart.items.length === 0) {
        setError({
          code: 'EMPTY_CART',
          message: 'Le panier est vide',
          step: 'validating',
        });
        setStatus('error');
        toast.error('Le panier est vide');
        return null;
      }

      try {
        reset();

        // Determine steps needed
        const itemsToRedeem = cart.items.filter((item) => item.needsWithdraw);
        const hasRedeems = itemsToRedeem.length > 0;
        const steps = hasRedeems ? 2 : 1;
        setTotalSteps(steps);

        let redeemTxHash: Hex | undefined;
        let totalRedeemed = 0n;
        let stepNum = 0;

        // Step 1: Batch Redeem (if needed)
        if (hasRedeems) {
          stepNum++;
          setCurrentStep(stepNum);
          setStatus('withdrawing');
          toast.info(
            `Étape ${stepNum}/${steps}: Retrait des positions opposées...`
          );

          redeemTxHash = (await executeBatchRedeem(itemsToRedeem)) ?? undefined;

          if (redeemTxHash) {
            totalRedeemed = itemsToRedeem.reduce(
              (sum, item) => sum + (item.currentPosition?.shares ?? 0n),
              0n
            );
            toast.success(`Retrait de ${formatEther(totalRedeemed)} shares effectué`);
          }
        }

        // Step 2: Batch Deposit
        stepNum++;
        setCurrentStep(stepNum);
        setStatus('depositing');
        toast.info(`Étape ${stepNum}/${steps}: Dépôt des votes...`);

        const depositTxHash = await executeBatchDeposit(cart.items);

        const totalDeposited = cart.items.reduce(
          (sum, item) => sum + item.amount,
          0n
        );

        toast.success(
          `${cart.items.length} vote(s) enregistré(s) pour ${formatEther(totalDeposited)} TRUST!`
        );

        setStatus('success');
        setError(null);

        return {
          redeemTxHash,
          depositTxHash,
          totalRedeemed,
          totalDeposited,
        };
      } catch (err: unknown) {
        console.error('[useBatchVote] Error:', err);

        let errorMessage = 'Une erreur inattendue est survenue';
        let errorCode = 'UNKNOWN_ERROR';

        const errWithMessage = err as { message?: string };

        if (
          errWithMessage.message?.includes('User rejected') ||
          errWithMessage.message?.includes('user rejected')
        ) {
          errorMessage = 'Transaction rejetée par l\'utilisateur';
          errorCode = 'USER_REJECTED';
        } else if (errWithMessage.message?.includes('insufficient funds')) {
          errorMessage = 'Balance TRUST insuffisante';
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (errWithMessage.message?.includes('HasCounterStake')) {
          errorMessage =
            'Impossible de voter: position opposée existante. Essayez de retirer d\'abord.';
          errorCode = 'HAS_COUNTER_STAKE';
        } else if (errWithMessage.message) {
          errorMessage = errWithMessage.message;
        }

        setError({
          code: errorCode,
          message: errorMessage,
          step: status as VoteCartStatus,
        });
        setStatus('error');
        toast.error(errorMessage);

        return null;
      }
    },
    [
      address,
      walletClient,
      publicClient,
      reset,
      executeBatchRedeem,
      executeBatchDeposit,
      status,
    ]
  );

  return {
    executeBatch,
    status,
    error,
    isLoading: ['validating', 'withdrawing', 'creating_atoms', 'depositing'].includes(
      status
    ),
    reset,
    currentStep,
    totalSteps,
  };
}

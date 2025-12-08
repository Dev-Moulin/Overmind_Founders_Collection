/**
 * useBatchVote - Batch Vote Execution
 *
 * Hook for executing a vote cart as batch transactions.
 * Orchestrates the multi-step process:
 * 1. createTriples (for new totem-founder relationships)
 * 2. batchRedeem (if any positions need to be withdrawn)
 * 3. batchDeposit (all votes in one transaction)
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 * @see Contract Reference: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/17_EthMultiVault_V2_Reference.md
 */

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Hex, type Address, formatEther, decodeEventLog } from 'viem';
import { getMultiVaultAddressFromChainId, MultiVaultAbi, multiCallIntuitionConfigs } from '@0xintuition/protocol';
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
  /** Create triples transaction hash (if any new totems) - includes deposit for new triples */
  createTriplesTxHash?: Hex;
  /** Redeem transaction hash (if any withdrawals) */
  redeemTxHash?: Hex;
  /** Deposit transaction hash (only for existing triples, undefined if all were new) */
  depositTxHash?: Hex;
  /** Total shares redeemed */
  totalRedeemed: bigint;
  /** Total assets deposited */
  totalDeposited: bigint;
  /** Number of triples created */
  triplesCreated: number;
}

/**
 * Created triple info from transaction logs
 */
interface CreatedTripleInfo {
  termId: Hex;
  counterTermId: Hex;
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
   * Create triples for new totems (items with isNewTotem = true)
   * Returns a map of totemId -> { termId, counterTermId }
   */
  const executeCreateTriples = useCallback(
    async (
      founderId: Hex,
      itemsNeedingTriple: VoteCartItem[]
    ): Promise<{ txHash: Hex; createdTriples: Map<Hex, CreatedTripleInfo> }> => {
      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      console.log('[useBatchVote] ========== CREATE TRIPLES START ==========');
      console.log('[useBatchVote] Creating triples for', itemsNeedingTriple.length, 'new totems');
      console.log('[useBatchVote] Founder ID:', founderId);

      // Prepare arrays for createTriples call
      const subjectIds: Hex[] = [];
      const predicateIds: Hex[] = [];
      const objectIds: Hex[] = [];
      const assets: bigint[] = [];

      // Get contract config to know the triple cost
      const contractConfig = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });
      const tripleBaseCost = BigInt(contractConfig.triple_cost);
      const minDeposit = BigInt(contractConfig.min_deposit);

      console.log('[useBatchVote] Contract config:', {
        tripleBaseCost: formatEther(tripleBaseCost),
        minDeposit: formatEther(minDeposit),
      });

      // Validate that user's amount covers tripleBaseCost + minDeposit
      const minRequiredAmount = tripleBaseCost + minDeposit;
      for (const item of itemsNeedingTriple) {
        if (item.amount < minRequiredAmount) {
          throw new Error(
            `Montant insuffisant pour "${item.totemName}": minimum requis ${formatEther(minRequiredAmount)} TRUST (frais: ${formatEther(tripleBaseCost)} + dépôt min: ${formatEther(minDeposit)})`
          );
        }
      }

      // Build arrays for each new triple
      // The user's chosen amount (item.amount) is the TOTAL they want to spend
      // We subtract the triple creation cost to get the actual deposit amount
      // This way user pays exactly what they chose, not more
      for (const item of itemsNeedingTriple) {
        subjectIds.push(founderId);
        predicateIds.push(item.predicateId);
        objectIds.push(item.totemId);

        // User's amount is the TOTAL budget, so we pass it directly
        // The contract will use tripleBaseCost for creation + rest for deposit
        // Example: user chooses 0.010, tripleBaseCost=0.001 → deposit=0.009
        const assetAmount = item.amount;
        assets.push(assetAmount);

        // Calculate what the actual deposit will be after triple cost
        const effectiveDeposit = item.amount > tripleBaseCost
          ? item.amount - tripleBaseCost
          : 0n;

        console.log('[useBatchVote] Triple to create (user pays TOTAL amount):', {
          subject: founderId,
          predicate: item.predicateId,
          object: `${item.totemName} (${item.totemId})`,
          tripleBaseCost: formatEther(tripleBaseCost),
          userTotalBudget: formatEther(item.amount),
          effectiveDeposit: formatEther(effectiveDeposit),
        });
      }

      const totalValue = assets.reduce((sum, a) => sum + a, 0n);

      console.log('[useBatchVote] Total value for createTriples:', formatEther(totalValue));

      // Simulate and execute createTriples
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: multiVaultAddress,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [subjectIds, predicateIds, objectIds, assets],
        value: totalValue,
      });

      console.log('[useBatchVote] createTriples simulated successfully, sending to MetaMask...');
      const txHash = await walletClient.writeContract(request);
      console.log('[useBatchVote] createTriples transaction sent! Hash:', txHash);

      // Wait for confirmation and get receipt with logs
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      console.log('[useBatchVote] createTriples confirmed!', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        logsCount: receipt.logs.length,
      });

      if (receipt.status !== 'success') {
        throw new Error('createTriples transaction failed');
      }

      // Parse logs to get the created triple termIds
      // The TripleCreated event has: termId (the triple's vault ID)
      const createdTriples = new Map<Hex, CreatedTripleInfo>();

      // Look for TripleCreated events in logs
      for (let i = 0; i < receipt.logs.length; i++) {
        try {
          const log = receipt.logs[i];
          const decoded = decodeEventLog({
            abi: MultiVaultAbi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === 'TripleCreated') {
            // The ABI returns values as Hex strings
            const args = decoded.args as unknown as { termId: Hex; subjectId: Hex; predicateId: Hex; objectId: Hex };
            const termId = args.termId;
            const objectId = args.objectId;

            // For now, counterTermId is typically termId + 1 in INTUITION
            // But we should get it from the contract or another event
            // For simplicity, we'll query it later or use a convention
            console.log('[useBatchVote] TripleCreated event:', {
              termId,
              objectId,
            });

            // Map totemId (objectId) to the created triple info
            createdTriples.set(objectId, {
              termId,
              counterTermId: termId, // Will be updated if we find counter vault info
            });
          }
        } catch {
          // Not a TripleCreated event, skip
        }
      }

      // If we couldn't parse events, use a fallback approach
      // The termId for a triple is deterministic based on subject+predicate+object
      if (createdTriples.size === 0) {
        console.warn('[useBatchVote] Could not parse TripleCreated events, using fallback');
        // For now, we'll need to query the chain or use another method
        // This is a limitation we'll need to address
      }

      console.log('[useBatchVote] Created triples map:', createdTriples.size, 'entries');
      console.log('[useBatchVote] ✅ createTriples SUCCESS!');
      console.log('[useBatchVote] ========== CREATE TRIPLES END ==========');

      return { txHash, createdTriples };
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

      console.log('[useBatchVote] ========== BATCH DEPOSIT START ==========');
      console.log('[useBatchVote] Executing batchDeposit:', {
        receiver: address,
        totalItems: items.length,
        totalValue: formatEther(totalValue),
        multiVaultAddress,
      });
      console.log('[useBatchVote] Deposit details per item:');
      items.forEach((item, index) => {
        console.log(`[useBatchVote] Item #${index + 1}:`, {
          totemName: item.totemName,
          direction: item.direction,
          termId: item.termId,
          counterTermId: item.counterTermId,
          depositTermId: termIds[index],
          amount: formatEther(assets[index]),
          isNewTotem: item.isNewTotem,
        });
      });
      console.log('[useBatchVote] ⚠️ CRITICAL: Check if termIds are triples or atoms!');
      console.log('[useBatchVote] - If termId looks like totem atomId → deposit goes to ATOM, not TRIPLE');
      console.log('[useBatchVote] - Triple termIds are created when triple is claimed on-chain');

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

      console.log('[useBatchVote] Transaction simulated successfully, sending to MetaMask...');
      const txHash = await walletClient.writeContract(request);
      console.log('[useBatchVote] Transaction sent! Hash:', txHash);
      console.log('[useBatchVote] Waiting for confirmation...');

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      console.log('[useBatchVote] Transaction receipt:', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      if (receipt.status !== 'success') {
        throw new Error('Batch deposit transaction failed');
      }

      console.log('[useBatchVote] ✅ BATCH DEPOSIT SUCCESS!');
      console.log('[useBatchVote] ========== BATCH DEPOSIT END ==========');

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

        console.log('[useBatchVote] ========== EXECUTE BATCH START ==========');
        console.log('[useBatchVote] Cart received:', {
          founderName: cart.founderName,
          founderId: cart.founderId,
          itemCount: cart.items.length,
        });
        console.log('[useBatchVote] Cart items detail:');
        cart.items.forEach((item, index) => {
          console.log(`[useBatchVote] Cart Item #${index + 1}:`, {
            id: item.id,
            totemName: item.totemName,
            totemId: item.totemId,
            predicateId: item.predicateId,
            termId: item.termId,
            counterTermId: item.counterTermId,
            direction: item.direction,
            amount: formatEther(item.amount),
            isNewTotem: item.isNewTotem,
            needsWithdraw: item.needsWithdraw,
          });
        });

        // Identify items needing different actions
        const itemsNeedingTriple = cart.items.filter((item) => item.isNewTotem);
        const itemsToRedeem = cart.items.filter((item) => item.needsWithdraw);
        const itemsWithExistingTriples = cart.items.filter((item) => !item.isNewTotem);

        const hasNewTriples = itemsNeedingTriple.length > 0;
        const hasRedeems = itemsToRedeem.length > 0;
        const hasExistingTriples = itemsWithExistingTriples.length > 0;

        // Calculate total steps:
        // - createTriples (if any new) - includes deposit for new items
        // - redeem (if any withdrawals needed)
        // - depositBatch (ONLY if there are existing triples to deposit on)
        let steps = 0;
        if (hasNewTriples) steps++; // createTriples (includes deposit)
        if (hasRedeems) steps++;
        if (hasExistingTriples) steps++; // depositBatch only for existing triples
        if (steps === 0) steps = 1; // At least 1 step
        setTotalSteps(steps);

        console.log('[useBatchVote] Execution plan:', {
          hasNewTriples,
          newTriplesCount: itemsNeedingTriple.length,
          hasRedeems,
          redeemsCount: itemsToRedeem.length,
          hasExistingTriples,
          existingTriplesCount: itemsWithExistingTriples.length,
          totalSteps: steps,
        });
        console.log('[useBatchVote] 📝 NOTE: New triples will receive deposit via createTriples (1 tx)');

        let createTriplesTxHash: Hex | undefined;
        let redeemTxHash: Hex | undefined;
        let totalRedeemed = 0n;
        let triplesCreated = 0;
        let stepNum = 0;

        // Make a mutable copy of items to update termIds after triple creation
        const updatedItems = [...cart.items];

        // Step 1: Create Triples (if needed)
        if (hasNewTriples) {
          stepNum++;
          setCurrentStep(stepNum);
          setStatus('creating_atoms');
          toast.info(
            `Étape ${stepNum}/${steps}: Création des relations fondateur-totem...`
          );

          console.log('[useBatchVote] Creating triples for new totems...');
          const { txHash, createdTriples } = await executeCreateTriples(
            cart.founderId,
            itemsNeedingTriple
          );
          createTriplesTxHash = txHash;
          triplesCreated = createdTriples.size;

          // Update items with the real termIds from created triples
          for (let i = 0; i < updatedItems.length; i++) {
            const item = updatedItems[i];
            if (item.isNewTotem) {
              const tripleInfo = createdTriples.get(item.totemId);
              if (tripleInfo) {
                console.log('[useBatchVote] Updating item termIds:', {
                  totemName: item.totemName,
                  oldTermId: item.termId,
                  newTermId: tripleInfo.termId,
                });
                updatedItems[i] = {
                  ...item,
                  termId: tripleInfo.termId,
                  counterTermId: tripleInfo.counterTermId,
                  isNewTotem: false, // No longer new, triple exists now
                };
              } else {
                console.warn('[useBatchVote] Could not find created triple for:', item.totemName);
              }
            }
          }

          toast.success(`${triplesCreated} relation(s) créée(s)!`);
        }

        // Step 2: Batch Redeem (if needed)
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

        // Step 3: Batch Deposit (ONLY for items that already had triples in the ORIGINAL cart)
        // New triples already received their deposit via createTriples
        // IMPORTANT: Use itemsWithExistingTriples from ORIGINAL cart, not updatedItems
        let depositTxHash: Hex | undefined;

        if (hasExistingTriples) {
          stepNum++;
          setCurrentStep(stepNum);
          setStatus('depositing');
          toast.info(`Étape ${stepNum}/${steps}: Dépôt des votes...`);

          console.log('[useBatchVote] Items needing separate deposit:', itemsWithExistingTriples.length);
          console.log('[useBatchVote] (New triples already received deposit via createTriples)');

          // Use the updated items but only those that were originally existing triples
          const itemsToDeposit = updatedItems.filter(item =>
            itemsWithExistingTriples.some(orig => orig.totemId === item.totemId)
          );
          depositTxHash = await executeBatchDeposit(itemsToDeposit);
        } else {
          console.log('[useBatchVote] No separate deposit needed - all items were new triples');
        }

        const totalDeposited = updatedItems.reduce(
          (sum, item) => sum + item.amount,
          0n
        );

        toast.success(
          `${updatedItems.length} vote(s) enregistré(s) pour ${formatEther(totalDeposited)} TRUST!`
        );

        setStatus('success');
        setError(null);

        return {
          createTriplesTxHash,
          redeemTxHash,
          depositTxHash,
          totalRedeemed,
          totalDeposited,
          triplesCreated,
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
      executeCreateTriples,
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

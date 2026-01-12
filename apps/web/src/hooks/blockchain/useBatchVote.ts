/**
 * useBatchVote - Batch Vote Execution
 *
 * Hook for executing a vote cart as batch transactions.
 * Orchestrates the multi-step process:
 * 0. createClaimWithCategory (for brand new totems with newTotemData)
 * 1. createTriples (for new totem-founder relationships on existing totems)
 * 2. redeemBatch (if switching positions)
 * 3. depositBatch (for existing triples)
 *
 * NOTE: Atomic redeem+deposit via Multicall3 is NOT possible because:
 * - redeemBatch checks `_isApprovedToRedeem(msg.sender, receiver)`
 * - When called via Multicall3, msg.sender = Multicall3 address (not user wallet)
 * - Multicall3 is not approved to redeem on behalf of users
 * - This is a fundamental EVM limitation, not a code bug
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/TODO_Implementation.md
 * @see Contract Reference: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/17_EthMultiVault_V2_Reference.md
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useApolloClient } from '@apollo/client';
import { type Hex, type Address, formatEther, decodeEventLog } from 'viem';
import { getMultiVaultAddressFromChainId, MultiVaultAbi, multiCallIntuitionConfigs } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import { toast } from 'sonner';
import { useIntuition } from './useIntuition';
import { useBatchTriples } from './useBatchTriples';
import { truncateAmount } from '../../utils/formatters';
import type { BatchTripleItem } from './useBatchTriples';
import { GET_TRIPLE_BY_ATOMS } from '../../lib/graphql/queries';
import categoriesData from '../../../../../packages/shared/src/data/categories.json';
import type { CategoryConfigType } from '../../types/category';
import type {
  VoteCart,
  VoteCartItem,
  VoteCartStatus,
  VoteCartError,
} from '../../types/voteCart';

// Type the categories config
const typedCategoriesConfig = categoriesData as CategoryConfigType;

// NOTE: DEFAULT_CURVE_ID is no longer used for redeemBatch
// We now use the curveId from currentPosition for correct redeem
// const DEFAULT_CURVE_ID = 1n;

/**
 * VoteCartItem with all IDs resolved (ready for batch processing)
 * Items with newTotemData need atom creation first and cannot be batch processed yet
 */
interface ProcessableCartItem extends Omit<VoteCartItem, 'totemId' | 'termId' | 'counterTermId'> {
  totemId: Hex;
  termId: Hex;
  counterTermId: Hex;
}

/**
 * Type guard to check if a cart item has all required IDs for processing
 */
function isProcessableItem(item: VoteCartItem): item is ProcessableCartItem {
  return item.totemId !== null && item.termId !== null && item.counterTermId !== null;
}

/**
 * Result of batch vote execution
 */
export interface BatchVoteResult {
  /** Create new totem transaction hashes (via createClaimWithCategory) */
  newTotemTxHashes?: Hex[];
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
  /** Number of new totems created */
  newTotemsCreated: number;
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
  const apolloClient = useApolloClient();
  const { getOrCreateAtom } = useIntuition();
  const { createBatch: createTriplesBatch } = useBatchTriples();

  const [status, setStatus] = useState<VoteCartStatus>('idle');
  const [error, setError] = useState<VoteCartError | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);

  // Ref pour le compteur de steps (accessible par les fonctions internes)
  const stepCounterRef = useRef({ current: 0, total: 1 });

  // Fonction centralisée pour incrémenter le step (appelée après chaque transaction)
  const incrementStep = useCallback(() => {
    stepCounterRef.current.current++;
    setCurrentStep(stepCounterRef.current.current);
  }, []);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setCurrentStep(0);
    setTotalSteps(1);
    stepCounterRef.current = { current: 0, total: 1 };
  }, []);

  /**
   * Check if a triple already exists in the blockchain
   * Returns termId and counterTermId if found
   */
  const checkTripleExists = useCallback(
    async (
      subjectId: Hex,
      predicateId: Hex,
      objectId: Hex
    ): Promise<{ exists: boolean; termId?: Hex; counterTermId?: Hex }> => {
      try {
        const { data } = await apolloClient.query<{
          triples: Array<{
            term_id: string;
            counter_term?: { id: string };
          }>;
        }>({
          query: GET_TRIPLE_BY_ATOMS,
          variables: { subjectId, predicateId, objectId },
          fetchPolicy: 'network-only',
        });

        if (data?.triples && data.triples.length > 0) {
          const triple = data.triples[0];
          return {
            exists: true,
            termId: triple.term_id as Hex,
            counterTermId: triple.counter_term?.id as Hex | undefined,
          };
        }
        return { exists: false };
      } catch (err) {
        console.warn('[useBatchVote] Error checking triple existence:', err);
        return { exists: false };
      }
    },
    [apolloClient]
  );

  /**
   * Create brand new totems using useBatchTriples
   * This handles items that have newTotemData (totemId === null)
   *
   * OPTIMIZED: Creates ALL triples in a SINGLE transaction using createTriples batch
   *
   * For each totem:
   * - Triple 1: [Founder] → [predicate] → [Totem] (main vote)
   * - Triple 2: [Totem] → [has category] → [Category]
   *
   * Process:
   * 1. First create totem atoms (1 tx per totem if new - unavoidable)
   * 2. Then batch ALL triples in ONE transaction via useBatchTriples
   * 3. For Progressive items: deposit remaining amount in Progressive curve (2-step process)
   *
   * Progressive 2-step process:
   * - createTriples always deposits in Linear (curveId=1)
   * - For Progressive items, we create with minimum deposit, then depositBatch the rest in Progressive
   */
  const executeCreateNewTotems = useCallback(
    async (
      founderId: Hex,
      itemsWithNewTotemData: VoteCartItem[]
    ): Promise<{ txHashes: Hex[]; createdCount: number }> => {
      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      console.log('[useBatchVote] ========== CREATE NEW TOTEMS (BATCH) START ==========');
      console.log('[useBatchVote] Creating', itemsWithNewTotemData.length, 'brand new totems');

      const txHashes: Hex[] = [];

      // Track totem atom IDs for building triples
      const totemData: { totemId: Hex; categoryTermId: string | null; item: VoteCartItem }[] = [];

      // Check if any items want Progressive curve
      const progressiveItems = itemsWithNewTotemData.filter(item => item.curveId === 2);
      if (progressiveItems.length > 0) {
        console.log('[useBatchVote] Progressive items detected:', progressiveItems.length);
        console.log('[useBatchVote] Will use 2-step process: create in Linear, then deposit in Progressive');
      }

      // STEP 1: Create totem and category atoms first (if needed)
      // Each atom creation is a separate transaction - unavoidable
      console.log('[useBatchVote] Step 1: Creating atoms (totem + category if new)...');

      for (const item of itemsWithNewTotemData) {
        if (!item.newTotemData) {
          console.warn('[useBatchVote] Item missing newTotemData:', item.totemName);
          continue;
        }

        const { name, category, categoryTermId, isNewCategory } = item.newTotemData;

        // Create new category atom first if needed
        let resolvedCategoryTermId = categoryTermId;
        if (isNewCategory) {
          console.log('[useBatchVote] Creating new category atom:', category);
          const categoryResult = await getOrCreateAtom(category);
          resolvedCategoryTermId = categoryResult.termId;
          console.log('[useBatchVote] Category atom:', {
            created: categoryResult.created,
            termId: categoryResult.termId,
          });
        }

        // Get or create totem atom
        console.log('[useBatchVote] Creating totem atom:', name);
        const totemResult = await getOrCreateAtom(name);
        console.log('[useBatchVote] Totem atom:', {
          created: totemResult.created,
          termId: totemResult.termId,
        });

        totemData.push({
          totemId: totemResult.termId,
          categoryTermId: resolvedCategoryTermId,
          item,
        });
      }

      if (totemData.length === 0) {
        console.log('[useBatchVote] No totems to create');
        return { txHashes, createdCount: 0 };
      }

      // Get contract config for Progressive 2-step process
      const contractConfig = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });
      const minDeposit = BigInt(contractConfig.min_deposit);
      const tripleBaseCost = BigInt(contractConfig.triple_cost);
      const minRequiredAmount = tripleBaseCost + minDeposit;

      // Auto-adjust amounts that are very close to minimum (UI displays truncated values)
      // Example: UI shows "0.002" but exact minimum is "0.002000000002"
      const TOLERANCE_WEI = 1_000_000_000n; // 1 gwei tolerance
      for (const { item } of totemData) {
        if (item.amount < minRequiredAmount) {
          const missing = minRequiredAmount - item.amount;
          if (missing <= TOLERANCE_WEI) {
            console.log('[useBatchVote] Auto-adjusting newTotem amount for', item.newTotemData?.name, ':', {
              original: formatEther(item.amount),
              adjusted: formatEther(minRequiredAmount),
              missing: formatEther(missing),
            });
            (item as { amount: bigint }).amount = minRequiredAmount;
          }
        }
      }

      // STEP 2: Build ALL triples for batch creation
      console.log('[useBatchVote] Step 2: Building batch triples...');

      const batchTriples: BatchTripleItem[] = [];
      // Track items that need Progressive deposit after triple creation
      const progressiveDepositItems: { totemId: Hex; item: VoteCartItem; progressiveAmount: bigint }[] = [];

      for (const { totemId, categoryTermId, item } of totemData) {
        // Triple 1: [Founder] → [predicate] → [Totem] (main vote)
        // For Progressive items: create with minimum, deposit rest in Progressive
        // For Linear items: create with full amount
        const isProgressive = item.curveId === 2;
        const createAmount = isProgressive ? minRequiredAmount : item.amount;
        const progressiveAmount = isProgressive ? item.amount - minRequiredAmount : 0n;

        batchTriples.push({
          subjectId: founderId,
          predicateId: item.predicateId,
          objectId: totemId,
          depositAmount: createAmount,
        });

        // Track for Progressive step 2
        if (isProgressive && progressiveAmount > 0n) {
          progressiveDepositItems.push({
            totemId,
            item,
            progressiveAmount,
          });
        }

        console.log('[useBatchVote] Triple 1 (main vote):', {
          founder: founderId,
          predicate: item.predicateId,
          totem: totemId,
          createAmount: formatEther(createAmount),
          progressiveAmount: isProgressive ? formatEther(progressiveAmount) : 'N/A',
          requestedCurve: isProgressive ? 'Progressive (2-step)' : 'Linear',
        });

        // Triple 2: [Totem] → [has category] → [Category]
        const categoryPredicateTermId = typedCategoriesConfig.predicate?.termId;
        if (categoryPredicateTermId && categoryTermId) {
          batchTriples.push({
            subjectId: totemId,
            predicateId: categoryPredicateTermId as Hex,
            objectId: categoryTermId as Hex,
            // No depositAmount = use minDeposit (handled by useBatchTriples)
          });

          console.log('[useBatchVote] Triple 2 (category):', {
            totem: totemId,
            predicate: categoryPredicateTermId,
            category: categoryTermId,
          });
        }

        // Warn if user wanted AGAINST direction (not supported for new totems)
        if (item.direction === 'against') {
          console.warn('[useBatchVote] AGAINST direction on new totem is not fully supported yet - created as FOR');
          toast.warning(`"${item.newTotemData?.name}" créé avec vote FOR (AGAINST non supporté pour nouveaux totems)`);
        }
      }

      // STEP 3: Execute batch createTriples in ONE transaction
      console.log('[useBatchVote] Step 3: Executing batch createTriples...', {
        tripleCount: batchTriples.length,
      });

      const result = await createTriplesBatch(batchTriples);

      console.log('[useBatchVote] ✅ Batch createTriples success:', {
        txHash: result.transactionHash,
        tripleCount: result.tripleCount,
        totalAmount: formatEther(result.totalAmount),
      });

      txHashes.push(result.transactionHash);

      // STEP 4: For Progressive items, deposit remaining amount in Progressive curve
      if (progressiveDepositItems.length > 0) {
        console.log('[useBatchVote] Step 4: Depositing Progressive amounts for', progressiveDepositItems.length, 'items');

        // Parse the TripleCreated events from result to get termIds
        // We need termId to deposit (not totemId which is the objectId)
        const tripleTermIds = result.tripleTermIds || [];
        console.log('[useBatchVote] Triple termIds from creation:', tripleTermIds);

        // Build deposit arrays
        const depositTermIds: Hex[] = [];
        const depositCurveIds: bigint[] = [];
        const depositAmounts: bigint[] = [];

        for (let i = 0; i < progressiveDepositItems.length; i++) {
          const { totemId, item, progressiveAmount } = progressiveDepositItems[i];

          // Find the termId for this totem (objectId) in the created triples
          // The termIds array corresponds to main triples (founder->totem), not category triples
          // We need to match by totemId position
          const totemIndex = totemData.findIndex(td => td.totemId === totemId);
          // In batchTriples, main triples are at even positions (0, 2, 4...) if categories exist
          // or sequential if no categories
          let termIdIndex = totemIndex;
          // Adjust for category triples if they exist
          const hasCategoryTriples = batchTriples.length > totemData.length;
          if (hasCategoryTriples) {
            termIdIndex = totemIndex * 2; // Skip category triples
          }

          if (termIdIndex >= 0 && termIdIndex < tripleTermIds.length) {
            const termId = tripleTermIds[termIdIndex];
            // Use termId for FOR direction
            // For AGAINST we'd use counterTermId but AGAINST on new totems shows warning
            const depositTermId = item.direction === 'for' ? termId : termId; // AGAINST not supported yet

            depositTermIds.push(depositTermId);
            depositCurveIds.push(2n); // Progressive
            depositAmounts.push(progressiveAmount);

            console.log('[useBatchVote] Progressive deposit:', {
              totem: item.totemName,
              termId: depositTermId,
              curveId: 2,
              amount: formatEther(progressiveAmount),
            });
          } else {
            console.warn('[useBatchVote] Could not find termId for Progressive item:', item.totemName);
          }
        }

        if (depositTermIds.length > 0) {
          const totalProgressiveDeposit = depositAmounts.reduce((sum, a) => sum + a, 0n);

          console.log('[useBatchVote] Total Progressive deposit:', formatEther(totalProgressiveDeposit));

          const { request: depositRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'depositBatch',
            args: [
              address as Address,
              depositTermIds,
              depositCurveIds,
              depositAmounts,
              depositAmounts.map(() => 0n),
            ],
            value: totalProgressiveDeposit,
          });

          console.log('[useBatchVote] Sending Progressive depositBatch...');
          const progressiveTxHash = await walletClient.writeContract(depositRequest);
          await publicClient.waitForTransactionReceipt({ hash: progressiveTxHash });
          incrementStep();

          console.log('[useBatchVote] ✅ Progressive deposits SUCCESS!');
          txHashes.push(progressiveTxHash);
        }
      }

      console.log('[useBatchVote] ✅ Created', totemData.length, 'new totems in', batchTriples.length, 'triples');
      console.log('[useBatchVote] ========== CREATE NEW TOTEMS (BATCH) END ==========');

      return { txHashes, createdCount: totemData.length };
    },
    [address, walletClient, publicClient, multiVaultAddress, getOrCreateAtom, createTriplesBatch]
  );

  /**
   * Create triples for new totems (items with isNewTotem = true)
   * Returns a map of totemId -> { termId, counterTermId }
   * NOTE: Only processes items with valid totemId (items with newTotemData need atom creation first)
   *
   * IMPORTANT: Deduplicates triples before creation!
   * If cart has Eagle+Linear AND Eagle+Progressive, the triple is created ONCE.
   * Then deposits are handled separately per curve.
   *
   * 2-STEP PROCESS FOR PROGRESSIVE CURVE:
   * - createTriples always deposits in Linear (curveId=1) by default
   * - For items wanting Progressive (curveId=2), we:
   *   1. Create the triple with minimum deposit (Linear)
   *   2. Then depositBatch with remaining amount in Progressive
   */
  const executeCreateTriples = useCallback(
    async (
      founderId: Hex,
      itemsNeedingTriple: VoteCartItem[]
    ): Promise<{ txHash: Hex; createdTriples: Map<Hex, CreatedTripleInfo>; progressiveDepositTxHash?: Hex }> => {
      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Filter to only processable items (with valid totemId)
      // Items with newTotemData (totemId === null) cannot be processed here
      const processableItems = itemsNeedingTriple.filter(isProcessableItem);

      console.log('[useBatchVote] ========== CREATE TRIPLES START ==========');
      console.log('[useBatchVote] Creating triples for', processableItems.length, 'items (out of', itemsNeedingTriple.length, 'total)');
      console.log('[useBatchVote] Founder ID:', founderId);

      // Get contract config to know the triple cost
      const contractConfig = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });
      const tripleBaseCost = BigInt(contractConfig.triple_cost);
      const minDeposit = BigInt(contractConfig.min_deposit);
      const minRequiredAmount = tripleBaseCost + minDeposit;

      console.log('[useBatchVote] Contract config:', {
        tripleBaseCost: formatEther(tripleBaseCost),
        minDeposit: formatEther(minDeposit),
      });

      // Auto-adjust amounts that are very close to minimum (UI displays truncated values)
      // Example: UI shows "0.002" but exact minimum is "0.002000000002"
      // If difference is < 1 gwei (1e9 wei), auto-adjust to exact minimum
      const TOLERANCE_WEI = 1_000_000_000n; // 1 gwei tolerance

      for (const item of processableItems) {
        if (item.amount < minRequiredAmount) {
          const missing = minRequiredAmount - item.amount;
          if (missing <= TOLERANCE_WEI) {
            // Auto-adjust: amount is very close to minimum (truncation artifact)
            console.log('[useBatchVote] Auto-adjusting amount for', item.totemName, ':', {
              original: formatEther(item.amount),
              adjusted: formatEther(minRequiredAmount),
              missing: formatEther(missing),
            });
            // Mutate the item's amount to the exact minimum
            (item as { amount: bigint }).amount = minRequiredAmount;
          }
        }
      }

      // Validate that user's amount covers tripleBaseCost + minDeposit
      for (const item of processableItems) {
        if (item.amount < minRequiredAmount) {
          const missing = minRequiredAmount - item.amount;
          // Use truncation for consistent display like INTUITION
          const missingEther = formatEther(missing);
          const missingFormatted = parseFloat(missingEther) < 0.00001
            ? missingEther // Show full precision if very small
            : truncateAmount(parseFloat(missingEther));
          throw new Error(
            `"${item.totemName}" : il manque ${missingFormatted} TRUST`
          );
        }
      }

      // ========== DEDUPLICATE TRIPLES ==========
      // A triple is defined by (subject, predicate, object) - curve is NOT part of the triple!
      // If cart has Eagle+Linear AND Eagle+Progressive, we create the triple ONCE
      // then handle deposits separately per curve

      interface UniqueTriple {
        predicateId: Hex;
        totemId: Hex;
        totemName: string;
        items: ProcessableCartItem[]; // All cart items for this triple (may have different curves)
      }

      const uniqueTriples = new Map<string, UniqueTriple>();

      for (const item of processableItems) {
        // Key by predicate+totem (subject is always founderId)
        const tripleKey = `${item.predicateId}_${item.totemId}`;

        if (!uniqueTriples.has(tripleKey)) {
          uniqueTriples.set(tripleKey, {
            predicateId: item.predicateId,
            totemId: item.totemId,
            totemName: item.totemName,
            items: [item],
          });
        } else {
          // Same triple, different curve - add to the group
          uniqueTriples.get(tripleKey)!.items.push(item);
        }
      }

      console.log('[useBatchVote] Deduplicated:', processableItems.length, 'items →', uniqueTriples.size, 'unique triples');

      // Log deduplication details
      for (const triple of uniqueTriples.values()) {
        if (triple.items.length > 1) {
          console.log('[useBatchVote] Triple', triple.totemName, 'has', triple.items.length, 'items:',
            triple.items.map(i => `${i.curveId === 1 ? 'Linear' : 'Progressive'} ${i.direction}`).join(', ')
          );
        }
      }

      // Separate unique triples by curve type (use first item's curve for triple creation)
      // For mixed triples (same totem, different curves), we create with minimum and handle deposits later
      const linearOnlyTriples: UniqueTriple[] = [];
      const progressiveOnlyTriples: UniqueTriple[] = [];
      const mixedTriples: UniqueTriple[] = []; // Has both Linear and Progressive items

      for (const triple of uniqueTriples.values()) {
        const hasLinear = triple.items.some(i => i.curveId === 1);
        const hasProgressive = triple.items.some(i => i.curveId === 2);

        if (hasLinear && hasProgressive) {
          mixedTriples.push(triple);
        } else if (hasProgressive) {
          progressiveOnlyTriples.push(triple);
        } else {
          linearOnlyTriples.push(triple);
        }
      }

      // Track Linear AGAINST items - they need special handling after triple creation
      const linearAgainstItems = processableItems.filter(item => item.curveId === 1 && item.direction === 'against');

      // Keep reference to progressiveOnly items for later steps (used in Step 2 & 3)
      const progressiveItems = progressiveOnlyTriples.flatMap(t => t.items);

      console.log('[useBatchVote] Unique triples breakdown:', {
        linearOnlyCount: linearOnlyTriples.length,
        progressiveOnlyCount: progressiveOnlyTriples.length,
        mixedCount: mixedTriples.length,
        linearAgainstCount: linearAgainstItems.length,
        progressiveItemsCount: progressiveItems.length,
      });

      // Prepare arrays for createTriples call (DEDUPLICATED)
      const subjectIds: Hex[] = [];
      const predicateIds: Hex[] = [];
      const objectIds: Hex[] = [];
      const assets: bigint[] = [];

      // Track Progressive items for step 2 (redeem Linear) and step 3 (deposit Progressive)
      const progressiveDeposits: { termId: Hex; amount: bigint; direction: 'for' | 'against' }[] = [];
      const progressiveRedeems: { termId: Hex; shares: bigint }[] = []; // For redeeming Linear deposit

      // Track items that need deposit after triple creation (for mixed triples)
      const postCreationDeposits: { totemId: Hex; curveId: number; amount: bigint; direction: 'for' | 'against' }[] = [];

      // Build arrays for each UNIQUE triple
      for (const triple of uniqueTriples.values()) {
        subjectIds.push(founderId);
        predicateIds.push(triple.predicateId);
        objectIds.push(triple.totemId);

        const hasLinear = triple.items.some(i => i.curveId === 1);
        const hasProgressive = triple.items.some(i => i.curveId === 2);
        const isMixed = hasLinear && hasProgressive;

        if (isMixed) {
          // MIXED: Create triple with minimum, then deposit on each curve separately
          const createAmount = minRequiredAmount;
          assets.push(createAmount);

          console.log('[useBatchVote] Triple to create (MIXED - minimum):', {
            subject: founderId,
            predicate: triple.predicateId,
            object: `${triple.totemName} (${triple.totemId})`,
            createAmount: formatEther(createAmount),
            itemCount: triple.items.length,
          });

          // Store for redeem the minimum Linear deposit
          progressiveRedeems.push({
            termId: triple.totemId, // Temporary - will be replaced with actual termId
            shares: minDeposit,
          });

          // Store each item for post-creation deposit
          for (const item of triple.items) {
            postCreationDeposits.push({
              totemId: triple.totemId,
              curveId: item.curveId,
              amount: item.amount,
              direction: item.direction,
            });

            console.log('[useBatchVote]   → Post-creation deposit:', {
              curve: item.curveId === 1 ? 'Linear' : 'Progressive',
              direction: item.direction,
              amount: formatEther(item.amount),
            });
          }
        } else if (hasProgressive) {
          // PROGRESSIVE ONLY: 3-step process
          const item = triple.items[0]; // Use first (and only) item
          const createAmount = minRequiredAmount;
          assets.push(createAmount);

          console.log('[useBatchVote] Triple to create (PROGRESSIVE - 3-step):', {
            subject: founderId,
            predicate: item.predicateId,
            object: `${item.totemName} (${item.totemId})`,
            step1_createLinear: formatEther(createAmount),
            step2_redeemLinear: formatEther(minDeposit),
            step3_depositProgressive: formatEther(item.amount),
            userWantedAmount: formatEther(item.amount),
            direction: item.direction,
          });

          progressiveRedeems.push({
            termId: item.totemId,
            shares: minDeposit,
          });

          progressiveDeposits.push({
            termId: item.totemId,
            amount: item.amount,
            direction: item.direction,
          });
        } else {
          // LINEAR ONLY: Create triple with full amount
          const item = triple.items[0]; // Use first (and only) item
          assets.push(item.amount);

          const effectiveDeposit = item.amount > tripleBaseCost
            ? item.amount - tripleBaseCost
            : 0n;

          console.log('[useBatchVote] Triple to create (LINEAR - full amount):', {
            subject: founderId,
            predicate: item.predicateId,
            object: `${item.totemName} (${item.totemId})`,
            tripleBaseCost: formatEther(tripleBaseCost),
            userTotalBudget: formatEther(item.amount),
            effectiveDeposit: formatEther(effectiveDeposit),
          });
        }
      }

      const totalValue = assets.reduce((sum, a) => sum + a, 0n);

      console.log('[useBatchVote] Total value for createTriples:', formatEther(totalValue));

      // STEP 1: Simulate and execute createTriples
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
      incrementStep();

      console.log('[useBatchVote] createTriples confirmed!', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        logsCount: receipt.logs.length,
      });

      if (receipt.status !== 'success') {
        throw new Error('createTriples transaction failed');
      }

      // Parse logs to get the created triple termIds
      const createdTriples = new Map<Hex, CreatedTripleInfo>();
      const totemToTermId = new Map<Hex, Hex>(); // Map totemId -> termId for progressive deposits

      // Temporary structure to store basic info from logs
      interface TripleLogInfo {
        termId: Hex;
        objectId: Hex;
        subjectId: Hex;
        predicateId: Hex;
      }
      const triplesFromLogs: TripleLogInfo[] = [];

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
            const args = decoded.args as unknown as { termId: Hex; subjectId: Hex; predicateId: Hex; objectId: Hex };

            console.log('[useBatchVote] TripleCreated event from logs:', {
              termId: args.termId,
              objectId: args.objectId,
              subjectId: args.subjectId,
              predicateId: args.predicateId,
            });

            triplesFromLogs.push({
              termId: args.termId,
              objectId: args.objectId,
              subjectId: args.subjectId,
              predicateId: args.predicateId,
            });

            // Track for progressive deposits
            totemToTermId.set(args.objectId, args.termId);
          }
        } catch {
          // Not a TripleCreated event, skip
        }
      }

      if (triplesFromLogs.length === 0) {
        console.warn('[useBatchVote] Could not parse TripleCreated events, using fallback');
      }

      // IMPORTANT: Wait for GraphQL indexing then fetch real counterTermIds
      // The calculation termId + 1 is WRONG - counterTermId is a completely different hash
      console.log('[useBatchVote] Waiting for GraphQL indexing (3 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Fetch real counterTermIds from GraphQL for each created triple
      for (const tripleLog of triplesFromLogs) {
        const graphqlResult = await checkTripleExists(
          tripleLog.subjectId,
          tripleLog.predicateId, // Use the predicateId from the log
          tripleLog.objectId
        );

        if (graphqlResult.exists && graphqlResult.counterTermId) {
          console.log('[useBatchVote] Got real counterTermId from GraphQL:', {
            objectId: tripleLog.objectId,
            termId: graphqlResult.termId,
            counterTermId: graphqlResult.counterTermId,
          });

          createdTriples.set(tripleLog.objectId, {
            termId: graphqlResult.termId || tripleLog.termId,
            counterTermId: graphqlResult.counterTermId,
          });
        } else {
          console.warn('[useBatchVote] Could not get counterTermId from GraphQL for:', tripleLog.objectId);
          // Fallback: use termId from logs but counterTermId will be undefined
          // This will cause issues for AGAINST votes but at least FOR votes will work
          createdTriples.set(tripleLog.objectId, {
            termId: tripleLog.termId,
            counterTermId: '0x0' as Hex, // Placeholder - will fail for AGAINST
          });
        }
      }

      console.log('[useBatchVote] Created triples map:', createdTriples.size, 'entries');
      console.log('[useBatchVote] ✅ createTriples SUCCESS!');

      // STEP 1b: Handle Linear AGAINST items
      // createTriples deposits on FOR side (termId) by default
      // For AGAINST Linear items, we need to redeem FOR and deposit on counterTermId
      if (linearAgainstItems.length > 0) {
        console.log('[useBatchVote] ========== LINEAR AGAINST (STEP 1b) ==========');
        console.log('[useBatchVote] Processing', linearAgainstItems.length, 'Linear AGAINST items');

        // Step 1b-1: Redeem FOR Linear positions
        const linearRedeemTermIds: Hex[] = [];
        const linearRedeemCurveIds: bigint[] = [];
        const linearRedeemShares: bigint[] = [];

        for (const item of linearAgainstItems) {
          const tripleInfo = createdTriples.get(item.totemId);
          if (!tripleInfo) {
            console.warn('[useBatchVote] Could not find termId for Linear AGAINST:', item.totemName);
            continue;
          }

          // Get actual shares from the FOR Linear position we just created
          const forShares = await publicClient.readContract({
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'getShares',
            args: [address as Address, tripleInfo.termId, 1n], // Linear curve, FOR side
          }) as bigint;

          if (forShares > 0n) {
            linearRedeemTermIds.push(tripleInfo.termId);
            linearRedeemCurveIds.push(1n); // Linear
            linearRedeemShares.push(forShares);

            console.log('[useBatchVote] Linear AGAINST - will redeem FOR:', {
              totem: item.totemName,
              termId: tripleInfo.termId,
              forShares: formatEther(forShares),
            });
          }
        }

        // Execute redeem if we have items
        if (linearRedeemTermIds.length > 0) {
          const { request: linearRedeemRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'redeemBatch',
            args: [
              address as Address,
              linearRedeemTermIds,
              linearRedeemCurveIds,
              linearRedeemShares,
              linearRedeemShares.map(() => 0n), // minAssets
            ],
          });

          console.log('[useBatchVote] Linear AGAINST redeemBatch simulated, sending...');
          const linearRedeemTxHash = await walletClient.writeContract(linearRedeemRequest);
          await publicClient.waitForTransactionReceipt({ hash: linearRedeemTxHash });
          incrementStep();
          console.log('[useBatchVote] ✅ Linear FOR positions redeemed!');
        }

        // Step 1b-2: Deposit on counterTermId (AGAINST side) Linear
        const linearDepositTermIds: Hex[] = [];
        const linearDepositCurveIds: bigint[] = [];
        const linearDepositAmounts: bigint[] = [];

        for (const item of linearAgainstItems) {
          const tripleInfo = createdTriples.get(item.totemId);
          if (!tripleInfo || tripleInfo.counterTermId === '0x0') {
            console.warn('[useBatchVote] Could not find counterTermId for Linear AGAINST:', item.totemName);
            continue;
          }

          // Calculate deposit amount: user's amount minus tripleBaseCost (already paid)
          const depositAmount = item.amount > tripleBaseCost ? item.amount - tripleBaseCost : 0n;

          if (depositAmount > 0n) {
            linearDepositTermIds.push(tripleInfo.counterTermId);
            linearDepositCurveIds.push(1n); // Linear
            linearDepositAmounts.push(depositAmount);

            console.log('[useBatchVote] Linear AGAINST - will deposit on counterTermId:', {
              totem: item.totemName,
              counterTermId: tripleInfo.counterTermId,
              depositAmount: formatEther(depositAmount),
            });
          }
        }

        // Execute deposit if we have items
        if (linearDepositTermIds.length > 0) {
          const totalLinearDeposit = linearDepositAmounts.reduce((sum, a) => sum + a, 0n);

          const { request: linearDepositRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'depositBatch',
            args: [
              address as Address,
              linearDepositTermIds,
              linearDepositCurveIds,
              linearDepositAmounts,
              linearDepositAmounts.map(() => 0n), // minShares
            ],
            value: totalLinearDeposit,
          });

          console.log('[useBatchVote] Linear AGAINST depositBatch simulated, sending...');
          const linearDepositTxHash = await walletClient.writeContract(linearDepositRequest);
          await publicClient.waitForTransactionReceipt({ hash: linearDepositTxHash });
          incrementStep();
          console.log('[useBatchVote] ✅ Linear AGAINST deposits SUCCESS!');
        }

        console.log('[useBatchVote] ========== LINEAR AGAINST END ==========');
      }

      // STEP 2: Redeem Linear deposits for Progressive and Mixed items
      // For Progressive/Mixed votes, we created the triple in Linear (required by protocol)
      // Now we redeem that Linear deposit so we can deposit on the correct curves
      let progressiveRedeemTxHash: Hex | undefined;

      // Collect all totemIds that need redeem (progressive + mixed)
      const totemIdsNeedingRedeem = new Set<Hex>();
      for (const redeem of progressiveRedeems) {
        totemIdsNeedingRedeem.add(redeem.termId); // termId is actually totemId here (temporary)
      }

      if (progressiveRedeems.length > 0) {
        console.log('[useBatchVote] ========== REDEEM LINEAR MINIMUM (STEP 2) ==========');
        console.log('[useBatchVote] Redeeming Linear deposits for', progressiveRedeems.length, 'items (Progressive + Mixed)');

        // Build redeem arrays
        const redeemTermIds: Hex[] = [];
        const redeemCurveIds: bigint[] = [];
        const redeemShares: bigint[] = [];

        for (const redeemInfo of progressiveRedeems) {
          const totemId = redeemInfo.termId; // It's actually totemId (temporary storage)

          // Get the actual termId from the created triple
          const tripleInfo = createdTriples.get(totemId);
          if (!tripleInfo) {
            console.warn('[useBatchVote] Could not find termId for redeem:', totemId);
            continue;
          }

          // Redeem from termId (FOR side) - we created in Linear on FOR side
          const redeemTermId = tripleInfo.termId;

          // Get actual shares from contract (the minDeposit we just deposited)
          const actualShares = await publicClient.readContract({
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'getShares',
            args: [address as Address, redeemTermId, 1n], // Linear curve
          }) as bigint;

          console.log('[useBatchVote] Redeem from Linear:', {
            totemId,
            termId: redeemTermId,
            curveId: 1,
            expectedShares: formatEther(redeemInfo.shares),
            actualShares: formatEther(actualShares),
          });

          if (actualShares > 0n) {
            redeemTermIds.push(redeemTermId);
            redeemCurveIds.push(1n); // Linear curve
            redeemShares.push(actualShares);
          }
        }

        if (redeemTermIds.length > 0) {
          console.log('[useBatchVote] Redeeming', redeemTermIds.length, 'Linear positions');

          const { request: redeemRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'redeemBatch',
            args: [
              address as Address,
              redeemTermIds,
              redeemCurveIds, // All curveId=1 for Linear
              redeemShares,
              redeemShares.map(() => 0n), // minAssets
            ],
          });

          console.log('[useBatchVote] Progressive redeemBatch simulated, sending...');
          progressiveRedeemTxHash = await walletClient.writeContract(redeemRequest);

          const redeemReceipt = await publicClient.waitForTransactionReceipt({ hash: progressiveRedeemTxHash });
          incrementStep();

          if (redeemReceipt.status !== 'success') {
            throw new Error('Progressive redeemBatch failed');
          }

          console.log('[useBatchVote] ✅ Progressive Linear redeems SUCCESS!');
        }

        console.log('[useBatchVote] ========== PROGRESSIVE REDEEM END ==========');
      }

      // STEP 3: Deposit full amounts on Progressive curve
      // For AGAINST votes, the counter vault doesn't exist yet - we need to initialize it first
      let progressiveDepositTxHash: Hex | undefined;

      if (progressiveDeposits.length > 0 && progressiveItems.length > 0) {
        console.log('[useBatchVote] ========== PROGRESSIVE DEPOSIT (STEP 3) ==========');
        console.log('[useBatchVote] Depositing FULL user amounts for', progressiveDeposits.length, 'Progressive items');

        // Separate FOR and AGAINST items
        const forItems: { item: typeof progressiveItems[0]; depositInfo: typeof progressiveDeposits[0]; tripleInfo: CreatedTripleInfo }[] = [];
        const againstItems: { item: typeof progressiveItems[0]; depositInfo: typeof progressiveDeposits[0]; tripleInfo: CreatedTripleInfo }[] = [];

        for (let i = 0; i < progressiveItems.length; i++) {
          const item = progressiveItems[i];
          const depositInfo = progressiveDeposits[i];
          if (!depositInfo || depositInfo.amount <= 0n) continue;

          const tripleInfo = createdTriples.get(item.totemId);
          if (!tripleInfo) {
            console.warn('[useBatchVote] Could not find termId for Progressive item:', item.totemName);
            continue;
          }

          if (depositInfo.direction === 'for') {
            forItems.push({ item, depositInfo, tripleInfo });
          } else {
            againstItems.push({ item, depositInfo, tripleInfo });
          }
        }

        console.log('[useBatchVote] Items breakdown:', {
          forCount: forItems.length,
          againstCount: againstItems.length,
        });

        // STEP 3a: For AGAINST items on NEW triples, we need to:
        // 1. Initialize termId Progressive (FOR) first - counterTermId cannot be initialized directly
        // 2. Redeem termId Progressive
        // 3. Then Step 3b can deposit on counterTermId Progressive (AGAINST)
        if (againstItems.length > 0) {
          console.log('[useBatchVote] ========== AGAINST INIT (STEP 3a) ==========');
          console.log('[useBatchVote] For', againstItems.length, 'AGAINST items, initializing FOR Progressive first');

          // Step 3a-1: Deposit on termId Progressive to initialize FOR side
          const initTermIds: Hex[] = [];
          const initCurveIds: bigint[] = [];
          const initAmounts: bigint[] = [];

          for (const { item, tripleInfo } of againstItems) {
            initTermIds.push(tripleInfo.termId); // termId, not counterTermId!
            initCurveIds.push(2n); // Progressive curve
            initAmounts.push(minDeposit); // Minimum deposit to initialize vault

            console.log('[useBatchVote] Init FOR Progressive (to enable AGAINST):', {
              totem: item.totemName,
              termId: tripleInfo.termId,
              curveId: 2,
              amount: formatEther(minDeposit),
            });
          }

          const totalInitDeposit = initAmounts.reduce((sum, a) => sum + a, 0n);

          const { request: initRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'depositBatch',
            args: [
              address as Address,
              initTermIds,
              initCurveIds,
              initAmounts,
              initAmounts.map(() => 0n),
            ],
            value: totalInitDeposit,
          });

          console.log('[useBatchVote] FOR Progressive init depositBatch simulated, sending...');
          const initTxHash = await walletClient.writeContract(initRequest);
          await publicClient.waitForTransactionReceipt({ hash: initTxHash });
          incrementStep();
          console.log('[useBatchVote] ✅ FOR Progressive initialized!');

          // Step 3a-2: Redeem the FOR Progressive deposits to free up the FOR side
          // IMPORTANT: Use getShares to get actual shares, not a calculated amount
          // The deposit gives fewer shares than minDeposit due to protocol fees
          console.log('[useBatchVote] Now redeeming FOR Progressive to enable AGAINST...');

          const redeemTermIds: Hex[] = [];
          const redeemCurveIds: bigint[] = [];
          const redeemAmounts: bigint[] = [];

          for (const { item, tripleInfo } of againstItems) {
            // Read actual shares from contract
            const actualShares = await publicClient.readContract({
              address: multiVaultAddress,
              abi: MultiVaultAbi,
              functionName: 'getShares',
              args: [address as Address, tripleInfo.termId, 2n], // Progressive curve
            }) as bigint;

            if (actualShares > 0n) {
              redeemTermIds.push(tripleInfo.termId);
              redeemCurveIds.push(2n);
              redeemAmounts.push(actualShares);

              console.log('[useBatchVote] Redeem FOR Progressive:', {
                totem: item.totemName,
                termId: tripleInfo.termId,
                curveId: 2,
                actualShares: formatEther(actualShares),
              });
            } else {
              console.warn('[useBatchVote] No shares found for:', item.totemName);
            }
          }

          // Only execute redeem if we have items to redeem
          if (redeemTermIds.length > 0) {
            const { request: redeemRequest } = await publicClient.simulateContract({
              account: walletClient.account,
              address: multiVaultAddress,
              abi: MultiVaultAbi,
              functionName: 'redeemBatch',
              args: [
                address as Address,
                redeemTermIds,
                redeemCurveIds,
                redeemAmounts,
                redeemAmounts.map(() => 0n),
              ],
            });

            console.log('[useBatchVote] Redeem FOR Progressive simulated, sending...');
            const redeemTxHash = await walletClient.writeContract(redeemRequest);
            await publicClient.waitForTransactionReceipt({ hash: redeemTxHash });
            incrementStep();

            console.log('[useBatchVote] ✅ FOR Progressive redeemed! Counter vaults now accessible.');
          } else {
            console.warn('[useBatchVote] No shares to redeem - skipping redeem step');
          }
          console.log('[useBatchVote] ========== AGAINST INIT END ==========');
        }

        // STEP 3b: Now deposit all items on Progressive curve
        console.log('[useBatchVote] ========== PROGRESSIVE FINAL DEPOSIT (STEP 3b) ==========');

        const depositTermIds: Hex[] = [];
        const depositCurveIds: bigint[] = [];
        const depositAmounts: bigint[] = [];

        // Add FOR items
        for (const { item, depositInfo, tripleInfo } of forItems) {
          depositTermIds.push(tripleInfo.termId);
          depositCurveIds.push(2n);
          depositAmounts.push(depositInfo.amount);

          console.log('[useBatchVote] Progressive deposit (FOR):', {
            totem: item.totemName,
            termId: tripleInfo.termId,
            curveId: 2,
            amount: formatEther(depositInfo.amount),
          });
        }

        // Add AGAINST items (counter vault is now initialized)
        for (const { item, depositInfo, tripleInfo } of againstItems) {
          depositTermIds.push(tripleInfo.counterTermId);
          depositCurveIds.push(2n);
          depositAmounts.push(depositInfo.amount);

          console.log('[useBatchVote] Progressive deposit (AGAINST):', {
            totem: item.totemName,
            counterTermId: tripleInfo.counterTermId,
            curveId: 2,
            amount: formatEther(depositInfo.amount),
          });
        }

        if (depositTermIds.length > 0) {
          const totalProgressiveDeposit = depositAmounts.reduce((sum, a) => sum + a, 0n);

          console.log('[useBatchVote] Total Progressive deposit:', formatEther(totalProgressiveDeposit));

          const { request: depositRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'depositBatch',
            args: [
              address as Address,
              depositTermIds,
              depositCurveIds,
              depositAmounts,
              depositAmounts.map(() => 0n),
            ],
            value: totalProgressiveDeposit,
          });

          console.log('[useBatchVote] Progressive depositBatch simulated, sending...');
          progressiveDepositTxHash = await walletClient.writeContract(depositRequest);

          const depositReceipt = await publicClient.waitForTransactionReceipt({ hash: progressiveDepositTxHash });
          incrementStep();

          if (depositReceipt.status !== 'success') {
            throw new Error('Progressive depositBatch failed');
          }

          console.log('[useBatchVote] ✅ Progressive deposits SUCCESS!');
        }

        console.log('[useBatchVote] ========== PROGRESSIVE DEPOSIT END ==========');
      }

      // STEP 4: Handle post-creation deposits for MIXED triples
      // For triples with both Linear and Progressive items, we created with minimum
      // Now deposit each item on its correct curve
      //
      // IMPORTANT: Progressive AGAINST requires special handling!
      // - Cannot directly initialize counter vault on Progressive
      // - Must first deposit on termId (Progressive FOR), then redeem, then deposit on counterTermId
      if (postCreationDeposits.length > 0) {
        console.log('[useBatchVote] ========== MIXED TRIPLES POST-CREATION DEPOSITS (STEP 4) ==========');
        console.log('[useBatchVote] Processing', postCreationDeposits.length, 'post-creation deposits');

        // Separate deposits into two groups:
        // 1. Direct deposits (Linear FOR/AGAINST, Progressive FOR) - can deposit directly
        // 2. Progressive AGAINST - requires init, redeem, then deposit
        const directDeposits: { termId: Hex; curveId: bigint; amount: bigint }[] = [];
        const progressiveAgainstDeposits: { totemId: Hex; termId: Hex; counterTermId: Hex; amount: bigint }[] = [];

        for (const deposit of postCreationDeposits) {
          const tripleInfo = createdTriples.get(deposit.totemId);
          if (!tripleInfo) {
            console.warn('[useBatchVote] Could not find tripleInfo for post-creation deposit:', deposit.totemId);
            continue;
          }

          const isProgressiveAgainst = deposit.curveId === 2 && deposit.direction === 'against';

          if (isProgressiveAgainst) {
            // Progressive AGAINST - needs special 3-step process
            progressiveAgainstDeposits.push({
              totemId: deposit.totemId,
              termId: tripleInfo.termId,
              counterTermId: tripleInfo.counterTermId,
              amount: deposit.amount,
            });
            console.log('[useBatchVote] Progressive AGAINST deposit (requires init):', {
              totemId: deposit.totemId,
              termId: tripleInfo.termId,
              counterTermId: tripleInfo.counterTermId,
              amount: formatEther(deposit.amount),
            });
          } else {
            // Direct deposit (Linear or Progressive FOR)
            const termId = deposit.direction === 'for' ? tripleInfo.termId : tripleInfo.counterTermId;
            directDeposits.push({
              termId,
              curveId: BigInt(deposit.curveId),
              amount: deposit.amount,
            });
            console.log('[useBatchVote] Direct deposit:', {
              termId,
              curve: deposit.curveId === 1 ? 'Linear' : 'Progressive',
              direction: deposit.direction,
              amount: formatEther(deposit.amount),
            });
          }
        }

        // STEP 4a: Execute direct deposits (Linear and Progressive FOR)
        if (directDeposits.length > 0) {
          const totalDirectDeposit = directDeposits.reduce((sum, d) => sum + d.amount, 0n);
          console.log('[useBatchVote] Direct deposits total:', formatEther(totalDirectDeposit));

          const { request: directDepositRequest } = await publicClient.simulateContract({
            account: walletClient.account,
            address: multiVaultAddress,
            abi: MultiVaultAbi,
            functionName: 'depositBatch',
            args: [
              address as Address,
              directDeposits.map(d => d.termId),
              directDeposits.map(d => d.curveId),
              directDeposits.map(d => d.amount),
              directDeposits.map(() => 0n),
            ],
            value: totalDirectDeposit,
          });

          console.log('[useBatchVote] Direct depositBatch simulated, sending...');
          const directDepositTxHash = await walletClient.writeContract(directDepositRequest);
          await publicClient.waitForTransactionReceipt({ hash: directDepositTxHash });
          console.log('[useBatchVote] ✅ Direct deposits SUCCESS!');
        }

        // STEP 4b: Handle Progressive AGAINST deposits (3-step process per deposit)
        // For each: init Progressive FOR vault → redeem → deposit Progressive AGAINST
        if (progressiveAgainstDeposits.length > 0) {
          console.log('[useBatchVote] Processing', progressiveAgainstDeposits.length, 'Progressive AGAINST deposits');

          for (const deposit of progressiveAgainstDeposits) {
            console.log('[useBatchVote] Progressive AGAINST 3-step for:', deposit.totemId);

            // Step 1: Initialize Progressive FOR vault with minDeposit
            console.log('[useBatchVote]   Step 1: Init Progressive FOR with minDeposit');
            const { request: initRequest } = await publicClient.simulateContract({
              account: walletClient.account,
              address: multiVaultAddress,
              abi: MultiVaultAbi,
              functionName: 'depositBatch',
              args: [
                address as Address,
                [deposit.termId],
                [2n], // Progressive curve
                [minDeposit],
                [0n],
              ],
              value: minDeposit,
            });
            const initTxHash = await walletClient.writeContract(initRequest);
            const initReceipt = await publicClient.waitForTransactionReceipt({ hash: initTxHash });

            // Get actual shares from init deposit
            let initShares = minDeposit; // Fallback
            for (const log of initReceipt.logs) {
              try {
                const event = decodeEventLog({
                  abi: MultiVaultAbi,
                  data: log.data,
                  topics: log.topics,
                });
                if (event.eventName === 'Deposited') {
                  const args = event.args as { shares?: bigint };
                  if (args.shares) {
                    initShares = args.shares;
                  }
                }
              } catch {
                // Skip non-matching logs
              }
            }
            console.log('[useBatchVote]   Step 1 done, shares:', formatEther(initShares));

            // Step 2: Redeem the init deposit
            console.log('[useBatchVote]   Step 2: Redeem init deposit');
            const { request: redeemRequest } = await publicClient.simulateContract({
              account: walletClient.account,
              address: multiVaultAddress,
              abi: MultiVaultAbi,
              functionName: 'redeemBatch',
              args: [
                address as Address, // receiver
                [deposit.termId],
                [2n], // Progressive curve
                [initShares],
                [0n],
              ],
            });
            const redeemTxHash = await walletClient.writeContract(redeemRequest);
            await publicClient.waitForTransactionReceipt({ hash: redeemTxHash });
            console.log('[useBatchVote]   Step 2 done, redeemed:', formatEther(initShares));

            // Step 3: Deposit on Progressive AGAINST (counterTermId)
            console.log('[useBatchVote]   Step 3: Deposit Progressive AGAINST');
            const { request: againstRequest } = await publicClient.simulateContract({
              account: walletClient.account,
              address: multiVaultAddress,
              abi: MultiVaultAbi,
              functionName: 'depositBatch',
              args: [
                address as Address,
                [deposit.counterTermId],
                [2n], // Progressive curve
                [deposit.amount],
                [0n],
              ],
              value: deposit.amount,
            });
            const againstTxHash = await walletClient.writeContract(againstRequest);
            await publicClient.waitForTransactionReceipt({ hash: againstTxHash });
            console.log('[useBatchVote]   Step 3 done, deposited:', formatEther(deposit.amount));

            console.log('[useBatchVote] ✅ Progressive AGAINST for', deposit.totemId, 'SUCCESS!');
          }
        }

        incrementStep();
        console.log('[useBatchVote] ========== MIXED TRIPLES END ==========');
      }

      console.log('[useBatchVote] ========== CREATE TRIPLES END ==========');

      return { txHash, createdTriples, progressiveDepositTxHash };
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
            curveId: item.curveId,
            amount: formatEther(item.amount),
            isNewTotem: item.isNewTotem,
            needsWithdraw: item.needsWithdraw,
            currentPosition: item.currentPosition ? {
              direction: item.currentPosition.direction,
              shares: item.currentPosition.shares.toString(),
              curveId: item.currentPosition.curveId,
            } : undefined,
          });
        });

        // Identify items needing different actions
        // 1. Items with newTotemData (totemId === null) → need full totem creation via createClaimWithCategory
        // 2. Items with valid totemId but isNewTotem → need triple creation via createTriples
        // 3. Items with needsWithdraw → need redeem first
        // 4. Items with existing triples → just deposit

        // Brand new totems (need atom + triple creation)
        const itemsWithNewTotemData: VoteCartItem[] = cart.items.filter(
          (item) => item.newTotemData && item.totemId === null
        );

        // STEP 0.5: Verify which items ACTUALLY need triple creation
        // Some items may have isNewTotem=true but the triple already exists (stale cart data)
        console.log('[useBatchVote] ========== TRIPLE EXISTENCE CHECK ==========');

        // Create a mutable copy of cart items with verified status
        const verifiedItems: VoteCartItem[] = [];

        for (const item of cart.items) {
          // Skip items with newTotemData (they always need full creation)
          if (item.newTotemData && item.totemId === null) {
            verifiedItems.push(item);
            continue;
          }

          // If item has valid totemId but isNewTotem flag is set, verify with blockchain
          if (item.totemId && item.isNewTotem) {
            console.log('[useBatchVote] Verifying triple existence for:', item.totemName);

            const tripleCheck = await checkTripleExists(
              cart.founderId,
              item.predicateId,
              item.totemId
            );

            if (tripleCheck.exists && tripleCheck.termId) {
              console.log('[useBatchVote] ✅ Triple ALREADY EXISTS! Updating item:', {
                totem: item.totemName,
                termId: tripleCheck.termId,
                counterTermId: tripleCheck.counterTermId,
              });

              // Update item with actual termId/counterTermId and mark as NOT new
              verifiedItems.push({
                ...item,
                termId: tripleCheck.termId,
                counterTermId: tripleCheck.counterTermId || item.counterTermId,
                isNewTotem: false, // Triple exists, no need to create
              });

              toast.info(`Triple "${item.totemName}" existe déjà - dépôt direct`);
            } else {
              console.log('[useBatchVote] Triple does NOT exist, will create:', item.totemName);
              verifiedItems.push(item);
            }
          } else {
            // Item doesn't need verification (already has termId or isNewTotem=false)
            verifiedItems.push(item);
          }
        }

        console.log('[useBatchVote] Verification complete. Updated items:', verifiedItems.length);

        // Filter to only processable items (with valid totemId/termId/counterTermId)
        const processableItems: ProcessableCartItem[] = verifiedItems.filter(isProcessableItem);
        const itemsNeedingTriple: ProcessableCartItem[] = processableItems.filter((item) => item.isNewTotem);
        const itemsToRedeem: ProcessableCartItem[] = processableItems.filter((item) => item.needsWithdraw);
        const itemsWithExistingTriples: ProcessableCartItem[] = processableItems.filter((item) => !item.isNewTotem);

        const hasNewTotems = itemsWithNewTotemData.length > 0;
        const hasNewTriples = itemsNeedingTriple.length > 0;
        const hasRedeems = itemsToRedeem.length > 0;
        const hasExistingTriples = itemsWithExistingTriples.length > 0;

        // Calculate total steps more accurately:
        // Account for Progressive 3-step process and AGAINST initialization
        let steps = 0;

        // Step: Create brand new totems (createClaimWithCategory)
        if (hasNewTotems) {
          steps++; // 1 tx for batch create
          // Progressive new totems add 1 more tx (depositBatch Progressive)
          const progressiveNewTotems = itemsWithNewTotemData.filter(item => item.curveId === 2);
          if (progressiveNewTotems.length > 0) steps++;
        }

        // Steps: Create new triples on existing totems
        if (hasNewTriples) {
          steps++; // 1 tx for createTriples
          // Check for Progressive items (need redeem Linear + deposit Progressive = 2 more tx)
          const progressiveTriples = itemsNeedingTriple.filter(item => item.curveId === 2);
          if (progressiveTriples.length > 0) steps += 2; // redeemLinear + depositProgressive
          // Check for Linear AGAINST (need redeem FOR + deposit AGAINST = 2 more tx)
          const linearAgainstTriples = itemsNeedingTriple.filter(item => item.curveId === 1 && item.direction === 'against');
          if (linearAgainstTriples.length > 0) steps += 2;
          // Check for Progressive AGAINST (need init FOR + redeem FOR = 2 more tx, on top of Progressive steps)
          const progressiveAgainstTriples = itemsNeedingTriple.filter(item => item.curveId === 2 && item.direction === 'against');
          if (progressiveAgainstTriples.length > 0) steps += 2;
        }

        // Step: Redeem existing positions (if switching)
        if (hasRedeems) steps++;

        // Steps: Deposit on existing triples
        if (hasExistingTriples) {
          steps++; // 1 tx for depositBatch
          // Progressive AGAINST may need init + redeem (2 more tx)
          const progressiveAgainstExisting = itemsWithExistingTriples.filter(
            item => item.curveId === 2 && item.direction === 'against'
          );
          if (progressiveAgainstExisting.length > 0) steps += 2;
          // Linear AGAINST may need redeem FOR first (1 more tx)
          const linearAgainstExisting = itemsWithExistingTriples.filter(
            item => item.curveId === 1 && item.direction === 'against'
          );
          if (linearAgainstExisting.length > 0) steps++;
        }

        if (steps === 0) steps = 1; // At least 1 step
        setTotalSteps(steps);
        // Initialiser le ref avec le total calculé
        stepCounterRef.current = { current: 0, total: steps };

        console.log('[useBatchVote] Execution plan:', {
          hasNewTotems,
          newTotemsCount: itemsWithNewTotemData.length,
          hasNewTriples,
          newTriplesCount: itemsNeedingTriple.length,
          hasRedeems,
          redeemsCount: itemsToRedeem.length,
          hasExistingTriples,
          existingTriplesCount: itemsWithExistingTriples.length,
          totalSteps: steps,
        });
        console.log('[useBatchVote] 📝 NOTE: New totems use createClaimWithCategory, new triples use createTriples');

        let newTotemTxHashes: Hex[] | undefined;
        let createTriplesTxHash: Hex | undefined;
        let totalRedeemed = 0n;
        let triplesCreated = 0;
        let newTotemsCreated = 0;

        // Make a mutable copy of verified items to update termIds after triple creation
        const updatedItems = [...verifiedItems];

        // Step 0: Create brand new totems (if needed)
        if (hasNewTotems) {
          incrementStep();
          setStatus('creating_atoms');
          toast.info(
            `Étape ${stepCounterRef.current.current}/${steps}: Création de ${itemsWithNewTotemData.length} nouveau(x) totem(s)...`
          );

          console.log('[useBatchVote] Creating brand new totems via createClaimWithCategory...');
          const { txHashes, createdCount } = await executeCreateNewTotems(
            cart.founderId,
            itemsWithNewTotemData
          );
          newTotemTxHashes = txHashes;
          newTotemsCreated = createdCount;

          toast.success(`${createdCount} totem(s) créé(s) !`);
        }

        // Step 1: Create Triples for existing totems (if needed)
        if (hasNewTriples) {
          incrementStep();
          setStatus('creating_atoms');
          toast.info(
            `Étape ${stepCounterRef.current.current}/${steps}: Création des relations fondateur-totem...`
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
            // Skip items without totemId (need atom creation first)
            if (item.isNewTotem && item.totemId !== null) {
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

        // Step 2: Handle redeems and deposits (sequential - 2 separate transactions)
        // NOTE: Atomic via Multicall3 is NOT possible because redeemBatch checks
        // _isApprovedToRedeem(msg.sender, receiver) and Multicall3 is not approved
        let redeemTxHash: Hex | undefined;
        let depositTxHash: Hex | undefined;

        if (hasRedeems || hasExistingTriples) {
          // Get contract config for min_deposit (needed for vault initialization)
          const contractConfig = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });

          // Get items to deposit (only those that were originally existing triples and are processable)
          const itemsToDeposit: ProcessableCartItem[] = updatedItems
            .filter(isProcessableItem)
            .filter(item =>
              itemsWithExistingTriples.some(orig => orig.totemId === item.totemId)
            );

          // Calculate totals
          const depositTotal = itemsToDeposit.reduce((sum, item) => sum + item.amount, 0n);

          console.log('[useBatchVote] Using SEQUENTIAL transactions (2 tx)');

          // Step 2a: Redeem first (if needed)
          if (hasRedeems) {
            incrementStep();
            setStatus('withdrawing');
            toast.info(`Étape ${stepCounterRef.current.current}/${steps}: Retrait des positions...`);

            console.log('[useBatchVote] Executing redeemBatch');

            const redeemTermIds: Hex[] = [];
            const redeemCurveIds: bigint[] = [];
            const redeemShares: bigint[] = [];

            // Verify actual shares from contract before redeeming
            // Cart data may be stale (from localStorage)
            for (const item of itemsToRedeem) {
              if (!item.currentPosition) continue;
              const redeemTermId =
                item.currentPosition.direction === 'for'
                  ? item.termId
                  : item.counterTermId;
              const curveId = BigInt(item.currentPosition.curveId);

              // Read actual shares from contract to avoid "InsufficientSharesInVault" error
              const actualShares = await publicClient.readContract({
                address: multiVaultAddress,
                abi: MultiVaultAbi,
                functionName: 'getShares',
                args: [address as Address, redeemTermId, curveId],
              }) as bigint;

              console.log('[useBatchVote] Verifying shares for redeem:', {
                totem: item.totemName,
                termId: redeemTermId,
                curveId: curveId.toString(),
                cartShares: item.currentPosition.shares.toString(),
                actualShares: actualShares.toString(),
              });

              // Skip if no actual shares (cart data was stale)
              if (actualShares <= 0n) {
                console.warn('[useBatchVote] ⚠️ No shares to redeem for', item.totemName, '- skipping (cart data stale)');
                toast.warning(`Position déjà retirée pour "${item.totemName}" - ignoré`);
                continue;
              }

              redeemTermIds.push(redeemTermId);
              redeemCurveIds.push(curveId);
              // Use actual shares from contract, not stale cart data
              redeemShares.push(actualShares);
              totalRedeemed += actualShares;
            }

            // Only execute redeem if there are items to redeem
            if (redeemTermIds.length === 0) {
              console.log('[useBatchVote] No valid positions to redeem - all were stale');
              toast.info('Aucune position à retirer (déjà retirées)');
            } else {
              console.log('[useBatchVote] Redeem details:', redeemTermIds.map((termId, i) => ({
                termId,
                curveId: redeemCurveIds[i].toString(),
                shares: redeemShares[i].toString(),
              })));

              const { request: redeemRequest } = await publicClient.simulateContract({
                account: walletClient.account,
                address: multiVaultAddress,
                abi: MultiVaultAbi,
                functionName: 'redeemBatch',
                args: [
                  address as Address,
                  redeemTermIds,
                  redeemCurveIds, // Use actual curveIds from positions, not DEFAULT_CURVE_ID
                  redeemShares,
                  redeemShares.map(() => 0n),
                ],
              });

              redeemTxHash = await walletClient.writeContract(redeemRequest);
              await publicClient.waitForTransactionReceipt({ hash: redeemTxHash });
              incrementStep();

              toast.success(`Retrait de ${formatEther(totalRedeemed)} shares effectué!`);
            }
          }

          // Step 2b: Deposit (if there are existing triples to deposit)
          if (hasExistingTriples) {
            incrementStep();
            setStatus('depositing');
            toast.info(`Étape ${stepCounterRef.current.current}/${steps}: Dépôt des votes...`);

            console.log('[useBatchVote] Executing depositBatch');

            // Separate items by type:
            // - Progressive AGAINST needs special handling (initialize FOR first)
            // - Everything else can be deposited directly
            const progressiveAgainstItems = itemsToDeposit.filter(
              item => item.curveId === 2 && item.direction === 'against'
            );
            const otherItems = itemsToDeposit.filter(
              item => !(item.curveId === 2 && item.direction === 'against')
            );

            // Also identify Linear AGAINST items
            const linearAgainstItems = itemsToDeposit.filter(
              item => item.curveId === 1 && item.direction === 'against'
            );

            console.log('[useBatchVote] Items breakdown:', {
              progressiveAgainstCount: progressiveAgainstItems.length,
              linearAgainstCount: linearAgainstItems.length,
              otherCount: otherItems.length,
            });

            // STEP 2b-0: For Linear AGAINST votes, check if user has blocking FOR positions
            if (linearAgainstItems.length > 0) {
              console.log('[useBatchVote] ⚠️ Linear AGAINST - checking for blocking FOR positions');

              const linearForPositionsToRedeem: { termId: Hex; shares: bigint }[] = [];

              for (const item of linearAgainstItems) {
                // Check user's FOR shares on Linear curve
                const forShares = await publicClient.readContract({
                  address: multiVaultAddress,
                  abi: MultiVaultAbi,
                  functionName: 'getShares',
                  args: [address as Address, item.termId, 1n], // Linear FOR
                }) as bigint;

                console.log('[useBatchVote] Checking Linear FOR position:', {
                  totem: item.totemName,
                  termId: item.termId,
                  forShares: forShares.toString(),
                  needsRedeem: forShares > 0n,
                });

                if (forShares > 0n) {
                  linearForPositionsToRedeem.push({ termId: item.termId, shares: forShares });
                }
              }

              // Redeem any blocking FOR positions on Linear
              if (linearForPositionsToRedeem.length > 0) {
                console.log('[useBatchVote] Redeeming', linearForPositionsToRedeem.length, 'blocking Linear FOR positions');

                const redeemTermIds = linearForPositionsToRedeem.map(p => p.termId);
                const redeemCurveIds = linearForPositionsToRedeem.map(() => 1n); // Linear curve
                const redeemShares = linearForPositionsToRedeem.map(p => p.shares);

                console.log('[useBatchVote] Linear Redeem details:', linearForPositionsToRedeem.map(p => ({
                  termId: p.termId,
                  shares: p.shares.toString(),
                })));

                const { request: redeemRequest } = await publicClient.simulateContract({
                  account: walletClient.account,
                  address: multiVaultAddress,
                  abi: MultiVaultAbi,
                  functionName: 'redeemBatch',
                  args: [
                    address as Address,
                    redeemTermIds,
                    redeemCurveIds,
                    redeemShares,
                    redeemShares.map(() => 0n),
                  ],
                });

                const redeemTxHash = await walletClient.writeContract(redeemRequest);
                await publicClient.waitForTransactionReceipt({ hash: redeemTxHash });
                incrementStep();
                console.log('[useBatchVote] ✅ Blocking Linear FOR positions redeemed');
              }
            }

            // STEP 2b-1: For Progressive AGAINST votes, we need to handle two cases:
            // 1. User has FOR position on Progressive curve → need to redeem it first (HasCounterStake error)
            // 2. Vault not initialized on Progressive curve → need to initialize it (CannotDirectlyInitializeCounterTriple)
            if (progressiveAgainstItems.length > 0) {
              console.log('[useBatchVote] ⚠️ Progressive AGAINST - checking for blocking FOR positions');

              // Check if user has any FOR positions on Progressive that would block AGAINST vote
              const forPositionsToRedeem: { termId: Hex; shares: bigint }[] = [];

              for (const item of progressiveAgainstItems) {
                // Check user's FOR shares on Progressive curve
                const forShares = await publicClient.readContract({
                  address: multiVaultAddress,
                  abi: MultiVaultAbi,
                  functionName: 'getShares',
                  args: [address as Address, item.termId, 2n], // Progressive FOR
                }) as bigint;

                console.log('[useBatchVote] Checking Progressive FOR position:', {
                  totem: item.totemName,
                  termId: item.termId,
                  forShares: forShares.toString(),
                  needsRedeem: forShares > 0n,
                });

                if (forShares > 0n) {
                  forPositionsToRedeem.push({ termId: item.termId, shares: forShares });
                }
              }

              // Redeem any blocking FOR positions
              if (forPositionsToRedeem.length > 0) {
                console.log('[useBatchVote] Redeeming', forPositionsToRedeem.length, 'blocking FOR positions');

                const redeemTermIds = forPositionsToRedeem.map(p => p.termId);
                const redeemCurveIds = forPositionsToRedeem.map(() => 2n);
                const redeemShares = forPositionsToRedeem.map(p => p.shares);

                console.log('[useBatchVote] Redeem details:', forPositionsToRedeem.map(p => ({
                  termId: p.termId,
                  shares: p.shares.toString(),
                })));

                const { request: redeemRequest } = await publicClient.simulateContract({
                  account: walletClient.account,
                  address: multiVaultAddress,
                  abi: MultiVaultAbi,
                  functionName: 'redeemBatch',
                  args: [
                    address as Address,
                    redeemTermIds,
                    redeemCurveIds,
                    redeemShares,
                    redeemShares.map(() => 0n),
                  ],
                });

                const redeemTxHash = await walletClient.writeContract(redeemRequest);
                await publicClient.waitForTransactionReceipt({ hash: redeemTxHash });
                incrementStep();
                console.log('[useBatchVote] ✅ Blocking FOR positions redeemed');
              }

              // Progressive AGAINST items detected - they will be handled with try-catch below
              console.log('[useBatchVote] ⚠️ Progressive AGAINST detected - will handle with try-catch simulation');
            }

            // STEP 2b-2: Deposit all items with try-catch for vault initialization
            // If CannotDirectlyInitializeCounterTriple error occurs, we initialize and retry
            const depositTermIds: Hex[] = [];
            const depositCurveIds: bigint[] = [];
            const depositAmounts: bigint[] = [];

            for (const item of itemsToDeposit) {
              const depositTermId =
                item.direction === 'for' ? item.termId : item.counterTermId;
              depositTermIds.push(depositTermId);
              depositCurveIds.push(BigInt(item.curveId)); // Use item's curveId (1=Linear, 2=Progressive)
              depositAmounts.push(item.amount);
            }

            console.log('[useBatchVote] Deposit details:', depositTermIds.map((termId, i) => ({
              termId,
              curveId: depositCurveIds[i].toString(),
              amount: formatEther(depositAmounts[i]),
            })));

            // Try-catch approach for CannotDirectlyInitializeCounterTriple error
            // If Progressive AGAINST vault is not initialized, we need to:
            // 1. Deposit on FOR Progressive to initialize
            // 2. Redeem immediately
            // 3. Retry the original deposit

            let depositSimulated = false;
            // Use 'unknown' type to avoid viem transaction type incompatibilities (legacy vs eip7702)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let depositRequestToExecute: any = null;

            try {
              console.log('[useBatchVote] Attempting deposit simulation...');
              const { request } = await publicClient.simulateContract({
                account: walletClient.account,
                address: multiVaultAddress,
                abi: MultiVaultAbi,
                functionName: 'depositBatch',
                args: [
                  address as Address,
                  depositTermIds,
                  depositCurveIds,
                  depositAmounts,
                  depositAmounts.map(() => 0n),
                ],
                value: depositTotal,
              });
              depositRequestToExecute = request;
              depositSimulated = true;
              console.log('[useBatchVote] ✅ Deposit simulation succeeded');
            } catch (simError: unknown) {
              const simErrorMessage = (simError as { message?: string })?.message || '';
              console.log('[useBatchVote] ❌ Deposit simulation failed:', simErrorMessage);

              // Check if it's the CannotDirectlyInitializeCounterTriple error
              if (simErrorMessage.includes('CannotDirectlyInitializeCounterTriple')) {
                console.log('[useBatchVote] 🔧 Detected CannotDirectlyInitializeCounterTriple - initializing vaults');

                // Get min deposit from contract config
                const minDepositForInit = BigInt(contractConfig.min_deposit);

                // Initialize Progressive FOR vaults for all Progressive AGAINST items
                const initTermIds = progressiveAgainstItems.map(item => item.termId);
                const initCurveIds = progressiveAgainstItems.map(() => 2n); // Progressive
                const initAmounts = progressiveAgainstItems.map(() => minDepositForInit);
                const totalInitAmount = minDepositForInit * BigInt(progressiveAgainstItems.length);

                console.log('[useBatchVote] Init deposit details:', progressiveAgainstItems.map(item => ({
                  totem: item.totemName,
                  termId: item.termId,
                  amount: formatEther(minDepositForInit),
                })));

                // Step 1: Deposit minimum on FOR Progressive to initialize
                const { request: initDepositRequest } = await publicClient.simulateContract({
                  account: walletClient.account,
                  address: multiVaultAddress,
                  abi: MultiVaultAbi,
                  functionName: 'depositBatch',
                  args: [
                    address as Address,
                    initTermIds,
                    initCurveIds,
                    initAmounts,
                    initAmounts.map(() => 0n),
                  ],
                  value: totalInitAmount,
                });

                const initDepositTxHash = await walletClient.writeContract(initDepositRequest);
                await publicClient.waitForTransactionReceipt({ hash: initDepositTxHash });
                incrementStep();
                console.log('[useBatchVote] ✅ Progressive FOR vaults initialized');

                // Step 2: Immediately redeem to free up the FOR side
                const redeemInitTermIds: Hex[] = [];
                const redeemInitCurveIds: bigint[] = [];
                const redeemInitShares: bigint[] = [];

                for (const item of progressiveAgainstItems) {
                  const shares = await publicClient.readContract({
                    address: multiVaultAddress,
                    abi: MultiVaultAbi,
                    functionName: 'getShares',
                    args: [address as Address, item.termId, 2n], // Progressive
                  }) as bigint;

                  if (shares > 0n) {
                    redeemInitTermIds.push(item.termId);
                    redeemInitCurveIds.push(2n);
                    redeemInitShares.push(shares);
                  }
                }

                if (redeemInitTermIds.length > 0) {
                  console.log('[useBatchVote] Redeeming init deposits:', redeemInitTermIds.map((t, i) => ({
                    termId: t,
                    shares: redeemInitShares[i].toString(),
                  })));

                  const { request: redeemInitRequest } = await publicClient.simulateContract({
                    account: walletClient.account,
                    address: multiVaultAddress,
                    abi: MultiVaultAbi,
                    functionName: 'redeemBatch',
                    args: [
                      address as Address,
                      redeemInitTermIds,
                      redeemInitCurveIds,
                      redeemInitShares,
                      redeemInitShares.map(() => 0n),
                    ],
                  });

                  const redeemInitTxHash = await walletClient.writeContract(redeemInitRequest);
                  await publicClient.waitForTransactionReceipt({ hash: redeemInitTxHash });
                  incrementStep();
                  console.log('[useBatchVote] ✅ Init deposits redeemed - Progressive AGAINST now possible');
                }

                // Step 3: Retry the original deposit
                console.log('[useBatchVote] Retrying deposit simulation...');
                const { request } = await publicClient.simulateContract({
                  account: walletClient.account,
                  address: multiVaultAddress,
                  abi: MultiVaultAbi,
                  functionName: 'depositBatch',
                  args: [
                    address as Address,
                    depositTermIds,
                    depositCurveIds,
                    depositAmounts,
                    depositAmounts.map(() => 0n),
                  ],
                  value: depositTotal,
                });
                depositRequestToExecute = request;
                depositSimulated = true;
                console.log('[useBatchVote] ✅ Deposit simulation succeeded after initialization');
              } else {
                // Re-throw if it's not the expected error
                throw simError;
              }
            }

            // Execute the deposit if simulation succeeded
            if (depositSimulated && depositRequestToExecute) {
              depositTxHash = await walletClient.writeContract(depositRequestToExecute);
              await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
              incrementStep();
              toast.success(`Dépôt de ${formatEther(depositTotal)} TRUST effectué!`);
            }
          }
        } else {
          console.log('[useBatchVote] No redeem/deposit needed - all items were new triples');
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
          newTotemTxHashes,
          createTriplesTxHash,
          redeemTxHash,
          depositTxHash,
          totalRedeemed,
          totalDeposited,
          triplesCreated,
          newTotemsCreated,
        };
      } catch (err: unknown) {
        // Enhanced error logging to debug empty error objects
        console.error('[useBatchVote] Error:', err);
        console.error('[useBatchVote] Error details:', {
          type: typeof err,
          constructor: err?.constructor?.name,
          message: (err as Error)?.message,
          name: (err as Error)?.name,
          stack: (err as Error)?.stack?.slice(0, 500),
        });

        let errorMessage = 'Une erreur inattendue est survenue';
        let errorCode = 'UNKNOWN_ERROR';

        const errWithMessage = err as { message?: string; shortMessage?: string };
        const fullMessage = errWithMessage.message || errWithMessage.shortMessage || '';

        if (
          fullMessage.includes('User rejected') ||
          fullMessage.includes('user rejected')
        ) {
          errorMessage = 'Transaction rejetée par l\'utilisateur';
          errorCode = 'USER_REJECTED';
        } else if (fullMessage.includes('insufficient funds')) {
          errorMessage = 'Balance TRUST insuffisante';
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (fullMessage.includes('HasCounterStake')) {
          errorMessage =
            'Impossible de voter: position opposée existante. Essayez de retirer d\'abord.';
          errorCode = 'HAS_COUNTER_STAKE';
        } else if (fullMessage) {
          errorMessage = fullMessage;
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
      executeCreateNewTotems,
      executeCreateTriples,
      checkTripleExists,
      status,
      multiVaultAddress,
    ]
  );

  // Memoize isLoading to prevent new value on each render
  const isLoading = useMemo(
    () => ['validating', 'withdrawing', 'creating_atoms', 'depositing'].includes(status),
    [status]
  );

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    executeBatch,
    status,
    error,
    isLoading,
    reset,
    currentStep,
    totalSteps,
  }), [executeBatch, status, error, isLoading, reset, currentStep, totalSteps]);
}

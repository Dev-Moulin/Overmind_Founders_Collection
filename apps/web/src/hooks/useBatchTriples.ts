/**
 * useBatchTriples - Create multiple triples in a single transaction
 *
 * Hook pour créer plusieurs triples (claims) en une seule transaction.
 * Utilise la fonction `createTriples` du contrat MultiVault.
 *
 * @see Phase 8 in TODO_Implementation.md
 * @see Contract: createTriples(subjectIds[], predicateIds[], objectIds[], assets[])
 */

import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useApolloClient } from '@apollo/client';
import { type Hex, formatEther } from 'viem';
import {
  getMultiVaultAddressFromChainId,
  multiCallIntuitionConfigs,
  MultiVaultAbi,
} from '@0xintuition/protocol';
import { currentIntuitionChain } from '../config/wagmi';
import { GET_TRIPLE_BY_ATOMS } from '../lib/graphql/queries';

/**
 * Single triple item input
 */
export interface BatchTripleItem {
  /** Subject atom ID */
  subjectId: Hex;
  /** Predicate atom ID */
  predicateId: Hex;
  /** Object atom ID */
  objectId: Hex;
  /** Deposit amount in wei (optional, uses minDeposit if not provided) */
  depositAmount?: bigint;
}

/**
 * Triple validation result
 */
export interface TripleValidation {
  /** Item index */
  index: number;
  /** Whether the triple already exists */
  exists: boolean;
  /** Existing triple ID if found */
  existingTermId?: Hex;
  /** Validation error message */
  error?: string;
}

/**
 * Batch create result
 */
export interface BatchTripleResult {
  /** Transaction hash */
  transactionHash: Hex;
  /** Number of triples created */
  tripleCount: number;
  /** Total amount spent (base costs + deposits) */
  totalAmount: bigint;
}

/**
 * Cost estimation for batch
 */
export interface BatchTripleCost {
  /** Base cost per triple (protocol fee) */
  baseCostPerTriple: bigint;
  /** Minimum deposit per triple */
  minDepositPerTriple: bigint;
  /** Total base cost (baseCostPerTriple * count) */
  totalBaseCost: bigint;
  /** Total deposits */
  totalDeposits: bigint;
  /** Grand total (totalBaseCost + totalDeposits) */
  grandTotal: bigint;
  /** Formatted strings */
  formatted: {
    baseCostPerTriple: string;
    minDepositPerTriple: string;
    totalBaseCost: string;
    totalDeposits: string;
    grandTotal: string;
  };
}

/**
 * Hook result
 */
export interface UseBatchTriplesResult {
  /** Create multiple triples in one transaction */
  createBatch: (items: BatchTripleItem[]) => Promise<BatchTripleResult>;
  /** Validate items before creation (check for existing triples) */
  validateItems: (items: BatchTripleItem[]) => Promise<TripleValidation[]>;
  /** Estimate cost for batch */
  estimateCost: (items: BatchTripleItem[]) => Promise<BatchTripleCost>;
  /** Loading state */
  loading: boolean;
  /** Validation in progress */
  validating: boolean;
  /** Error state */
  error: Error | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook to create multiple triples in a single transaction
 *
 * @example
 * ```tsx
 * function BatchTripleCreator() {
 *   const { createBatch, validateItems, estimateCost, loading, error } = useBatchTriples();
 *
 *   const handleCreate = async () => {
 *     const items = [
 *       { subjectId: '0x...', predicateId: '0x...', objectId: '0x...' },
 *       { subjectId: '0x...', predicateId: '0x...', objectId: '0x...' },
 *     ];
 *
 *     // Validate first
 *     const validations = await validateItems(items);
 *     const hasErrors = validations.some(v => v.exists || v.error);
 *     if (hasErrors) {
 *       console.error('Some triples already exist');
 *       return;
 *     }
 *
 *     // Estimate cost
 *     const cost = await estimateCost(items);
 *     console.log('Total cost:', cost.formatted.grandTotal);
 *
 *     // Create
 *     const result = await createBatch(items);
 *     console.log('Created in tx:', result.transactionHash);
 *   };
 *
 *   return <button onClick={handleCreate} disabled={loading}>Create Batch</button>;
 * }
 * ```
 */
export function useBatchTriples(): UseBatchTriplesResult {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const apolloClient = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  /**
   * Check if a triple already exists
   */
  const checkTripleExists = useCallback(
    async (
      subjectId: Hex,
      predicateId: Hex,
      objectId: Hex
    ): Promise<{ exists: boolean; termId?: Hex }> => {
      try {
        const { data } = await apolloClient.query<{
          triples: Array<{ term_id: string }>;
        }>({
          query: GET_TRIPLE_BY_ATOMS,
          variables: { subjectId, predicateId, objectId },
          fetchPolicy: 'network-only',
        });

        if (data?.triples && data.triples.length > 0) {
          return { exists: true, termId: data.triples[0].term_id as Hex };
        }
        return { exists: false };
      } catch (err) {
        console.warn('[useBatchTriples] Error checking triple:', err);
        return { exists: false };
      }
    },
    [apolloClient]
  );

  /**
   * Validate items before batch creation
   */
  const validateItems = useCallback(
    async (items: BatchTripleItem[]): Promise<TripleValidation[]> => {
      setValidating(true);
      try {
        const validations: TripleValidation[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Check for missing IDs
          if (!item.subjectId || !item.predicateId || !item.objectId) {
            validations.push({
              index: i,
              exists: false,
              error: 'Missing atom ID(s)',
            });
            continue;
          }

          // Check if triple already exists
          const { exists, termId } = await checkTripleExists(
            item.subjectId,
            item.predicateId,
            item.objectId
          );

          validations.push({
            index: i,
            exists,
            existingTermId: termId,
            error: exists ? 'Triple already exists' : undefined,
          });
        }

        return validations;
      } finally {
        setValidating(false);
      }
    },
    [checkTripleExists]
  );

  /**
   * Estimate cost for batch creation
   */
  const estimateCost = useCallback(
    async (items: BatchTripleItem[]): Promise<BatchTripleCost> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const config = await multiCallIntuitionConfigs({
        publicClient,
        address: multiVaultAddress,
      });

      const baseCostPerTriple = BigInt(config.triple_cost);
      const minDepositPerTriple = BigInt(config.min_deposit);
      const count = BigInt(items.length);

      // Calculate total deposits (use provided or minDeposit)
      let totalDeposits = 0n;
      for (const item of items) {
        totalDeposits += item.depositAmount ?? minDepositPerTriple;
      }

      const totalBaseCost = baseCostPerTriple * count;
      const grandTotal = totalBaseCost + totalDeposits;

      return {
        baseCostPerTriple,
        minDepositPerTriple,
        totalBaseCost,
        totalDeposits,
        grandTotal,
        formatted: {
          baseCostPerTriple: formatEther(baseCostPerTriple),
          minDepositPerTriple: formatEther(minDepositPerTriple),
          totalBaseCost: formatEther(totalBaseCost),
          totalDeposits: formatEther(totalDeposits),
          grandTotal: formatEther(grandTotal),
        },
      };
    },
    [publicClient, multiVaultAddress]
  );

  /**
   * Create multiple triples in one transaction
   */
  const createBatch = useCallback(
    async (items: BatchTripleItem[]): Promise<BatchTripleResult> => {
      if (!publicClient || !walletClient) {
        throw new Error('Wallet not connected');
      }

      if (items.length === 0) {
        throw new Error('No items to create');
      }

      setLoading(true);
      setError(null);

      try {
        // Get protocol config
        const config = await multiCallIntuitionConfigs({
          publicClient,
          address: multiVaultAddress,
        });

        const baseCostPerTriple = BigInt(config.triple_cost);
        const minDeposit = BigInt(config.min_deposit);

        // Prepare arrays for batch call
        const subjectIds: Hex[] = [];
        const predicateIds: Hex[] = [];
        const objectIds: Hex[] = [];
        const assets: bigint[] = [];

        let totalAmount = 0n;

        for (const item of items) {
          subjectIds.push(item.subjectId);
          predicateIds.push(item.predicateId);
          objectIds.push(item.objectId);

          // V2 Contract: assets[i] = baseCost + deposit
          const deposit = item.depositAmount ?? minDeposit;
          const assetValue = baseCostPerTriple + deposit;
          assets.push(assetValue);
          totalAmount += assetValue;
        }

        // Check wallet balance
        const walletBalance = await publicClient.getBalance({
          address: walletClient.account.address,
        });

        if (walletBalance < totalAmount) {
          const deficit = totalAmount - walletBalance;
          throw new Error(
            `Balance insuffisante! Vous avez ${formatEther(walletBalance)} tTRUST ` +
              `mais il faut ${formatEther(totalAmount)} tTRUST. ` +
              `Il vous manque ${formatEther(deficit)} tTRUST.`
          );
        }

        console.log('[useBatchTriples] Creating batch:', {
          itemCount: items.length,
          totalAmount: formatEther(totalAmount),
        });

        // Simulate first to catch errors
        const { request } = await publicClient.simulateContract({
          account: walletClient.account,
          address: multiVaultAddress,
          abi: MultiVaultAbi,
          functionName: 'createTriples',
          args: [subjectIds, predicateIds, objectIds, assets],
          value: totalAmount,
        });

        // Execute the transaction
        const txHash = await walletClient.writeContract(request);

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        console.log('[useBatchTriples] Batch created successfully:', txHash);

        return {
          transactionHash: txHash,
          tripleCount: items.length,
          totalAmount,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Batch triple creation failed';
        console.error('[useBatchTriples] Error:', errorMessage);
        const error = new Error(errorMessage);
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [publicClient, walletClient, multiVaultAddress]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createBatch,
    validateItems,
    estimateCost,
    loading,
    validating,
    error,
    clearError,
  };
}

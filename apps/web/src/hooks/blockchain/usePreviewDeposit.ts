/**
 * usePreviewDeposit - Preview deposit before execution
 *
 * Hook pour prévisualiser un dépôt avant exécution.
 * Calcule les shares reçues et les frais pour un montant donné.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/13_Deposit_Redeem_BondingCurve.md
 */

import { useState, useCallback, useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { type Hex, parseEther, formatEther } from 'viem';
import { MultiVaultAbi, getMultiVaultAddressFromChainId } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import { useProtocolConfig } from '../config/useProtocolConfig';

/**
 * Preview result for a deposit
 */
export interface DepositPreview {
  /** Input amount in wei */
  amountWei: bigint;
  /** Input amount formatted (TRUST) */
  amountFormatted: string;
  /** Shares to receive */
  sharesReceived: bigint;
  /** Shares formatted */
  sharesFormatted: string;
  /** Entry fee amount in wei */
  entryFeeWei: bigint;
  /** Entry fee formatted */
  entryFeeFormatted: string;
  /** Protocol fee amount in wei */
  protocolFeeWei: bigint;
  /** Protocol fee formatted */
  protocolFeeFormatted: string;
  /** Total fees */
  totalFeesWei: bigint;
  /** Total fees formatted */
  totalFeesFormatted: string;
  /** Net amount after fees (what goes into vault) */
  netAmountWei: bigint;
  /** Net amount formatted */
  netAmountFormatted: string;
}

/**
 * Hook result
 */
export interface UsePreviewDepositResult {
  /** Preview the deposit for a given amount */
  preview: (termId: Hex, amount: string) => Promise<DepositPreview | null>;
  /** Current preview (for reactive updates) */
  currentPreview: DepositPreview | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Clear current preview */
  clearPreview: () => void;
}

/**
 * Hook to preview a deposit before execution
 *
 * @example
 * ```tsx
 * function DepositForm({ termId }) {
 *   const { preview, currentPreview, loading } = usePreviewDeposit();
 *   const [amount, setAmount] = useState('0.01');
 *
 *   useEffect(() => {
 *     if (amount && termId) {
 *       preview(termId, amount);
 *     }
 *   }, [amount, termId, preview]);
 *
 *   return (
 *     <div>
 *       <input value={amount} onChange={e => setAmount(e.target.value)} />
 *       {loading && <span>Calcul...</span>}
 *       {currentPreview && (
 *         <div>
 *           <p>Shares: {currentPreview.sharesFormatted}</p>
 *           <p>Frais: {currentPreview.totalFeesFormatted} TRUST</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePreviewDeposit(): UsePreviewDepositResult {
  const publicClient = usePublicClient();
  const { config } = useProtocolConfig();
  const [currentPreview, setCurrentPreview] = useState<DepositPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  /**
   * Preview a deposit
   */
  const preview = useCallback(
    async (termId: Hex, amount: string): Promise<DepositPreview | null> => {
      if (!publicClient || !config) {
        setError(new Error('Client or config not available'));
        return null;
      }

      // Validate amount
      let amountWei: bigint;
      try {
        amountWei = parseEther(amount);
        if (amountWei <= 0n) {
          setError(new Error('Amount must be positive'));
          return null;
        }
      } catch {
        setError(new Error('Invalid amount format'));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Call previewDeposit on MultiVault contract
        // Default curveId is 1 for linear bonding curve
        // Returns [shares, assetsAfterFees] tuple
        const result = await publicClient.readContract({
          address: multiVaultAddress,
          abi: MultiVaultAbi,
          functionName: 'previewDeposit',
          args: [termId, 1n, amountWei], // termId, curveId, amount
        }) as readonly [bigint, bigint];

        const sharesReceived = result[0];

        // Calculate fees based on protocol config
        const entryFeePercent = BigInt(config.entryFee);
        const protocolFeePercent = BigInt(config.protocolFee);
        const feeDenominator = BigInt(config.feeDenominator);

        // Entry fee is applied to the deposit amount
        const entryFeeWei = (amountWei * entryFeePercent) / feeDenominator;

        // Protocol fee is part of entry fee (taken from it)
        const protocolFeeWei = (entryFeeWei * protocolFeePercent) / feeDenominator;

        // Total fees = entry fee (protocol fee is included)
        const totalFeesWei = entryFeeWei;

        // Net amount = amount - entry fee
        const netAmountWei = amountWei - entryFeeWei;

        const previewResult: DepositPreview = {
          amountWei,
          amountFormatted: formatNumber(formatEther(amountWei)),
          sharesReceived,
          sharesFormatted: formatNumber(formatEther(sharesReceived)),
          entryFeeWei,
          entryFeeFormatted: formatNumber(formatEther(entryFeeWei)),
          protocolFeeWei,
          protocolFeeFormatted: formatNumber(formatEther(protocolFeeWei)),
          totalFeesWei,
          totalFeesFormatted: formatNumber(formatEther(totalFeesWei)),
          netAmountWei,
          netAmountFormatted: formatNumber(formatEther(netAmountWei)),
        };

        setCurrentPreview(previewResult);
        return previewResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Preview failed';
        console.error('[usePreviewDeposit] Error:', errorMessage);
        setError(new Error(errorMessage));
        setCurrentPreview(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicClient, config, multiVaultAddress]
  );

  /**
   * Clear current preview
   */
  const clearPreview = useCallback(() => {
    setCurrentPreview(null);
    setError(null);
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    preview,
    currentPreview,
    loading,
    error,
    clearPreview,
  }), [preview, currentPreview, loading, error, clearPreview]);
}

/**
 * Format a number string to remove trailing zeros
 */
function formatNumber(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  // Keep up to 6 decimal places, remove trailing zeros
  return parseFloat(num.toFixed(6)).toString();
}

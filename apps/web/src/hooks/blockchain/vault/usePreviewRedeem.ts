/**
 * usePreviewRedeem - Preview redemption before execution
 *
 * Hook pour prévisualiser un retrait avant exécution.
 * Calcule le montant TRUST récupéré pour un nombre de shares donné.
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/13_Deposit_Redeem_BondingCurve.md
 */

import { useState, useCallback, useMemo } from 'react';
import { usePublicClient } from 'wagmi';
import { type Hex, formatEther } from 'viem';
import { MultiVaultAbi, getMultiVaultAddressFromChainId } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../../config/wagmi';
import { useProtocolConfig } from '../../config/useProtocolConfig';
import { type CurveId, CURVE_LINEAR } from './useVote';

/**
 * Preview result for a redemption
 */
export interface RedeemPreview {
  /** Input shares amount */
  sharesAmount: bigint;
  /** Shares formatted */
  sharesFormatted: string;
  /** Gross amount (before fees) in wei */
  grossAmountWei: bigint;
  /** Gross amount formatted */
  grossAmountFormatted: string;
  /** Exit fee amount in wei */
  exitFeeWei: bigint;
  /** Exit fee formatted */
  exitFeeFormatted: string;
  /** Net amount received (after fees) in wei */
  netAmountWei: bigint;
  /** Net amount formatted (what user receives) */
  netAmountFormatted: string;
  /** Exit fee percentage for display */
  exitFeePercent: string;
}

/**
 * Hook result
 */
export interface UsePreviewRedeemResult {
  /** Preview the redemption for given shares */
  preview: (termId: Hex, shares: bigint, curveId?: CurveId) => Promise<RedeemPreview | null>;
  /** Preview by percentage of current position */
  previewByPercent: (termId: Hex, totalShares: bigint, percent: number, curveId?: CurveId) => Promise<RedeemPreview | null>;
  /** Current preview (for reactive updates) */
  currentPreview: RedeemPreview | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Clear current preview */
  clearPreview: () => void;
}

/**
 * Hook to preview a redemption before execution
 *
 * @example
 * ```tsx
 * function WithdrawForm({ termId, position }) {
 *   const { preview, previewByPercent, currentPreview, loading } = usePreviewRedeem();
 *
 *   // Preview full withdrawal (curveId from position)
 *   const handlePreviewFull = () => {
 *     preview(termId, position.shares, position.curveId);
 *   };
 *
 *   // Preview 50% withdrawal
 *   const handlePreview50 = () => {
 *     previewByPercent(termId, position.shares, 50, position.curveId);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handlePreviewFull}>Preview Full</button>
 *       <button onClick={handlePreview50}>Preview 50%</button>
 *       {loading && <span>Calcul...</span>}
 *       {currentPreview && (
 *         <div>
 *           <p>Vous recevrez: {currentPreview.netAmountFormatted} TRUST</p>
 *           <p>Frais de sortie: {currentPreview.exitFeeFormatted} TRUST ({currentPreview.exitFeePercent})</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePreviewRedeem(): UsePreviewRedeemResult {
  const publicClient = usePublicClient();
  const { config } = useProtocolConfig();
  const [currentPreview, setCurrentPreview] = useState<RedeemPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  /**
   * Preview a redemption for a given number of shares
   */
  const preview = useCallback(
    async (termId: Hex, shares: bigint, curveId: CurveId = CURVE_LINEAR): Promise<RedeemPreview | null> => {
      if (!publicClient || !config) {
        setError(new Error('Client or config not available'));
        return null;
      }

      if (shares <= 0n) {
        setError(new Error('Shares must be positive'));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Call previewRedeem on MultiVault contract
        // curveId: 1 = Linear, 2 = Progressive
        // Returns [assets, assetsAfterFees] tuple
        const redeemResult = await publicClient.readContract({
          address: multiVaultAddress,
          abi: MultiVaultAbi,
          functionName: 'previewRedeem',
          args: [termId, BigInt(curveId), shares],
        }) as readonly [bigint, bigint];

        const grossAmountWei = redeemResult[0];

        // Calculate exit fee based on protocol config
        const exitFeePercent = BigInt(config.exitFee);
        const feeDenominator = BigInt(config.feeDenominator);

        // Exit fee is applied to gross amount
        const exitFeeWei = (grossAmountWei * exitFeePercent) / feeDenominator;

        // Net amount = gross - exit fee
        const netAmountWei = grossAmountWei - exitFeeWei;

        // Format exit fee percentage for display
        const exitFeePercentDisplay = `${(Number(exitFeePercent) / Number(feeDenominator) * 100).toFixed(2)}%`;

        const previewResult: RedeemPreview = {
          sharesAmount: shares,
          sharesFormatted: formatNumber(formatEther(shares)),
          grossAmountWei,
          grossAmountFormatted: formatNumber(formatEther(grossAmountWei)),
          exitFeeWei,
          exitFeeFormatted: formatNumber(formatEther(exitFeeWei)),
          netAmountWei,
          netAmountFormatted: formatNumber(formatEther(netAmountWei)),
          exitFeePercent: exitFeePercentDisplay,
        };

        setCurrentPreview(previewResult);
        return previewResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Preview failed';
        console.error('[usePreviewRedeem] Error:', errorMessage);
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
   * Preview redemption by percentage of total shares
   *
   * @param termId - The term ID to redeem from
   * @param totalShares - Total shares owned
   * @param percent - Percentage to redeem (1-100)
   */
  const previewByPercent = useCallback(
    async (termId: Hex, totalShares: bigint, percent: number, curveId: CurveId = CURVE_LINEAR): Promise<RedeemPreview | null> => {
      if (percent <= 0 || percent > 100) {
        setError(new Error('Percent must be between 1 and 100'));
        return null;
      }

      // Calculate shares to redeem based on percentage
      const sharesToRedeem = (totalShares * BigInt(Math.round(percent))) / 100n;

      if (sharesToRedeem <= 0n) {
        setError(new Error('Calculated shares is zero'));
        return null;
      }

      return preview(termId, sharesToRedeem, curveId);
    },
    [preview]
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
    previewByPercent,
    currentPreview,
    loading,
    error,
    clearPreview,
  }), [preview, previewByPercent, currentPreview, loading, error, clearPreview]);
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

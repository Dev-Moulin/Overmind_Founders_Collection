/**
 * ProgressiveInitMessage - Warning message for Oppose Progressive (3 transactions)
 *
 * INTUITION Protocol Rule:
 * - Oppose Progressive requires the vault to be initialized first
 * - If not initialized: 3 transactions (init FOR → redeem FOR → deposit AGAINST)
 * - If already initialized: 1 transaction
 *
 * This component shows a warning message ONLY when the vault is NOT initialized.
 * Uses useVaultInitStatus hook to check directly from the MultiVault contract.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVaultInitStatus } from '../../../hooks';
import { CURVE_PROGRESSIVE } from '../../../hooks/blockchain/vault/useVote';

interface ProgressiveInitMessageProps {
  /** Whether this message should be visible (Oppose + Progressive selected) */
  isVisible: boolean;
  /** The triple's term_id (FOR vault) - needed to check if vault is initialized */
  termId: string | undefined;
  /** Trigger to refetch vault status (increment after successful transaction) */
  refetchTrigger?: number;
}

export function ProgressiveInitMessage({ isVisible, termId, refetchTrigger }: ProgressiveInitMessageProps) {
  const { t } = useTranslation();

  // Check if the Progressive FOR vault is initialized
  const { isInitialized, isLoading, refetch } = useVaultInitStatus({
    termId,
    curveId: CURVE_PROGRESSIVE,
    skip: !isVisible || !termId,
  });

  // Refetch vault status when trigger changes (after successful transaction)
  useEffect(() => {
    if (refetchTrigger && refetchTrigger > 0) {
      refetch();
    }
  }, [refetchTrigger, refetch]);

  // Should we show the message?
  // Only show if: visible AND termId exists AND vault is NOT initialized AND not loading
  const shouldShow = isVisible && termId && !isInitialized && !isLoading;

  if (!shouldShow) return null;

  return (
    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <p className="text-xs text-amber-300 text-center leading-relaxed">
        {t('founderExpanded.progressiveInitWarning')}
      </p>
    </div>
  );
}

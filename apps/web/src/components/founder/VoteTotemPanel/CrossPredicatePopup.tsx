/**
 * CrossPredicatePopup - Modal for cross-predicate rule warning
 *
 * Shows when user tries to vote with a different predicate than their existing votes.
 * INTUITION rule: Can only use one predicate per totem (either "has totem" OR "embodies").
 * Offers option to redeem existing positions to unlock the new predicate.
 */

import { useTranslation } from 'react-i18next';
import { truncateAmount } from '../../../utils/formatters';
import { SUPPORT_COLORS, OPPOSE_COLORS, CURVE_COLORS } from '../../../config/colors';

/** Vote info for display in the popup */
export interface CrossPredicateVote {
  isPositive: boolean;
  curveId: number;
  formattedAmount: string;
}

/** Info about positions to redeem */
export interface CrossPredicateRedeemInfo {
  votes: CrossPredicateVote[];
  otherPredicateLabel: string;
  totalToRedeem: string;
}

interface CrossPredicatePopupProps {
  /** Info about positions to redeem */
  redeemInfo: CrossPredicateRedeemInfo;
  /** Whether redeem operation is in progress */
  loading: boolean;
  /** Callback to close the popup */
  onClose: () => void;
  /** Callback to redeem all positions */
  onRedeemAll: () => void;
}

export function CrossPredicatePopup({
  redeemInfo,
  loading,
  onClose,
  onRedeemAll,
}: CrossPredicatePopupProps) {
  const { t } = useTranslation();

  if (redeemInfo.votes.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
          <span>⚠️</span>
          {t('founderExpanded.crossPredicateTitle')}
        </h3>

        <p className="text-white/80 text-sm mb-4">
          {t('founderExpanded.crossPredicateDesc')} "{redeemInfo.otherPredicateLabel}".
          {t('founderExpanded.crossPredicateDesc2')}
        </p>

        <div className="bg-white/5 rounded-lg p-3 mb-4 space-y-1">
          {redeemInfo.votes.map((vote, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span style={{ color: vote.isPositive ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
                {vote.isPositive ? t('vote.support') : t('vote.oppose')}{' '}
                <span style={{ color: vote.curveId === 1 ? CURVE_COLORS.linear.text : CURVE_COLORS.progressive.text }}>
                  {vote.curveId === 1 ? t('curve.linear') : t('curve.progressive')}
                </span>
              </span>
              <span className="text-white">{truncateAmount(vote.formattedAmount)} {t('common.trustUnit')}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onRedeemAll}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('founderExpanded.crossPredicateRedeem', { amount: redeemInfo.totalToRedeem })}
          </button>
        </div>
      </div>
    </div>
  );
}

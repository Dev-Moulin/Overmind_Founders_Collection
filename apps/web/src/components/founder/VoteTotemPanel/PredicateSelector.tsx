/**
 * PredicateSelector - Select predicate (has totem / embodies)
 *
 * Features:
 * - Cross-predicate rule: blur alternative predicate if votes exist with other predicate
 * - Visual states: current selection (animate-ring-pulse), existing votes (ring-slate), blocked (blur-xs)
 * - Pulsation on current step to guide user
 */

import { useTranslation } from 'react-i18next';
import type { Predicate } from '../../../types/predicate';

interface PredicateSelectorProps {
  /** Available predicates */
  predicates: Predicate[];
  /** Currently selected predicate ID */
  selectedPredicateId: string;
  /** Callback when predicate is selected */
  onPredicateSelect: (predicateId: string) => void;
  /** Callback when blocked predicate is clicked (show popup) */
  onBlockedPredicateClick: (predicateId: string) => void;
  /** Check if a predicate is blocked */
  isPredicateBlocked: (predicateLabel: string) => boolean;
  /** Votes grouped by predicate for this totem */
  votesOnTotemByPredicate: Record<string, unknown[]>;
  /** CSS class for blur effect */
  blurClass: string;
  /** Get pulse class for step guidance */
  getPulseClass: (step: number, isSelected: boolean) => string;
  /** Whether Redeem button is highlighted (to dim this component) */
  isRedeemHighlighted?: boolean;
}

export function PredicateSelector({
  predicates,
  selectedPredicateId,
  onPredicateSelect,
  onBlockedPredicateClick,
  isPredicateBlocked,
  votesOnTotemByPredicate,
  blurClass,
  getPulseClass,
  isRedeemHighlighted,
}: PredicateSelectorProps) {
  const { t } = useTranslation();

  // Dim style when Redeem is highlighted (using inline style to ensure it works)
  const dimStyle = isRedeemHighlighted ? { opacity: 0.4, transition: 'opacity 200ms' } : { transition: 'opacity 200ms' };

  return (
    <div className={`${blurClass} blur-transition`} style={dimStyle}>
      <label className="block text-xs text-white/60 mb-1">{t('founderExpanded.relationType')}</label>
      <div className="grid grid-cols-2 gap-2">
        {predicates.slice(0, 2).map((predicate) => {
          // Check if this predicate is blocked (user has votes with OTHER predicate on this totem)
          const isBlocked = isPredicateBlocked(predicate.label);
          // Check if user has existing votes with THIS predicate (for "existing position" style)
          const hasVotesWithThis = (votesOnTotemByPredicate[predicate.label]?.length ?? 0) > 0;

          return (
            <button
              key={predicate.id}
              onClick={() => {
                if (isBlocked) {
                  // Show popup to explain and offer redeem
                  onBlockedPredicateClick(predicate.id);
                } else {
                  onPredicateSelect(predicate.id);
                }
              }}
              className={`p-2 rounded-lg text-sm transition-colors ${
                selectedPredicateId === predicate.id
                  ? 'bg-slate-500/30 text-slate-200 animate-ring-pulse'
                  : isBlocked
                    ? 'bg-white/5 text-white/40 ring-1 ring-slate-500/20 blur-xs cursor-pointer'
                    : hasVotesWithThis
                      ? 'bg-slate-500/10 text-slate-300/80 ring-1 ring-slate-400/50'
                      : 'bg-white/5 text-white/70 ring-1 ring-slate-500/30 hover:bg-white/10'
              } ${getPulseClass(0, !!selectedPredicateId)}`}
            >
              {predicate.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

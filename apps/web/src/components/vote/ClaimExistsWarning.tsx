import { formatVoteAmount } from '../../hooks';
import type { ExistingClaimInfo } from '../modal/ClaimExistsModal';

/**
 * ClaimExistsWarning - Affiche une alerte quand un claim existe déjà
 * Extrait de VotePanel.tsx lignes 1035-1070
 */

interface ClaimExistsWarningProps {
  claimInfo: ExistingClaimInfo | null;
  isLoading: boolean;
  onVoteClick: () => void;
}

export function ClaimExistsWarning({ claimInfo, isLoading, onVoteClick }: ClaimExistsWarningProps) {
  // Loading indicator for claim check
  if (isLoading) {
    return (
      <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          Vérification si ce claim existe...
        </div>
      </div>
    );
  }

  // Warning when claim exists
  if (!claimInfo) {
    return null;
  }

  return (
    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-amber-400 text-xl">!</span>
        <div className="flex-1">
          <p className="text-amber-400 font-medium mb-1">Ce claim existe déjà</p>
          <p className="text-sm text-white/70 mb-2">
            "{claimInfo.subjectLabel} {claimInfo.predicateLabel} {claimInfo.objectLabel}"
          </p>
          <p className="text-xs text-white/50 mb-3">
            Votes actuels: {formatVoteAmount(claimInfo.forVotes || '0')} TRUST
          </p>
          <button
            onClick={onVoteClick}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Voter sur ce claim
          </button>
        </div>
      </div>
    </div>
  );
}

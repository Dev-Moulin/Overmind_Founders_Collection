import { formatVoteAmount } from '../../hooks';
import { getTimeAgo } from '../../utils';
import type { RecentVote } from '../../hooks';
import { SUPPORT_COLORS, OPPOSE_COLORS } from '../../config/colors';

/**
 * RecentActivity - Affiche l'historique des votes récents
 *
 * Utilise recentVotes de useVotesTimeline qui fournit isFor via le pattern V2:
 * - Deposit sur term_id = FOR vote
 * - Deposit sur counter_term_id = AGAINST vote
 *
 * @see useVotesTimeline in hooks/data/useVotesTimeline.ts
 */

interface RecentActivityProps {
  votes: RecentVote[];
}

export function RecentActivity({ votes }: RecentActivityProps) {
  if (!votes || votes.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
      <h4 className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Activité récente
      </h4>
      <div className="space-y-2">
        {votes.slice(0, 5).map((vote) => {
          // isFor is now provided directly by useRecentVotesForFounder hook
          const amount = formatVoteAmount(vote.assets_after_fees);
          const timeAgo = getTimeAgo(vote.created_at);
          const voterShort = `${vote.sender_id.slice(0, 6)}...${vote.sender_id.slice(-4)}`;

          return (
            <div key={vote.id} className="flex items-center gap-2 text-xs">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: vote.isFor ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}
              />
              <span className="text-white/40 font-mono">{voterShort}</span>
              <span style={{ color: vote.isFor ? SUPPORT_COLORS.base : OPPOSE_COLORS.base }}>
                {vote.isFor ? '+' : '-'}{amount}
              </span>
              <span className="text-white/60 truncate flex-1">
                sur {vote.totemLabel}
              </span>
              <span className="text-white/30">{timeAgo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

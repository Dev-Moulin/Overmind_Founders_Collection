import { formatVoteAmount } from '../../hooks';
import { getTimeAgo } from '../../utils';

/**
 * RecentActivity - Affiche l'historique des votes récents
 * Extrait de VotePanel.tsx lignes 587-616
 */

export interface RecentVote {
  id: string;
  sender_id: string;
  vault_type: 'triple_positive' | 'triple_negative';
  assets_after_fees: string;
  created_at: string;
  term: {
    term_id: string;
    object: { label: string };
  };
}

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
          const isFor = vote.vault_type === 'triple_positive';
          const amount = formatVoteAmount(vote.assets_after_fees);
          const timeAgo = getTimeAgo(vote.created_at);
          const voterShort = `${vote.sender_id.slice(0, 6)}...${vote.sender_id.slice(-4)}`;

          return (
            <div key={vote.id} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isFor ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white/40 font-mono">{voterShort}</span>
              <span className={isFor ? 'text-green-400' : 'text-red-400'}>
                {isFor ? '+' : '-'}{amount}
              </span>
              <span className="text-white/60 truncate flex-1">
                sur {vote.term.object.label}
              </span>
              <span className="text-white/30">{timeAgo}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

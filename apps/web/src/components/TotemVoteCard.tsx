import { useState } from 'react';
import type { AggregatedTotem } from '../hooks/useAllTotems';
import { formatVoteAmount } from '../hooks/useFounderProposals';

interface TotemVoteCardProps {
  totem: AggregatedTotem;
  rank: number;
  onVote: (totemId: string, direction: 'for' | 'against') => void;
}

export function TotemVoteCard({ totem, rank, onVote }: TotemVoteCardProps) {
  const [showClaims, setShowClaims] = useState(false);

  const totalVotes = totem.totalFor + totem.totalAgainst;
  const forPercentage = totalVotes > 0n ? Number((totem.totalFor * 100n) / totalVotes) : 0;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-2xl font-bold text-white/50">#{rank}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {totem.totemImage && (
              <img
                src={totem.totemImage}
                alt={totem.totemLabel}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="text-xl font-bold text-white">{totem.totemLabel}</h3>
              <p className="text-sm text-white/60">for {totem.founder.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vote Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-white/50 mb-1">FOR</div>
          <div className="text-lg font-bold text-green-400">
            {formatVoteAmount(totem.totalFor.toString())} TRUST
          </div>
        </div>
        <div>
          <div className="text-xs text-white/50 mb-1">AGAINST</div>
          <div className="text-lg font-bold text-red-400">
            {formatVoteAmount(totem.totalAgainst.toString())} TRUST
          </div>
        </div>
        <div>
          <div className="text-xs text-white/50 mb-1">NET</div>
          <div className="text-lg font-bold text-white">
            {formatVoteAmount(totem.netScore.toString())} TRUST
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
            style={{ width: `${forPercentage}%` }}
          />
        </div>
      </div>

      {/* Claims Info */}
      <div className="mb-4 text-sm text-white/70">
        <p>
          {totem.claimCount} claim{totem.claimCount > 1 ? 's' : ''} with{' '}
          {new Set(totem.claims.map((c) => c.predicate)).size} different predicate
          {new Set(totem.claims.map((c) => c.predicate)).size > 1 ? 's' : ''}
        </p>
        <p>Top predicate: "{totem.topPredicate}"</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onVote(totem.totemId, 'for')}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          Vote FOR
        </button>
        <button
          onClick={() => onVote(totem.totemId, 'against')}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
        >
          Vote AGAINST
        </button>
        <button
          onClick={() => setShowClaims(!showClaims)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
        >
          {showClaims ? 'Hide' : 'View'} Claims
        </button>
      </div>

      {/* Claims List (expandable) */}
      {showClaims && (
        <div className="border-t border-white/10 pt-4 space-y-2">
          <h4 className="text-sm font-semibold text-white/80 mb-2">All Claims:</h4>
          {totem.claims.map((claim) => (
            <div
              key={claim.tripleId}
              className="bg-white/5 rounded p-3 text-sm border border-white/10"
            >
              <p className="text-white mb-1">"{claim.predicate}"</p>
              <div className="flex gap-4 text-xs text-white/60">
                <span className="text-green-400">
                  {formatVoteAmount(claim.forVotes.toString())} FOR
                </span>
                <span className="text-red-400">
                  {formatVoteAmount(claim.againstVotes.toString())} AGAINST
                </span>
                <span className="text-white/80">
                  {formatVoteAmount(claim.netScore.toString())} NET
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

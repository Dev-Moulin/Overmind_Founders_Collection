import { formatTrustAmount } from '../utils';
import type { Claim } from '../utils';

interface ClaimCardProps {
  claim: Claim;
  rank: number;
}

export function ClaimCard({ claim, rank }: ClaimCardProps) {
  const winRate =
    claim.trustFor > 0n
      ? Number((claim.trustFor * 100n) / (claim.trustFor + claim.trustAgainst))
      : 0;

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header with Rank and Predicate */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div className="bg-white/10 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
            #{rank}
          </div>

          {/* Predicate */}
          <div>
            <div className="text-xs text-white/60 mb-1">Prédicat</div>
            <div className="font-semibold text-purple-400 text-lg">
              {claim.predicate}
            </div>
          </div>
        </div>

        {/* NET Score */}
        <div className="text-right">
          <div className="text-xs text-white/60 mb-1">NET Score</div>
          <div
            className={`font-bold text-xl ${
              claim.netScore > 0n
                ? 'text-green-400'
                : claim.netScore < 0n
                  ? 'text-red-400'
                  : 'text-white/60'
            }`}
          >
            {claim.netScore >= 0n ? '+' : ''}
            {formatTrustAmount(claim.netScore, 2)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <div className="text-xs text-white/60 text-center mt-1">
          {winRate.toFixed(1)}% FOR
        </div>
      </div>

      {/* Votes Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* FOR Votes */}
        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">👍</div>
          <div className="text-green-400 font-bold text-lg">
            {formatTrustAmount(claim.trustFor, 2)}
          </div>
          <div className="text-white/40 text-xs">TRUST FOR</div>
        </div>

        {/* AGAINST Votes */}
        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">👎</div>
          <div className="text-red-400 font-bold text-lg">
            {formatTrustAmount(claim.trustAgainst, 2)}
          </div>
          <div className="text-white/40 text-xs">TRUST AGAINST</div>
        </div>
      </div>

      {/* Triple ID */}
      <div className="pt-3 border-t border-white/10">
        <div className="text-xs text-white/60 mb-1">Triple ID</div>
        <div className="flex items-center gap-2">
          <code className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded font-mono truncate flex-1">
            {claim.tripleId}
          </code>
          <a
            href={`https://portal.intuition.systems/app/triple/${claim.tripleId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-xs whitespace-nowrap transition-colors"
          >
            Voir sur INTUITION ↗
          </a>
        </div>
      </div>
    </div>
  );
}

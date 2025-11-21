import { Link } from 'react-router-dom';
import { formatTrustAmount } from '../utils';
import type { AggregatedTotem } from '../utils';

interface TotemProposalCardProps {
  founderId: string;
  totem: AggregatedTotem;
  rank: number;
  isWinner?: boolean;
}

export function TotemProposalCard({
  founderId,
  totem,
  rank,
  isWinner = false,
}: TotemProposalCardProps) {
  const winRate =
    totem.totalFor > 0n
      ? Number((totem.totalFor * 100n) / (totem.totalFor + totem.totalAgainst))
      : 0;

  return (
    <Link
      to={`/results/${founderId}/${totem.objectId}`}
      className="glass-card p-6 hover:scale-[1.02] transition-transform relative"
    >
      {/* Winner Badge */}
      {isWinner && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          🏆 Gagnant
        </div>
      )}

      {/* Rank Badge */}
      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
        #{rank}
      </div>

      <div className="space-y-4">
        {/* Totem Image */}
        <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20 overflow-hidden relative">
          {totem.object.image ? (
            <img
              src={totem.object.image}
              alt={totem.object.label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">{totem.object.label.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Totem Info */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {totem.object.label}
          </h3>
          {totem.object.description && (
            <p className="text-sm text-white/60 line-clamp-2">
              {totem.object.description}
            </p>
          )}
        </div>

        {/* NET Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">NET Score</span>
            <span
              className={`font-bold text-lg ${
                totem.netScore > 0n
                  ? 'text-green-400'
                  : totem.netScore < 0n
                    ? 'text-red-400'
                    : 'text-white/60'
              }`}
            >
              {totem.netScore >= 0n ? '+' : ''}
              {formatTrustAmount(totem.netScore, 2)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              style={{ width: `${winRate}%` }}
            />
          </div>

          {/* FOR/AGAINST */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="glass-card p-2">
              <div className="text-green-400 font-semibold">
                👍 {formatTrustAmount(totem.totalFor, 2)}
              </div>
              <div className="text-white/40">FOR</div>
            </div>
            <div className="glass-card p-2">
              <div className="text-red-400 font-semibold">
                👎 {formatTrustAmount(totem.totalAgainst, 2)}
              </div>
              <div className="text-white/40">AGAINST</div>
            </div>
          </div>
        </div>

        {/* Predicates Used */}
        <div className="pt-2 border-t border-white/10">
          <div className="text-xs text-white/60 mb-2">
            {totem.claimCount} proposition{totem.claimCount > 1 ? 's' : ''}
          </div>
          <div className="flex flex-wrap gap-1">
            {totem.claims
              .map((claim) => claim.predicate)
              .filter((value, index, self) => self.indexOf(value) === index) // Unique predicates
              .map((predicate, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                >
                  {predicate}
                </span>
              ))}
          </div>
        </div>

        {/* Hover Indicator */}
        <div className="text-center text-sm text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Cliquez pour voir les détails →
        </div>
      </div>
    </Link>
  );
}

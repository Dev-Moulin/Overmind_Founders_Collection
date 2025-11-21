import { Link } from 'react-router-dom';
import { formatTrustAmount } from '../utils';

interface FounderResultCardProps {
  founder: {
    id: string;
    name: string;
    image?: string;
  };
  winningTotem?: {
    objectId: string;
    object: {
      id: string;
      label: string;
      image?: string;
      description?: string;
    };
    netScore: bigint;
    totalFor: bigint;
    totalAgainst: bigint;
    claimCount: number;
  };
  totalProposals: number;
  totalVoters: number;
}

export function FounderResultCard({
  founder,
  winningTotem,
  totalProposals,
  totalVoters,
}: FounderResultCardProps) {
  return (
    <Link
      to={`/results/${founder.id}`}
      className="glass-card p-6 hover:scale-[1.02] transition-transform duration-200"
    >
      {/* Founder Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center overflow-hidden">
          {founder.image ? (
            <img
              src={founder.image}
              alt={founder.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-purple-400">
              {founder.name.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-bold text-white">{founder.name}</h3>
          <p className="text-sm text-white/60">
            {totalProposals} proposition{totalProposals > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Winning Totem */}
      {winningTotem ? (
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
              🏆 Gagnant
            </div>
            <div className="aspect-square rounded-lg bg-purple-900/20 overflow-hidden border border-purple-500/20">
              {winningTotem.object.image ? (
                <img
                  src={winningTotem.object.image}
                  alt={winningTotem.object.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {winningTotem.object.label.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-lg">
              {winningTotem.object.label}
            </h4>
            {winningTotem.claimCount > 1 && (
              <p className="text-xs text-purple-400">
                {winningTotem.claimCount} claims agrégés
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-white/60">NET Score</div>
              <div className="font-bold text-green-400">
                {formatTrustAmount(winningTotem.netScore)} TRUST
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/60">Votants</div>
              <div className="font-bold text-white">{totalVoters}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>FOR: {formatTrustAmount(winningTotem.totalFor)}</span>
              <span>
                AGAINST: {formatTrustAmount(winningTotem.totalAgainst)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/40">
          <p>Aucune proposition encore</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-sm text-purple-400 font-medium text-center">
          Voir les détails →
        </div>
      </div>
    </Link>
  );
}

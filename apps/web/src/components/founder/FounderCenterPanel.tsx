/**
 * FounderCenterPanel - Center panel showing totems grid and user positions
 *
 * Displays:
 * - Grid of existing totems with scores
 * - User's positions on this founder (if connected)
 * - Click on totem to select for voting
 *
 * @see Phase 9 in TODO_Implementation.md
 */

import { useState, useMemo } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import type { FounderForHomePage } from '../../hooks/useFoundersForHomePage';
import { useFounderProposals } from '../../hooks/useFounderProposals';
import type { ProposalWithVotes } from '../../lib/graphql/types';

interface FounderCenterPanelProps {
  founder: FounderForHomePage;
  onSelectTotem?: (totemId: string, totemLabel: string) => void;
  selectedTotemId?: string;
}

/**
 * Format score for display
 */
function formatScore(score: bigint | string): string {
  const value = typeof score === 'string' ? BigInt(score) : score;
  const ethValue = parseFloat(formatEther(value));
  if (ethValue >= 1000) {
    return `${(ethValue / 1000).toFixed(1)}k`;
  }
  if (ethValue >= 1) {
    return ethValue.toFixed(2);
  }
  if (ethValue >= 0.001) {
    return ethValue.toFixed(4);
  }
  return '< 0.001';
}

/**
 * Get color class based on net score
 */
function getScoreColor(proposal: ProposalWithVotes): string {
  const net = BigInt(proposal.votes.netVotes);
  if (net > 0n) return 'text-green-400';
  if (net < 0n) return 'text-red-400';
  return 'text-white/60';
}

export function FounderCenterPanel({
  founder,
  onSelectTotem,
  selectedTotemId,
}: FounderCenterPanelProps) {
  const { isConnected, address } = useAccount();
  const { proposals, loading } = useFounderProposals(founder.name);
  const [viewMode, setViewMode] = useState<'totems' | 'positions'>('totems');

  // Sort proposals by net score
  const sortedProposals = useMemo(() => {
    if (!proposals) return [];
    return [...proposals].sort((a, b) => {
      const aNet = BigInt(a.votes.netVotes);
      const bNet = BigInt(b.votes.netVotes);
      return bNet > aNet ? 1 : bNet < aNet ? -1 : 0;
    });
  }, [proposals]);

  // Filter user's positions (proposals where user has voted)
  // For now, we show all proposals - position filtering would require user deposit data
  const userPositions = useMemo(() => {
    // TODO: Filter by user's actual positions when we have that data
    return sortedProposals.slice(0, 5); // Placeholder: show top 5
  }, [sortedProposals]);

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          {viewMode === 'totems' ? 'Totems associés' : 'Mes positions'}
        </h3>
        <div className="flex bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('totems')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              viewMode === 'totems'
                ? 'bg-purple-500/30 text-purple-300'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Totems
          </button>
          {isConnected && (
            <button
              onClick={() => setViewMode('positions')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'positions'
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Positions
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : viewMode === 'totems' ? (
          // Totems grid
          sortedProposals.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {sortedProposals.map((proposal) => {
                const isSelected = proposal.object_id === selectedTotemId;
                const netScore = BigInt(proposal.votes.netVotes);
                const scoreColor = getScoreColor(proposal);

                return (
                  <button
                    key={proposal.term_id}
                    onClick={() => onSelectTotem?.(proposal.object_id, proposal.object.label)}
                    className={`text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-purple-500/30 ring-2 ring-purple-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate flex-1">
                        {proposal.object.label}
                      </span>
                      {isSelected && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-purple-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${scoreColor}`}>
                        {netScore >= 0n ? '+' : ''}{formatScore(netScore.toString())}
                      </span>
                      <span className="text-xs text-white/40">
                        ({formatScore(proposal.votes.forVotes)} FOR / {formatScore(proposal.votes.againstVotes)} AGAINST)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-white/50 text-sm">Aucun totem pour ce fondateur</p>
              <p className="text-white/30 text-xs mt-1">Soyez le premier à proposer un totem !</p>
            </div>
          )
        ) : (
          // User positions
          isConnected ? (
            userPositions.length > 0 ? (
              <div className="space-y-3">
                {userPositions.map((proposal) => {
                  const netScore = BigInt(proposal.votes.netVotes);
                  const scoreColor = getScoreColor(proposal);

                  return (
                    <div
                      key={proposal.term_id}
                      className="bg-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {proposal.object.label}
                        </span>
                        <span className={`text-xs font-medium ${scoreColor}`}>
                          {netScore >= 0n ? '+' : ''}{formatScore(netScore.toString())}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400/50" />
                          FOR: {formatScore(proposal.votes.forVotes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400/50" />
                          AGAINST: {formatScore(proposal.votes.againstVotes)}
                        </span>
                      </div>
                      {/* Position actions would go here */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onSelectTotem?.(proposal.object_id, proposal.object.label)}
                          className="flex-1 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                        >
                          + Ajouter
                        </button>
                        <button
                          className="flex-1 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                        >
                          - Retirer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-white/50 text-sm">Vous n'avez pas encore de positions</p>
                <p className="text-white/30 text-xs mt-1">Votez sur un totem pour commencer</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-white/50 text-sm">Connectez votre wallet</p>
              <p className="text-white/30 text-xs mt-1">pour voir vos positions</p>
            </div>
          )
        )}
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
        <span>{sortedProposals.length} totems</span>
        {isConnected && address && (
          <span className="truncate ml-2">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}

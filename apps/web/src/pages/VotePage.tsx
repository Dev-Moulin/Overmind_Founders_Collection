import { useState, useMemo } from 'react';
import { useAllTotems, type AggregatedTotem } from '../hooks/useAllTotems';
import { TotemVoteCard } from '../components/TotemVoteCard';
import { VoteModal } from '../components/VoteModal';

type SortOption = 'netScore' | 'totalFor' | 'totalAgainst' | 'claimCount';

export function VotePage() {
  const { totems, loading, error } = useAllTotems();

  // Filters
  const [selectedFounder, setSelectedFounder] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('netScore');
  const [searchQuery, setSearchQuery] = useState('');

  // Vote Modal
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedTotem, setSelectedTotem] = useState<AggregatedTotem | null>(null);
  const [voteDirection, setVoteDirection] = useState<'for' | 'against'>('for');

  // Get unique founders for filter
  const founders = useMemo(() => {
    const founderSet = new Set(totems.map((t) => t.founder.name));
    return Array.from(founderSet).sort();
  }, [totems]);

  // Filter and sort totems
  const filteredTotems = useMemo(() => {
    let filtered = totems;

    // Filter by founder
    if (selectedFounder !== 'all') {
      filtered = filtered.filter((t) => t.founder.name === selectedFounder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.totemLabel.toLowerCase().includes(query) ||
          t.founder.name.toLowerCase().includes(query) ||
          t.claims.some((c) => c.predicate.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === 'bigint' && typeof bVal === 'bigint') {
        if (aVal > bVal) return -1;
        if (aVal < bVal) return 1;
        return 0;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [totems, selectedFounder, sortBy, searchQuery]);

  const handleVote = (totemId: string, direction: 'for' | 'against') => {
    const totem = totems.find((t) => t.totemId === totemId);
    if (totem) {
      setSelectedTotem(totem);
      setVoteDirection(direction);
      setVoteModalOpen(true);
    }
  };

  const handleVoteSubmit = async (claimId: string, amount: string) => {
    // TODO: Implement vote submission
    console.log('Vote submitted:', { claimId, amount, direction: voteDirection });
    setVoteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/70">Loading totems...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">Error loading totems: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Vote for Totems</h1>
        <p className="text-white/70">
          Support your favorite totem proposals by voting FOR or AGAINST
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{totems.length}</div>
          <div className="text-sm text-white/60">Total Totems</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">{founders.length}</div>
          <div className="text-sm text-white/60">Founders</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <div className="text-2xl font-bold text-white">
            {totems.reduce((sum, t) => sum + t.claimCount, 0)}
          </div>
          <div className="text-sm text-white/60">Total Claims</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Founder Filter */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Filter by Founder
            </label>
            <select
              value={selectedFounder}
              onChange={(e) => setSelectedFounder(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Founders</option>
              {founders.map((founder) => (
                <option key={founder} value={founder}>
                  {founder}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="netScore">Net Score (Highest)</option>
              <option value="totalFor">Most FOR Votes</option>
              <option value="totalAgainst">Most AGAINST Votes</option>
              <option value="claimCount">Most Claims</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search totems, founders, predicates..."
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-white/60">
          Showing {filteredTotems.length} of {totems.length} totems
        </div>
      </div>

      {/* Totems List */}
      {filteredTotems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/70">No totems found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTotems.map((totem, index) => (
            <TotemVoteCard
              key={totem.totemId}
              totem={totem}
              rank={index + 1}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {/* Vote Modal */}
      {selectedTotem && (
        <VoteModal
          isOpen={voteModalOpen}
          onClose={() => setVoteModalOpen(false)}
          totem={selectedTotem}
          direction={voteDirection}
          onSubmit={handleVoteSubmit}
        />
      )}
    </div>
  );
}

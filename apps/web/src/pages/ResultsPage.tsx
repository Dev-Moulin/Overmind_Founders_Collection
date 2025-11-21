import { useState } from 'react';
import { FounderResultCard } from '../components/FounderResultCard';

// Mock data - TODO: Replace with GraphQL queries
const MOCK_FOUNDERS = [
  {
    id: '1',
    name: 'Joseph Lubin',
    image: undefined,
    winningTotem: {
      objectId: 'lion',
      object: {
        id: 'lion',
        label: 'Lion',
        image: undefined,
        description: 'King of the jungle',
      },
      netScore: 93000000000000000000n,
      totalFor: 100000000000000000000n,
      totalAgainst: 7000000000000000000n,
      claimCount: 3,
    },
    totalProposals: 5,
    totalVoters: 12,
  },
  {
    id: '2',
    name: 'Andrew Keys',
    image: undefined,
    winningTotem: {
      objectId: 'eagle',
      object: {
        id: 'eagle',
        label: 'Eagle',
        image: undefined,
      },
      netScore: 75000000000000000000n,
      totalFor: 80000000000000000000n,
      totalAgainst: 5000000000000000000n,
      claimCount: 2,
    },
    totalProposals: 4,
    totalVoters: 10,
  },
  {
    id: '3',
    name: 'Vitalik Buterin',
    image: undefined,
    winningTotem: undefined,
    totalProposals: 0,
    totalVoters: 0,
  },
];

type SortOption = 'name' | 'votes' | 'proposals';

export function ResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Filter founders based on search
  const filteredFounders = MOCK_FOUNDERS.filter((founder) => {
    const query = searchQuery.toLowerCase();
    return (
      founder.name.toLowerCase().includes(query) ||
      founder.winningTotem?.object.label.toLowerCase().includes(query)
    );
  });

  // Sort founders
  const sortedFounders = [...filteredFounders].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'votes':
        return b.totalVoters - a.totalVoters;
      case 'proposals':
        return b.totalProposals - a.totalProposals;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Résultats INTUITION
          <span className="block text-purple-400">Founders Totem</span>
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Découvrez les totems gagnants pour chaque fondateur de la collection
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">42</div>
          <div className="text-white/60 text-sm">Fondateurs</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {MOCK_FOUNDERS.reduce((sum, f) => sum + f.totalProposals, 0)}
          </div>
          <div className="text-white/60 text-sm">Propositions</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {MOCK_FOUNDERS.filter((f) => f.winningTotem).length}
          </div>
          <div className="text-white/60 text-sm">Totems gagnants</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">
            {MOCK_FOUNDERS.reduce((sum, f) => sum + f.totalVoters, 0)}
          </div>
          <div className="text-white/60 text-sm">Votants</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher un fondateur ou un totem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm whitespace-nowrap">
              Trier par:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="name">Nom</option>
              <option value="votes">Votes</option>
              <option value="proposals">Propositions</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-white/60">
          {sortedFounders.length} résultat{sortedFounders.length > 1 ? 's' : ''}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 text-purple-400 hover:text-purple-300"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {sortedFounders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFounders.map((founder) => (
            <FounderResultCard
              key={founder.id}
              founder={founder}
              winningTotem={founder.winningTotem}
              totalProposals={founder.totalProposals}
              totalVoters={founder.totalVoters}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Aucun résultat trouvé
          </h3>
          <p className="text-white/60 mb-4">
            Aucun fondateur ne correspond à votre recherche
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="glass-button"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Status Notice */}
      <div className="glass-card p-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-white/60">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Résultats en temps réel - Vote en cours</span>
        </div>
      </div>
    </div>
  );
}

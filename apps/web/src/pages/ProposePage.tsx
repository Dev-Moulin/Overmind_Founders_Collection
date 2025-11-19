import { useState } from 'react';
import { FounderCard, type FounderData } from '../components/FounderCard';
import foundersData from '../../../../packages/shared/src/data/founders.json';

export function ProposePage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Cast foundersData to FounderData array
  const founders = foundersData as FounderData[];

  // Filter founders based on search term
  const filteredFounders = founders.filter(
    (founder) =>
      founder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      founder.shortBio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePropose = (founderId: string) => {
    // TODO: Implement proposal modal (issue #27)
    console.log('Proposer totem pour:', founderId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Proposer un Totem
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Choisissez un fondateur et proposez un totem qui le représente.
          Votre proposition sera soumise on-chain via le protocole INTUITION.
        </p>
      </div>

      {/* Search bar */}
      <div className="max-w-md mx-auto">
        <input
          type="text"
          placeholder="Rechercher un fondateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/50 transition-colors"
        />
      </div>

      {/* Stats */}
      <div className="text-center text-white/50 text-sm">
        {filteredFounders.length} fondateur{filteredFounders.length !== 1 ? 's' : ''}
        {searchTerm && ` trouvé${filteredFounders.length !== 1 ? 's' : ''}`}
      </div>

      {/* Founders grid */}
      {filteredFounders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFounders.map((founder) => (
            <FounderCard
              key={founder.id}
              founder={founder}
              proposalCount={0} // TODO: Fetch from GraphQL (issue #33)
              onPropose={() => handlePropose(founder.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/50">
            Aucun fondateur ne correspond à votre recherche.
          </p>
        </div>
      )}
    </div>
  );
}

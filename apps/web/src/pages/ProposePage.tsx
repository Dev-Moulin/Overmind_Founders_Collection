import { useState } from 'react';
import { FounderCard, type FounderData } from '../components/FounderCard';
import { ProposalModal, type ProposalFormData } from '../components/ProposalModal';
import foundersData from '../../../../packages/shared/src/data/founders.json';

export function ProposePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFounder, setSelectedFounder] = useState<FounderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cast foundersData to FounderData array
  const founders = foundersData as FounderData[];

  // Filter founders based on search term
  const filteredFounders = founders.filter(
    (founder) =>
      founder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      founder.shortBio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePropose = (founderId: string) => {
    const founder = founders.find((f) => f.id === founderId);
    if (founder) {
      setSelectedFounder(founder);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFounder(null);
  };

  const handleSubmitProposal = async (data: ProposalFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement INTUITION SDK integration (issues #29, #30)
      console.log('Submitting proposal:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Close modal on success
      handleCloseModal();

      // TODO: Show success notification
      alert(`Proposition soumise pour ${selectedFounder?.name}!`);
    } catch (error) {
      console.error('Error submitting proposal:', error);
      // TODO: Show error notification
      alert('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Proposal Modal */}
      {selectedFounder && (
        <ProposalModal
          founder={selectedFounder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitProposal}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}

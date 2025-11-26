import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { FounderCard, type FounderData } from '../components/FounderCard';
import { ProposalModal, type ProposalFormData } from '../components/ProposalModal';
import { useIntuition, ClaimExistsError } from '../hooks/useIntuition';
import { useFoundersWithAtomIds } from '../hooks/useFoundersWithAtomIds';
import { GET_ALL_PROPOSALS, GET_ATOMS_BY_LABELS } from '../lib/graphql/queries';
import type { Hex } from 'viem';

// Default predicates - same as AdminAuditPage
const DEFAULT_PREDICATES = [
  'is represented by',
  'has totem',
  'is symbolized by',
  'is associated with',
  'embodies',
  'channels',
  'resonates with',
];

export function ProposePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFounder, setSelectedFounder] = useState<FounderData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // INTUITION SDK hook
  const { createClaim, isReady } = useIntuition();

  // Get founders with their INTUITION atom IDs
  const { founders, loading: foundersLoading, error: foundersError, totalFounders, foundersWithAtoms } = useFoundersWithAtomIds();

  // Fetch all proposals from OUR app (with "represented_by" predicate) to extract existing objects (totems)
  const { data: proposalsData } = useQuery(GET_ALL_PROPOSALS, {
    fetchPolicy: 'cache-first',
  });

  // Fetch existing predicates from INTUITION to get their atomIds
  const { data: predicatesData } = useQuery<{ atoms: Array<{ term_id: string; label: string }> }>(
    GET_ATOMS_BY_LABELS,
    {
      variables: { labels: DEFAULT_PREDICATES },
      fetchPolicy: 'cache-first',
    }
  );

  // Build existingPredicates array with atomIds from GraphQL
  const existingPredicates = useMemo(() => {
    if (!predicatesData?.atoms) return [];

    // Create a map of label -> atomId
    const atomIdMap = new Map<string, string>();
    predicatesData.atoms.forEach((atom) => {
      atomIdMap.set(atom.label, atom.term_id);
    });

    // Return predicates with their atomIds (only those that exist on-chain)
    return DEFAULT_PREDICATES
      .filter((label) => atomIdMap.has(label))
      .map((label) => ({
        id: atomIdMap.get(label) as Hex,
        label,
      }));
  }, [predicatesData]);

  // Extract unique objects (totems) from OUR app's proposals only
  const existingObjects = useMemo(() => {
    if (!proposalsData?.triples) return [];
    const objectMap = new Map<string, { id: Hex; label: string }>();
    proposalsData.triples.forEach((triple: { object: { term_id: string; label: string } }) => {
      if (triple.object?.label && !objectMap.has(triple.object.term_id)) {
        objectMap.set(triple.object.term_id, {
          id: triple.object.term_id as Hex,
          label: triple.object.label,
        });
      }
    });
    return Array.from(objectMap.values());
  }, [proposalsData]);

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
    setError(null);
    setSuccess(null);

    try {
      if (!isReady) {
        throw new Error('Wallet non connecté');
      }

      if (!data.founderAtomId) {
        throw new Error(
          `Le fondateur "${selectedFounder?.name}" n'a pas d'Atom ID sur INTUITION. ` +
          `Vérifiez que son atom a bien été créé sur la blockchain.`
        );
      }

      // Create the claim using INTUITION SDK
      const result = await createClaim({
        subjectId: data.founderAtomId,
        predicate: data.predicate,
        object: data.object,
        depositAmount: data.trustAmount,
      });

      // Close modal on success
      handleCloseModal();

      // Show success message
      setSuccess(`Claim créé avec succès pour ${selectedFounder?.name}! Transaction: ${result.triple.transactionHash.slice(0, 10)}...`);

      // Clear success after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      // Check if claim already exists - redirect to vote page
      if (err instanceof ClaimExistsError) {
        handleCloseModal();

        // Show info message and redirect to vote page with search pre-filled
        setSuccess(`Ce claim existe déjà! Redirection vers la page de vote pour "${err.objectLabel}"...`);

        // Redirect to vote page with search query for the totem
        setTimeout(() => {
          navigate(`/vote?search=${encodeURIComponent(err.objectLabel)}`);
        }, 1500);
        return;
      }

      // Log détaillé dans la console
      console.error('=== ERREUR CRÉATION CLAIM ===');
      console.error('Données envoyées:', {
        founderId: data.founderId,
        founderAtomId: data.founderAtomId,
        predicate: data.predicate,
        object: data.object,
        trustAmount: data.trustAmount,
      });
      console.error('Erreur complète:', err);

      let errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du claim';

      // Améliorer les messages d'erreur courants
      if (errorMessage.includes('InsufficientBalance')) {
        errorMessage = `Balance tTRUST insuffisante pour créer ce claim. Assurez-vous d'avoir assez de tTRUST sur le réseau INTUITION Testnet.`;
      } else if (errorMessage.includes('TripleExists')) {
        errorMessage = `Ce claim existe déjà sur INTUITION. Vous pouvez voter dessus au lieu de le recréer.`;
      } else if (errorMessage.includes('AtomExists')) {
        errorMessage = `Un des atomes existe déjà. Cela ne devrait pas arriver - contactez le support.`;
      }

      setError(errorMessage);

      // Ne pas effacer l'erreur automatiquement pour que l'utilisateur puisse la voir
      // setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (foundersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/70">Chargement des fondateurs...</div>
      </div>
    );
  }

  // Error state
  if (foundersError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-400">Erreur lors du chargement : {foundersError.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error notifications - en bas à droite */}
      {success && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Succès!</p>
              <p className="text-green-300/80">{success}</p>
            </div>
          </div>
        </div>
      )}
      {error && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999999,
            maxWidth: '450px',
            minWidth: '320px',
            backgroundColor: '#1a0a0a',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#f87171', fontWeight: 'bold' }}>!</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ fontWeight: 600, color: '#f87171', margin: 0 }}>Erreur</p>
                <button
                  onClick={() => setError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(248, 113, 113, 0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p style={{ color: 'rgba(254, 202, 202, 0.9)', fontSize: '14px', lineHeight: '1.5', margin: 0, wordBreak: 'break-word' }}>{error}</p>
              <p style={{ color: 'rgba(248, 113, 113, 0.5)', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>Voir la console (F12) pour plus de détails</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Proposer un Totem
        </h1>
        <p className="text-white/70 max-w-2xl mx-auto">
          Choisissez un fondateur et proposez un totem qui le représente.
          Votre proposition sera soumise on-chain via le protocole INTUITION.
        </p>
        {/* Stats */}
        <p className="text-white/50 text-sm mt-2">
          {foundersWithAtoms}/{totalFounders} fondateurs enregistrés sur INTUITION
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
          founderAtomId={selectedFounder.atomId as Hex | undefined}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitProposal}
          isLoading={isSubmitting}
          existingPredicates={existingPredicates}
          existingObjects={existingObjects}
        />
      )}
    </div>
  );
}

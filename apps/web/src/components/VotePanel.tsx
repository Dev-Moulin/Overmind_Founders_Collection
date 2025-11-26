import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery, useLazyQuery } from '@apollo/client';
import { formatEther, type Hex } from 'viem';
import type { FounderForHomePage } from '../hooks/useFoundersForHomePage';
import { useFounderProposals, formatVoteAmount } from '../hooks/useFounderProposals';
import { useProtocolConfig } from '../hooks/useProtocolConfig';
import { useIntuition, ClaimExistsError } from '../hooks/useIntuition';
import { WalletConnectButton } from './ConnectButton';
import { ClaimExistsModal, type ExistingClaimInfo } from './ClaimExistsModal';
import { GET_TRIPLES_BY_PREDICATES, GET_ATOMS_BY_LABELS, GET_TRIPLE_BY_ATOMS, GET_FOUNDER_RECENT_VOTES } from '../lib/graphql/queries';
import predicatesData from '../../../../packages/shared/src/data/predicates.json';

// Préfixe utilisé dans la description des atoms pour identifier la catégorie
const CATEGORY_PREFIX = 'Categorie : ';

/**
 * Format timestamp to relative time string (e.g., "2m ago", "1h ago")
 */
function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'à l\'instant';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}j`;
  return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Catégories de totems suggérés (mêmes que ProposalModal)
const TOTEM_CATEGORIES = [
  {
    id: 'animals',
    name: 'Animaux',
    emoji: '🦁',
    examples: ['Lion', 'Aigle', 'Loup', 'Hibou', 'Renard', 'Dauphin', 'Éléphant', 'Baleine', 'Faucon', 'Cheval', 'Lynx', 'Chouette', 'Tortue']
  },
  {
    id: 'objects',
    name: 'Objets',
    emoji: '⚔️',
    examples: ['Clé maître', 'Fondation', 'Pont', 'Boussole', 'Bouclier', 'Lampe torche', 'Épée', 'Télescope']
  },
  {
    id: 'traits',
    name: 'Traits',
    emoji: '⭐',
    examples: ['Visionnaire', 'Leader', 'Innovateur', 'Connecteur', 'Protecteur', 'Stratège', 'Builder', 'Créatif']
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    emoji: '⚡',
    examples: ['Transformation', 'Connexion', 'Détection', 'Scaling', 'Innovation', 'Résilience']
  },
];

interface Predicate {
  id: string;
  label: string;
  description: string;
  termId: string | null;
  isDefault: boolean;
}

interface VotePanelProps {
  founder: FounderForHomePage;
}

/**
 * Vote panel component for V2_FONDATION
 * Shows predicate selector, totem selector/creator, and vote form
 */
export function VotePanel({ founder }: VotePanelProps) {
  const { isConnected, address } = useAccount();
  const predicates = predicatesData as Predicate[];

  // INTUITION SDK hook
  const { createClaim, createClaimWithDescription, isReady } = useIntuition();

  // Fetch existing proposals/totems for this founder
  const { proposals, refetch: refetchProposals } = useFounderProposals(founder.name);

  // Fetch protocol configuration (costs, fees)
  const { config: protocolConfig, loading: configLoading, isDepositValid, getTotalTripleCost } = useProtocolConfig();

  // Error/Success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user's TRUST balance (native token on INTUITION L3)
  const { data: balanceData } = useBalance({
    address,
  });

  // Fetch existing predicates from INTUITION to get their atomIds
  const predicateLabels = predicates.map(p => p.label);
  const { data: predicatesAtomData } = useQuery<{ atoms: Array<{ term_id: string; label: string }> }>(
    GET_ATOMS_BY_LABELS,
    {
      variables: { labels: predicateLabels },
      fetchPolicy: 'cache-first',
    }
  );

  // Fetch all triples with our predicates (includes object description)
  const { data: triplesData } = useQuery(GET_TRIPLES_BY_PREDICATES, {
    variables: { predicateLabels },
    fetchPolicy: 'cache-first',
  });

  // Lazy query for proactive claim existence check
  const [checkClaimExists, { data: claimCheckData, loading: claimCheckLoading }] = useLazyQuery<{
    triples: Array<{
      term_id: string;
      subject: { term_id: string; label: string };
      predicate: { term_id: string; label: string };
      object: { term_id: string; label: string };
      triple_vault: { total_shares: string; total_assets: string } | null;
    }>;
  }>(GET_TRIPLE_BY_ATOMS, {
    fetchPolicy: 'network-only',
  });

  // Fetch recent votes for this founder
  const { data: recentVotesData } = useQuery<{
    deposits: Array<{
      id: string;
      sender_id: string;
      vault_type: 'triple_positive' | 'triple_negative';
      assets_after_fees: string;
      created_at: string;
      term: {
        term_id: string;
        object: { label: string };
      };
    }>;
  }>(GET_FOUNDER_RECENT_VOTES, {
    variables: { founderName: founder.name, limit: 5 },
    skip: !founder.name,
    fetchPolicy: 'cache-and-network',
  });

  // Build predicates with their on-chain atomIds
  const predicatesWithAtomIds = useMemo(() => {
    if (!predicatesAtomData?.atoms) return predicates.map(p => ({ ...p, atomId: null, isOnChain: false }));

    const atomIdMap = new Map<string, string>();
    predicatesAtomData.atoms.forEach((atom) => {
      atomIdMap.set(atom.label, atom.term_id);
    });

    return predicates.map(p => ({
      ...p,
      atomId: atomIdMap.get(p.label) || null,
      isOnChain: atomIdMap.has(p.label),
    }));
  }, [predicates, predicatesAtomData]);

  // Extract unique objects (totems) from triples, filtered by description containing "Categorie :"
  // This ensures we only show totems created via our voting system
  const allExistingTotems = useMemo(() => {
    if (!triplesData?.triples) return [];
    const objectMap = new Map<string, { id: string; label: string; image?: string; category?: string }>();
    triplesData.triples.forEach((triple: {
      object: { term_id: string; label: string; image?: string; description?: string }
    }) => {
      const obj = triple.object;
      // Only include objects with description starting with our category prefix
      if (obj?.label && obj?.description?.startsWith(CATEGORY_PREFIX) && !objectMap.has(obj.term_id)) {
        // Extract category from description
        const category = obj.description.replace(CATEGORY_PREFIX, '');
        objectMap.set(obj.term_id, {
          id: obj.term_id,
          label: obj.label,
          image: obj.image,
          category,
        });
      }
    });
    return Array.from(objectMap.values());
  }, [triplesData]);

  // Form state
  const [selectedPredicateId, setSelectedPredicateId] = useState<string>(predicates[0]?.id || '');
  const [totemMode, setTotemMode] = useState<'existing' | 'new'>('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTotemId, setSelectedTotemId] = useState<string>('');
  const [newTotemName, setNewTotemName] = useState('');
  const [newTotemCategory, setNewTotemCategory] = useState<string>('');
  const [trustAmount, setTrustAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accordion state: 'predicate' | 'totem' | null
  const [openSection, setOpenSection] = useState<'predicate' | 'totem' | null>('predicate');

  // ClaimExistsModal state
  const [showClaimExistsModal, setShowClaimExistsModal] = useState(false);
  const [existingClaimInfo, setExistingClaimInfo] = useState<ExistingClaimInfo | null>(null);

  // Proactive claim check result
  const [proactiveClaimInfo, setProactiveClaimInfo] = useState<ExistingClaimInfo | null>(null);

  // Toggle accordion section (close others when opening one)
  const toggleSection = (section: 'predicate' | 'totem') => {
    setOpenSection(openSection === section ? null : section);
  };

  // Set initial trust amount to minimum deposit when config loads
  useEffect(() => {
    if (protocolConfig?.formattedMinDeposit && !trustAmount) {
      setTrustAmount(protocolConfig.formattedMinDeposit);
    }
  }, [protocolConfig?.formattedMinDeposit, trustAmount]);

  // Get selected predicate with atomId (for proactive check)
  const selectedPredicateWithAtom = useMemo(
    () => predicatesWithAtomIds.find((p) => p.id === selectedPredicateId),
    [predicatesWithAtomIds, selectedPredicateId]
  );

  // Proactive claim existence check when predicate AND totem are selected
  useEffect(() => {
    // Only check for existing totems (we can't check for new ones)
    if (totemMode !== 'existing' || !selectedTotemId) {
      setProactiveClaimInfo(null);
      return;
    }

    // Need founder atomId, predicate atomId, and totem atomId
    if (!founder.atomId || !selectedPredicateWithAtom?.atomId) {
      setProactiveClaimInfo(null);
      return;
    }

    // Trigger the check
    checkClaimExists({
      variables: {
        subjectId: founder.atomId,
        predicateId: selectedPredicateWithAtom.atomId,
        objectId: selectedTotemId,
      },
    });
  }, [founder.atomId, selectedPredicateWithAtom?.atomId, selectedTotemId, totemMode, checkClaimExists]);

  // Process claim check results
  useEffect(() => {
    if (claimCheckData?.triples && claimCheckData.triples.length > 0) {
      const triple = claimCheckData.triples[0];
      const vault = triple.triple_vault;
      setProactiveClaimInfo({
        termId: triple.term_id,
        subjectLabel: triple.subject.label,
        predicateLabel: triple.predicate.label,
        objectLabel: triple.object.label,
        forVotes: vault?.total_shares || '0',
        againstVotes: '0', // La query ne récupère pas les votes AGAINST séparément
      });
    } else if (claimCheckData?.triples?.length === 0) {
      setProactiveClaimInfo(null);
    }
  }, [claimCheckData]);

  // Get selected predicate
  const selectedPredicate = useMemo(
    () => predicates.find((p) => p.id === selectedPredicateId),
    [predicates, selectedPredicateId]
  );

  // Aggregate proposals by totem (object) to get unique totems with their scores
  const existingTotems = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    // Group by object (totem) and aggregate votes
    const totemMap = new Map<string, {
      id: string;
      label: string;
      image?: string;
      trustScore: number;
    }>();

    proposals.forEach((proposal) => {
      const totemId = proposal.object.term_id;
      const existing = totemMap.get(totemId);
      const forVotes = BigInt(proposal.votes.forVotes);
      const againstVotes = BigInt(proposal.votes.againstVotes);
      const netScore = forVotes - againstVotes;

      if (existing) {
        // Add to existing totem's score
        existing.trustScore += Number(formatEther(netScore));
      } else {
        // New totem
        totemMap.set(totemId, {
          id: totemId,
          label: proposal.object.label,
          image: proposal.object.image,
          trustScore: Number(formatEther(netScore)),
        });
      }
    });

    // Convert to array and sort by trustScore descending
    return Array.from(totemMap.values())
      .sort((a, b) => b.trustScore - a.trustScore);
  }, [proposals]);

  // Get selected totem (from all existing totems or founder-specific)
  const selectedTotem = useMemo(
    () => allExistingTotems.find((t) => t.id === selectedTotemId) || existingTotems.find((t) => t.id === selectedTotemId),
    [allExistingTotems, existingTotems, selectedTotemId]
  );

  // Filter all existing totems by search query
  const filteredAllTotems = useMemo(() => {
    if (!searchQuery) return allExistingTotems;
    const query = searchQuery.toLowerCase();
    return allExistingTotems.filter((t) => t.label.toLowerCase().includes(query));
  }, [allExistingTotems, searchQuery]);

  // Build preview text
  const previewText = useMemo(() => {
    const predicateLabel = selectedPredicate?.label || '...';
    const totemLabel =
      totemMode === 'existing' ? selectedTotem?.label || '...' : newTotemName || '...';
    return `${founder.name} ${predicateLabel} ${totemLabel}`;
  }, [founder.name, selectedPredicate, totemMode, selectedTotem, newTotemName]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (!selectedPredicateId) return false;
    if (totemMode === 'existing' && !selectedTotemId) return false;
    if (totemMode === 'new' && !newTotemName.trim()) return false;
    // Catégorie obligatoire pour nouveau totem
    if (totemMode === 'new' && !newTotemCategory) return false;
    if (!trustAmount || parseFloat(trustAmount) <= 0) return false;
    // Validate against protocol minimum deposit
    if (!isDepositValid(trustAmount)) return false;
    return true;
  }, [selectedPredicateId, totemMode, selectedTotemId, newTotemName, newTotemCategory, trustAmount, isDepositValid]);

  // Calculate total cost for creating a triple
  const totalCost = useMemo(() => {
    return getTotalTripleCost(trustAmount);
  }, [trustAmount, getTotalTripleCost]);

  // Build description with category for new totem
  const newTotemDescription = useMemo(() => {
    if (!newTotemCategory) return '';
    return `Categorie : ${newTotemCategory}`;
  }, [newTotemCategory]);

  // Handle form submit
  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isReady) {
        throw new Error('Wallet non connecté');
      }

      if (!founder.atomId) {
        throw new Error(
          `Le fondateur "${founder.name}" n'a pas d'Atom ID sur INTUITION. ` +
          `Vérifiez que son atom a bien été créé sur la blockchain.`
        );
      }

      console.log('[VotePanel] Creating claim:', {
        founder: founder.name,
        founderId: founder.atomId,
        predicate: selectedPredicateWithAtom?.label,
        predicateAtomId: selectedPredicateWithAtom?.atomId,
        totemMode,
        totemId: totemMode === 'existing' ? selectedTotemId : null,
        newTotem: totemMode === 'new' ? {
          name: newTotemName,
          category: newTotemCategory,
          description: newTotemDescription,
        } : null,
        trustAmount,
      });

      // Determine predicate value (atomId if exists, label if needs creation)
      const predicateValue = selectedPredicateWithAtom?.atomId || selectedPredicateWithAtom?.label;
      if (!predicateValue) {
        throw new Error('Prédicat non sélectionné');
      }

      let result;

      if (totemMode === 'existing') {
        // Use existing totem - use createClaim
        if (!selectedTotemId) {
          throw new Error('Totem non sélectionné');
        }

        result = await createClaim({
          subjectId: founder.atomId as Hex,
          predicate: predicateValue,
          object: selectedTotemId as Hex,
          depositAmount: trustAmount,
        });
      } else {
        // Create new totem with description - use createClaimWithDescription
        if (!newTotemName.trim()) {
          throw new Error('Nom du totem requis');
        }

        result = await createClaimWithDescription({
          subjectId: founder.atomId as Hex,
          predicate: predicateValue,
          objectName: newTotemName.trim(),
          objectDescription: newTotemDescription,
          depositAmount: trustAmount,
        });
      }

      console.log('[VotePanel] Claim created:', result);

      // Show success message
      const totemLabel = totemMode === 'existing' ? selectedTotem?.label : newTotemName;
      setSuccess(
        `Claim créé avec succès!\n` +
        `"${founder.name} ${selectedPredicateWithAtom?.label} ${totemLabel}"\n` +
        `Transaction: ${result.triple.transactionHash.slice(0, 10)}...`
      );

      // Reset form
      setNewTotemName('');
      setNewTotemCategory('');
      setSelectedTotemId('');
      setTotemMode('existing');
      setOpenSection('predicate');

      // Refresh proposals data
      refetchProposals();

      // Clear success after 8 seconds
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      // Check if claim already exists - open modal to vote on it
      if (err instanceof ClaimExistsError) {
        console.log('[VotePanel] Claim exists, opening modal:', err.objectLabel);
        setExistingClaimInfo({
          termId: err.termId,
          subjectLabel: err.subjectLabel,
          predicateLabel: err.predicateLabel,
          objectLabel: err.objectLabel,
        });
        setShowClaimExistsModal(true);
        setIsSubmitting(false);
        return;
      }

      // Log detailed error
      console.error('[VotePanel] === ERREUR CRÉATION CLAIM ===');
      console.error('Erreur complète:', err);

      let errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du claim';

      // Improve common error messages
      if (errorMessage.includes('InsufficientBalance')) {
        errorMessage = `Balance tTRUST insuffisante. Assurez-vous d'avoir assez de tTRUST sur INTUITION Testnet.`;
      } else if (errorMessage.includes('TripleExists')) {
        errorMessage = `Ce claim existe déjà. Vous pouvez voter dessus au lieu de le recréer.`;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <div className="glass-card h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
          <span className="text-3xl">🔗</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connectez votre wallet</h3>
        <p className="text-white/60 mb-6">
          Pour voter ou proposer un totem, vous devez connecter votre wallet.
        </p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="glass-card h-full flex flex-col p-6 overflow-y-auto">
      <h3 className="text-xl font-bold text-white mb-6">Créer un vote totem</h3>

      {/* Success notification */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-green-300 text-sm whitespace-pre-line">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400/60 hover:text-green-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-400 text-xs font-bold">!</span>
            </div>
            <div className="flex-1">
              <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
              <p className="text-red-400/50 text-xs mt-1">Voir console (F12) pour détails</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity - Historique des votes récents */}
      {recentVotesData?.deposits && recentVotesData.deposits.length > 0 && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h4 className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Activité récente
          </h4>
          <div className="space-y-2">
            {recentVotesData.deposits.slice(0, 5).map((vote) => {
              const isFor = vote.vault_type === 'triple_positive';
              const amount = formatVoteAmount(vote.assets_after_fees);
              const timeAgo = getTimeAgo(vote.created_at);
              const voterShort = `${vote.sender_id.slice(0, 6)}...${vote.sender_id.slice(-4)}`;

              return (
                <div key={vote.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${isFor ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-white/40 font-mono">{voterShort}</span>
                  <span className={isFor ? 'text-green-400' : 'text-red-400'}>
                    {isFor ? '+' : '-'}{amount}
                  </span>
                  <span className="text-white/60 truncate flex-1">
                    sur {vote.term.object.label}
                  </span>
                  <span className="text-white/30">{timeAgo}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Select Predicate (Accordion) */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('predicate')}
          className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/70">1. Prédicat</span>
            {selectedPredicate && (
              <span className="text-sm text-purple-400">: {selectedPredicate.label}</span>
            )}
          </div>
          <span className={`text-xs text-purple-400 transition-transform duration-500 ${openSection === 'predicate' ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Dropdown content with smooth transition */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            openSection === 'predicate' ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-lg">
            {predicates.map((predicate) => (
              <label
                key={predicate.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${
                    selectedPredicateId === predicate.id
                      ? 'bg-purple-500/20 border border-purple-500/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
              >
                <input
                  type="radio"
                  name="predicate"
                  value={predicate.id}
                  checked={selectedPredicateId === predicate.id}
                  onChange={(e) => {
                    setSelectedPredicateId(e.target.value);
                    // Ouvrir automatiquement la section totem après sélection
                    setOpenSection('totem');
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${
                    selectedPredicateId === predicate.id
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-white/30'
                  }`}
                >
                  {selectedPredicateId === predicate.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-white">{predicate.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Select or Create Totem (Accordion) */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('totem')}
          className="w-full flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/70">2. Totem</span>
            {(selectedTotem || newTotemName) && (
              <span className="text-sm text-purple-400">
                : {totemMode === 'existing' ? selectedTotem?.label : newTotemName}
                {totemMode === 'new' && ' (nouveau)'}
              </span>
            )}
          </div>
          <span className={`text-xs text-purple-400 transition-transform duration-500 ${openSection === 'totem' ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Dropdown content with smooth transition */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            openSection === 'totem' ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4 p-3 bg-white/5 border border-white/10 rounded-lg max-h-80 overflow-y-auto">
            {/* Mode tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setTotemMode('existing')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  totemMode === 'existing'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                Totem existant
              </button>
              <button
                onClick={() => setTotemMode('new')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  totemMode === 'new'
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                Créer nouveau
              </button>
            </div>

            {totemMode === 'existing' ? (
              <>
                {/* Totems existants de CE fondateur (avec scores) */}
                {existingTotems.length > 0 && (
                  <div>
                    <p className="text-xs text-white/50 mb-2">Totems de {founder.name} :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {existingTotems.slice(0, 8).map((totem) => (
                        <button
                          key={totem.id}
                          type="button"
                          onClick={() => {
                            setSelectedTotemId(totem.id);
                            setNewTotemName('');
                            setOpenSection(null); // Fermer l'accordéon
                          }}
                          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                            selectedTotemId === totem.id
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {totem.label} ({totem.trustScore.toFixed(1)})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tous les totems existants (globaux) */}
                {allExistingTotems.length > 0 && (
                  <div>
                    <p className="text-xs text-white/50 mb-2">Tous les totems ({allExistingTotems.length}) :</p>
                    {/* Search filter */}
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredAllTotems.slice(0, 15).map((totem) => (
                        <button
                          key={totem.id}
                          type="button"
                          onClick={() => {
                            setSelectedTotemId(totem.id);
                            setNewTotemName('');
                            setOpenSection(null); // Fermer l'accordéon
                          }}
                          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                            selectedTotemId === totem.id
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {totem.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions par catégorie (aussi dans mode existant) */}
                <div>
                  <p className="text-xs text-white/50 mb-2">Ou créer depuis suggestions :</p>
                  <div className="space-y-2">
                    {TOTEM_CATEGORIES.map((cat) => (
                      <div key={cat.id}>
                        <p className="text-xs text-white/40 mb-1">{cat.emoji} {cat.name}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.examples.slice(0, 4).map((example) => (
                            <button
                              key={example}
                              type="button"
                              onClick={() => {
                                // Basculer en mode création avec suggestion
                                setTotemMode('new');
                                setNewTotemName(example);
                                setNewTotemCategory(cat.name);
                                setSelectedTotemId('');
                              }}
                              className="px-2 py-1 text-xs rounded-lg transition-colors bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                            >
                              {example}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {allExistingTotems.length === 0 && existingTotems.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">
                    Pas trouvé ? Créez-en un nouveau !
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Création de nouveau totem */}
                <div className="space-y-3">
                  {/* Nom du totem */}
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Nom du totem *</label>
                    <input
                      type="text"
                      placeholder="Ex: Lion, Boussole, Visionnaire..."
                      value={newTotemName}
                      onChange={(e) => setNewTotemName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {/* Catégorie - input texte libre */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="block text-xs text-white/50">Catégorie</label>
                      {newTotemName && !newTotemCategory && (
                        <span className="text-xs text-red-400 animate-pulse">obligatoire</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: Animaux, Objets, Traits..."
                      value={newTotemCategory}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewTotemCategory(value);
                        // Auto-match avec catégorie existante (insensible à la casse)
                        const matchedCategory = TOTEM_CATEGORIES.find(
                          cat => cat.name.toLowerCase() === value.toLowerCase()
                        );
                        if (matchedCategory) {
                          setNewTotemCategory(matchedCategory.name);
                        }
                      }}
                      className={`w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none transition-all duration-300 ${
                        newTotemName && !newTotemCategory
                          ? 'border border-red-500/50 animate-pulse focus:border-red-400/70'
                          : 'border border-white/10 focus:border-purple-500/50'
                      }`}
                    />
                    {newTotemCategory && (
                      <p className="text-xs text-white/40 mt-1">
                        Description: <span className="text-purple-400">{newTotemDescription}</span>
                      </p>
                    )}
                  </div>

                  {/* Suggestions rapides = catégories */}
                  <div>
                    <p className="text-xs text-white/50 mb-2">Catégories suggérées :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TOTEM_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewTotemCategory(cat.name)}
                          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                            newTotemCategory === cat.name
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {cat.emoji} {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step 3: TRUST Amount */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-white/70 mb-3">3. Montant TRUST</h4>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            step="1"
            value={trustAmount}
            onChange={(e) => setTrustAmount(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
          />
          <span className="text-white/60">TRUST</span>
        </div>
        <div className="text-xs text-white/40 mt-2 space-y-1">
          <p>Balance: {balanceData ? `${Number(formatEther(balanceData.value)).toFixed(3)} TRUST` : 'Chargement...'}</p>
          {configLoading ? (
            <p>Chargement config protocole...</p>
          ) : protocolConfig ? (
            <>
              <p>Minimum requis: {protocolConfig.formattedMinDeposit} TRUST</p>
              <p>Frais d'entrée: {protocolConfig.formattedEntryFee}</p>
            </>
          ) : null}
        </div>
      </div>

      {/* Preview */}
      <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <h4 className="text-xs font-semibold text-purple-400 mb-2">Preview</h4>
        <p className="text-white font-medium">{previewText}</p>
        <p className="text-sm text-white/50 mt-1">
          Dépôt: {trustAmount || '0'} TRUST (vote FOR)
        </p>
        {totalCost && (
          <p className="text-xs text-white/40 mt-1">
            Coût total: {totalCost.formatted} TRUST (base + dépôt)
          </p>
        )}
      </div>

      {/* Proactive claim exists warning */}
      {proactiveClaimInfo && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-400 text-xl">!</span>
            <div className="flex-1">
              <p className="text-amber-400 font-medium mb-1">Ce claim existe déjà</p>
              <p className="text-sm text-white/70 mb-2">
                "{proactiveClaimInfo.subjectLabel} {proactiveClaimInfo.predicateLabel} {proactiveClaimInfo.objectLabel}"
              </p>
              <p className="text-xs text-white/50 mb-3">
                Votes actuels: {formatVoteAmount(proactiveClaimInfo.forVotes || '0')} TRUST
              </p>
              <button
                onClick={() => {
                  setExistingClaimInfo(proactiveClaimInfo);
                  setShowClaimExistsModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Voter sur ce claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator for claim check */}
      {claimCheckLoading && (
        <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            Vérification si ce claim existe...
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting || !!proactiveClaimInfo}
        className={`w-full py-3 rounded-lg font-semibold transition-colors
          ${
            isFormValid && !isSubmitting && !proactiveClaimInfo
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
      >
        {isSubmitting ? 'Création en cours...' : proactiveClaimInfo ? 'Claim déjà existant' : 'Créer le vote'}
      </button>

      {/* ClaimExistsModal - appears when trying to create a claim that already exists */}
      <ClaimExistsModal
        isOpen={showClaimExistsModal}
        onClose={() => {
          setShowClaimExistsModal(false);
          setExistingClaimInfo(null);
        }}
        claim={existingClaimInfo}
        initialAmount={trustAmount}
        onVoteSuccess={() => {
          // Reset form and refresh data after successful vote
          setNewTotemName('');
          setNewTotemCategory('');
          setSelectedTotemId('');
          setTotemMode('existing');
          setOpenSection('predicate');
          refetchProposals();
          setSuccess('Vote enregistré avec succès sur le claim existant !');
          setTimeout(() => setSuccess(null), 5000);
        }}
      />
    </div>
  );
}

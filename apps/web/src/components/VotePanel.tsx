import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@apollo/client';
import type { FounderForHomePage } from '../hooks/useFoundersForHomePage';
import { useFounderProposals } from '../hooks/useFounderProposals';
import { useProtocolConfig } from '../hooks/useProtocolConfig';
import { ClaimExistsModal } from './ClaimExistsModal';
import { NotConnected } from './vote/NotConnected';
import { RecentActivity } from './vote/RecentActivity';
import { VotePreview } from './vote/VotePreview';
import { ClaimExistsWarning } from './vote/ClaimExistsWarning';
import { PredicateSelector } from './vote/PredicateSelector';
import { TrustAmountInput } from './vote/TrustAmountInput';
import { TotemSelector } from './vote/TotemSelector';
import { SuccessNotification } from './vote/SuccessNotification';
import { ErrorNotification } from './vote/ErrorNotification';
import { SubmitButton } from './vote/SubmitButton';
import { GET_TRIPLES_BY_PREDICATES, GET_ATOMS_BY_LABELS, GET_FOUNDER_RECENT_VOTES } from '../lib/graphql/queries';
import { useTotemData } from '../hooks/useTotemData';
import { useProactiveClaimCheck } from '../hooks/useProactiveClaimCheck';
import { useVoteSubmit } from '../hooks/useVoteSubmit';
import type { CategoryConfigType } from '../types/category';
import type { Predicate } from '../types/predicate';
import predicatesData from '../../../../packages/shared/src/data/predicates.json';
import categoriesConfig from '../../../../packages/shared/src/data/categories.json';

const typedCategoriesConfig = categoriesConfig as CategoryConfigType;

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

  const { proposals, refetch: refetchProposals } = useFounderProposals(founder.name);
  const { config: protocolConfig, loading: configLoading, isDepositValid, getTotalTripleCost } = useProtocolConfig();

  const { data: balanceData } = useBalance({ address });

  const predicateLabels = predicates.map(p => p.label);
  const { data: predicatesAtomData } = useQuery<{ atoms: Array<{ term_id: string; label: string }> }>(
    GET_ATOMS_BY_LABELS,
    {
      variables: { labels: predicateLabels },
      fetchPolicy: 'cache-first',
    }
  );

  const { data: triplesData } = useQuery(GET_TRIPLES_BY_PREDICATES, {
    variables: { predicateLabels },
    fetchPolicy: 'cache-first',
  });

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

  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPredicateId, setSelectedPredicateId] = useState<string>(predicates[0]?.id || '');
  const [totemMode, setTotemMode] = useState<'existing' | 'new'>('existing');
  const [selectedTotemId, setSelectedTotemId] = useState<string>('');
  const [newTotemName, setNewTotemName] = useState('');
  const [newTotemCategory, setNewTotemCategory] = useState<string>('');
  const [trustAmount, setTrustAmount] = useState<string>('');
  const [openSection, setOpenSection] = useState<'predicate' | 'totem' | null>('predicate');

  const {
    allExistingTotems,
    existingTotems,
    filteredAllTotems,
    totemsByCategory,
    dynamicCategories,
  } = useTotemData({
    triplesData,
    proposals,
    searchQuery,
  });

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

  const toggleSection = (section: 'predicate' | 'totem') => {
    setOpenSection(openSection === section ? null : section);
  };

  useEffect(() => {
    if (protocolConfig?.formattedMinDeposit && trustAmount === '') {
      setTrustAmount(protocolConfig.formattedMinDeposit);
    }
  }, [protocolConfig?.formattedMinDeposit]);

  const selectedPredicateWithAtom = useMemo(
    () => predicatesWithAtomIds.find((p) => p.id === selectedPredicateId),
    [predicatesWithAtomIds, selectedPredicateId]
  );

  const {
    proactiveClaimInfo,
    isLoading: claimCheckLoading,
    refetch: refetchClaimCheck,
  } = useProactiveClaimCheck({
    founderAtomId: founder.atomId,
    selectedPredicateWithAtom,
    selectedTotemId,
    totemMode,
  });

  const selectedPredicate = useMemo(
    () => predicates.find((p) => p.id === selectedPredicateId),
    [predicates, selectedPredicateId]
  );

  const selectedTotem = useMemo(
    () => allExistingTotems.find((t) => t.id === selectedTotemId) || existingTotems.find((t) => t.id === selectedTotemId),
    [allExistingTotems, existingTotems, selectedTotemId]
  );

  const previewText = useMemo(() => {
    const predicateLabel = selectedPredicate?.label || '...';
    const totemLabel = totemMode === 'existing' ? selectedTotem?.label || '...' : newTotemName || '...';
    return `${founder.name} ${predicateLabel} ${totemLabel}`;
  }, [founder.name, selectedPredicate, totemMode, selectedTotem, newTotemName]);

  const isFormValid = useMemo(() => {
    if (!selectedPredicateId) return false;
    if (totemMode === 'existing' && !selectedTotemId) return false;
    if (totemMode === 'new' && !newTotemName.trim()) return false;
    if (totemMode === 'new' && !newTotemCategory) return false;
    if (!trustAmount || parseFloat(trustAmount) <= 0) return false;
    if (!isDepositValid(trustAmount)) return false;
    return true;
  }, [selectedPredicateId, totemMode, selectedTotemId, newTotemName, newTotemCategory, trustAmount, isDepositValid]);

  const totalCost = useMemo(() => {
    return getTotalTripleCost(trustAmount);
  }, [trustAmount, getTotalTripleCost]);

  const selectedCategoryId = useMemo(() => {
    if (!newTotemCategory) return '';
    const category = typedCategoriesConfig.categories.find(
      c => c.name.toLowerCase() === newTotemCategory.toLowerCase()
    );
    return category?.id || newTotemCategory.toLowerCase().replace(/\s+/g, '-');
  }, [newTotemCategory]);

  const {
    isSubmitting,
    error,
    success,
    existingClaimInfo,
    showClaimExistsModal,
    closeClaimExistsModal,
    clearError,
    clearSuccess,
    setSuccess,
    setExistingClaimInfo,
    setShowClaimExistsModal,
    handleSubmit,
  } = useVoteSubmit({
    founder,
    selectedPredicateWithAtom,
    totemMode,
    selectedTotemId,
    selectedTotem,
    newTotemName,
    selectedCategoryId,
    trustAmount,
    isFormValid,
    onResetForm: () => {
      setNewTotemName('');
      setNewTotemCategory('');
      setSelectedTotemId('');
      setTotemMode('existing');
      setOpenSection('predicate');
    },
    refetchProposals,
  });

  if (!isConnected) {
    return <NotConnected />;
  }

  return (
    <div className="glass-card h-full flex flex-col p-6 overflow-y-auto">
      <h3 className="text-xl font-bold text-white mb-6">Créer un vote totem</h3>

      {success && (
        <SuccessNotification message={success} onClose={clearSuccess} />
      )}

      {error && (
        <ErrorNotification message={error} onClose={clearError} />
      )}

      <RecentActivity votes={recentVotesData?.deposits || []} />

      <PredicateSelector
        predicates={predicates}
        selectedPredicateId={selectedPredicateId}
        selectedPredicate={selectedPredicate}
        isOpen={openSection === 'predicate'}
        onToggle={() => toggleSection('predicate')}
        onSelect={(id) => {
          setSelectedPredicateId(id);
          setOpenSection('totem');
        }}
      />

      <TotemSelector
        founderName={founder.name}
        isOpen={openSection === 'totem'}
        totemMode={totemMode}
        selectedTotemId={selectedTotemId}
        selectedTotem={selectedTotem}
        newTotemName={newTotemName}
        newTotemCategory={newTotemCategory}
        searchQuery={searchQuery}
        existingTotems={existingTotems}
        allExistingTotems={allExistingTotems}
        filteredAllTotems={filteredAllTotems}
        totemsByCategory={totemsByCategory}
        dynamicCategories={dynamicCategories}
        onToggle={() => toggleSection('totem')}
        onModeChange={setTotemMode}
        onSelectTotem={setSelectedTotemId}
        onNewTotemNameChange={setNewTotemName}
        onNewTotemCategoryChange={setNewTotemCategory}
        onSearchQueryChange={setSearchQuery}
        onCloseAccordion={() => setOpenSection(null)}
      />

      <TrustAmountInput
        value={trustAmount}
        onChange={setTrustAmount}
        balance={balanceData?.value}
        protocolConfig={protocolConfig}
        configLoading={configLoading}
        isDepositValid={isDepositValid}
      />

      <VotePreview previewText={previewText} trustAmount={trustAmount} totalCost={totalCost} />

      <ClaimExistsWarning
        claimInfo={proactiveClaimInfo}
        isLoading={claimCheckLoading}
        onVoteClick={() => {
          setExistingClaimInfo(proactiveClaimInfo);
          setShowClaimExistsModal(true);
        }}
      />

      <SubmitButton
        onClick={handleSubmit}
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
        hasExistingClaim={!!proactiveClaimInfo}
      />

      <ClaimExistsModal
        isOpen={showClaimExistsModal}
        onClose={closeClaimExistsModal}
        claim={existingClaimInfo}
        initialAmount={trustAmount}
        onVoteSuccess={async () => {
          setNewTotemName('');
          setNewTotemCategory('');

          setSuccess('Vote enregistré avec succès !');
          setTimeout(() => setSuccess(null), 5000);

          const currentForVotes = proactiveClaimInfo?.forVotes || '0';

          for (let attempt = 0; attempt < 10; attempt++) {
            const delay = attempt === 0 ? 500 : 1000;
            await new Promise(resolve => setTimeout(resolve, delay));

            refetchProposals();

            if (refetchClaimCheck) {
              try {
                const result = await refetchClaimCheck();
                const data = result as { data?: { triples?: Array<{ triple_vault?: { total_assets: string } }> } };
                const triple = data.data?.triples?.[0];

                if (triple) {
                  const newForVotes = triple.triple_vault?.total_assets || '0';
                  if (newForVotes !== currentForVotes) {
                    break;
                  }
                }
              } catch (err) {
                console.error('[VotePanel] Refetch error:', err);
              }
            }
          }
        }}
      />
    </div>
  );
}

/**
 * useProactiveClaimCheck - Hook pour vérifier si un claim existe déjà
 * Extrait de VotePanel.tsx lignes 237-278
 *
 * Vérifie proactivement si un triple (claim) existe déjà
 * quand le prédicat ET le totem sont sélectionnés
 */

import { useState, useEffect, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client';
import { GET_TRIPLE_BY_ATOMS } from '../../lib/graphql/queries';
import type { ExistingClaimInfo } from '../../components/modal/ClaimExistsModal';

interface PredicateWithAtom {
  id: string;
  label: string;
  atomId: string | null;
  isOnChain: boolean;
}

interface UseProactiveClaimCheckProps {
  founderAtomId: string | undefined;
  selectedPredicateWithAtom: PredicateWithAtom | undefined;
  selectedTotemId: string;
  totemMode: 'existing' | 'new';
}

interface UseProactiveClaimCheckReturn {
  /** Info sur le claim existant (null si n'existe pas) */
  proactiveClaimInfo: ExistingClaimInfo | null;
  /** True si la vérification est en cours */
  isLoading: boolean;
  /** Reset le proactiveClaimInfo */
  reset: () => void;
  /** Refetch pour vérifier après création d'un claim */
  refetch: (() => Promise<unknown>) | undefined;
  /** Check manuel avec variables custom */
  checkClaim: (variables: { subjectId: string; predicateId: string; objectId: string }) => void;
}

export function useProactiveClaimCheck({
  founderAtomId,
  selectedPredicateWithAtom,
  selectedTotemId,
  totemMode,
}: UseProactiveClaimCheckProps): UseProactiveClaimCheckReturn {
  const [proactiveClaimInfo, setProactiveClaimInfo] = useState<ExistingClaimInfo | null>(null);

  // Lazy query to check if triple already exists
  const [checkClaimExists, { data: claimCheckData, loading: claimCheckLoading, refetch }] = useLazyQuery<{
    triples: Array<{
      term_id: string;
      subject: { label: string };
      predicate: { label: string };
      object: { label: string };
      triple_vault?: {
        total_assets: string;
      };
      counter_term?: {
        id: string;
        total_assets: string;
      };
    }>;
  }>(GET_TRIPLE_BY_ATOMS, {
    fetchPolicy: 'network-only',
  });

  // Proactive claim existence check when predicate AND totem are selected
  useEffect(() => {
    // Only check for existing totems (we can't check for new ones)
    if (totemMode !== 'existing' || !selectedTotemId) {
      setProactiveClaimInfo(null);
      return;
    }

    // Need founder atomId, predicate atomId, and totem atomId
    if (!founderAtomId || !selectedPredicateWithAtom?.atomId) {
      setProactiveClaimInfo(null);
      return;
    }

    // Trigger the check
    checkClaimExists({
      variables: {
        subjectId: founderAtomId,
        predicateId: selectedPredicateWithAtom.atomId,
        objectId: selectedTotemId,
      },
    });
  }, [founderAtomId, selectedPredicateWithAtom?.atomId, selectedTotemId, totemMode, checkClaimExists]);

  // Process claim check results
  useEffect(() => {
    if (claimCheckData?.triples && claimCheckData.triples.length > 0) {
      const triple = claimCheckData.triples[0];
      const vault = triple.triple_vault;
      const counterTerm = triple.counter_term;
      const newInfo: ExistingClaimInfo = {
        termId: triple.term_id,
        counterTermId: counterTerm?.id,
        subjectLabel: triple.subject.label,
        predicateLabel: triple.predicate.label,
        objectLabel: triple.object.label,
        forVotes: vault?.total_assets || '0', // Use total_assets (wei amount), not total_shares
        againstVotes: counterTerm?.total_assets || '0', // AGAINST votes from counter_term
      };
      setProactiveClaimInfo(newInfo);
    } else if (claimCheckData?.triples?.length === 0) {
      setProactiveClaimInfo(null);
    }
  }, [claimCheckData]);

  const reset = useCallback(() => setProactiveClaimInfo(null), []);

  const checkClaim = useCallback(
    (variables: { subjectId: string; predicateId: string; objectId: string }) => {
      checkClaimExists({ variables });
    },
    [checkClaimExists]
  );

  return {
    proactiveClaimInfo,
    isLoading: claimCheckLoading,
    reset,
    refetch,
    checkClaim,
  };
}

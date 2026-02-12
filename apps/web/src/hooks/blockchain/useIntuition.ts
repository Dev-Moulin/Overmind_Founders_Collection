/**
 * useIntuition - Facade combinant atoms/, triples/, claims/
 *
 * Hook principal pour interagir avec le protocole INTUITION.
 * Combine les modules extraits pour maintenir la compatibilité.
 *
 * @see useIntuition.original.ts pour le code original (backup)
 * @see atoms/useAtoms.ts, triples/useTriples.ts, claims/useClaims.ts
 */

import { useMemo } from 'react';
import { useAtoms } from './atoms/useAtoms';
import { useTriples } from './triples/useTriples';
import { useClaims } from './claims/useClaims';

// Re-export types for backward compatibility
export type { CreateAtomResult, CreateTripleResult, FounderData } from '../../types/intuition';
export { ClaimExistsError } from '../../types/intuition';

// Re-export utility function
export { getFounderImageUrl } from '../../utils/founderImage';

/**
 * Hook facade qui combine atoms, triples et claims
 */
export function useIntuition() {
  const {
    findAtomByLabel,
    createAtom,
    getOrCreateAtom,
    createAtomWithImage,
    getOrCreateAtomWithImage,
    createAtomWithDescription,
    getOrCreateAtomWithDescription,
    createFounderAtom,
    isReady: atomsReady,
  } = useAtoms();

  const {
    findTriple,
    createTriple,
    isReady: triplesReady,
  } = useTriples();

  const {
    createClaim,
    createClaimWithDescription,
    createClaimWithCategory,
    isReady: claimsReady,
  } = useClaims();

  const isReady = atomsReady && triplesReady && claimsReady;

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Atoms
    findAtomByLabel,
    createAtom,
    getOrCreateAtom,
    createAtomWithImage,
    getOrCreateAtomWithImage,
    createAtomWithDescription,
    getOrCreateAtomWithDescription,
    createFounderAtom,
    // Triples
    findTriple,
    createTriple,
    // Claims
    createClaim,
    createClaimWithDescription,
    createClaimWithCategory,
    // State
    isReady,
  }), [
    findAtomByLabel,
    createAtom,
    getOrCreateAtom,
    createAtomWithImage,
    getOrCreateAtomWithImage,
    createAtomWithDescription,
    getOrCreateAtomWithDescription,
    createFounderAtom,
    findTriple,
    createTriple,
    createClaim,
    createClaimWithDescription,
    createClaimWithCategory,
    isReady,
  ]);
}

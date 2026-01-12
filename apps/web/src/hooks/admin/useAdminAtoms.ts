import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ATOMS_BY_LABELS, GET_ALL_TOTEM_CATEGORIES } from '../../lib/graphql/queries';

interface Atom {
  term_id: string;
  label: string;
  image?: string;
  emoji?: string;
  type?: string;
}

interface CategoryTriple {
  term_id: string;
  subject: { term_id: string; label: string };
  object: { term_id: string; label: string };
}

interface UseAdminAtomsProps {
  founderNames: string[];
  predicateLabels: string[];
  ofcAtomLabels: string[];
  totemLabels: string[];
}

export function useAdminAtoms({
  founderNames,
  predicateLabels,
  ofcAtomLabels,
  totemLabels,
}: UseAdminAtomsProps) {
  // Queries
  const {
    data: atomsData,
    loading: atomsLoading,
    error: atomsError,
    refetch: refetchAtoms,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: founderNames },
  });

  const {
    data: predicatesData,
    loading: predicatesLoading,
    refetch: refetchPredicates,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: predicateLabels },
  });

  const {
    data: ofcAtomsData,
    loading: ofcAtomsLoading,
    refetch: refetchOfcAtoms,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: ofcAtomLabels },
  });

  const {
    data: totemsData,
    loading: totemsLoading,
    refetch: refetchTotems,
  } = useQuery<{ atoms: Atom[] }>(GET_ATOMS_BY_LABELS, {
    variables: { labels: totemLabels },
  });

  const {
    data: categoryTriplesData,
    loading: categoryTriplesLoading,
    refetch: refetchCategoryTriples,
  } = useQuery<{ triples: CategoryTriple[] }>(GET_ALL_TOTEM_CATEGORIES);

  // Build Maps - memoized
  const totemCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryTriplesData?.triples.forEach((triple) =>
      map.set(triple.subject.label, triple.object.label)
    );
    return map;
  }, [categoryTriplesData]);

  const atomsByLabel = useMemo(() => {
    const map = new Map<string, Atom>();
    atomsData?.atoms.forEach((atom) => map.set(atom.label, atom));
    return map;
  }, [atomsData]);

  const predicatesByLabel = useMemo(() => {
    const map = new Map<string, Atom>();
    predicatesData?.atoms.forEach((atom) => map.set(atom.label, atom));
    return map;
  }, [predicatesData]);

  const ofcAtomsByLabel = useMemo(() => {
    const map = new Map<string, Atom>();
    ofcAtomsData?.atoms.forEach((atom) => map.set(atom.label, atom));
    return map;
  }, [ofcAtomsData]);

  const totemsByLabel = useMemo(() => {
    const map = new Map<string, Atom>();
    totemsData?.atoms.forEach((atom) => map.set(atom.label, atom));
    return map;
  }, [totemsData]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Maps
    atomsByLabel,
    predicatesByLabel,
    ofcAtomsByLabel,
    totemsByLabel,
    totemCategoryMap,
    // Loading states
    atomsLoading,
    predicatesLoading,
    ofcAtomsLoading,
    totemsLoading,
    categoryTriplesLoading,
    // Error
    atomsError,
    // Refetch functions
    refetchAtoms,
    refetchPredicates,
    refetchOfcAtoms,
    refetchTotems,
    refetchCategoryTriples,
  }), [
    atomsByLabel,
    predicatesByLabel,
    ofcAtomsByLabel,
    totemsByLabel,
    totemCategoryMap,
    atomsLoading,
    predicatesLoading,
    ofcAtomsLoading,
    totemsLoading,
    categoryTriplesLoading,
    atomsError,
    refetchAtoms,
    refetchPredicates,
    refetchOfcAtoms,
    refetchTotems,
    refetchCategoryTriples,
  ]);
}

export type { Atom };

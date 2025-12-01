import { useQuery } from '@apollo/client';
import { GET_ATOMS_BY_LABELS, GET_ALL_TOTEM_CATEGORIES } from '../lib/graphql/queries';

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

  // Build Maps
  const totemCategoryMap = new Map<string, string>();
  categoryTriplesData?.triples.forEach((triple) =>
    totemCategoryMap.set(triple.subject.label, triple.object.label)
  );

  const atomsByLabel = new Map<string, Atom>();
  atomsData?.atoms.forEach((atom) => atomsByLabel.set(atom.label, atom));

  const predicatesByLabel = new Map<string, Atom>();
  predicatesData?.atoms.forEach((atom) => predicatesByLabel.set(atom.label, atom));

  const ofcAtomsByLabel = new Map<string, Atom>();
  ofcAtomsData?.atoms.forEach((atom) => ofcAtomsByLabel.set(atom.label, atom));

  const totemsByLabel = new Map<string, Atom>();
  totemsData?.atoms.forEach((atom) => totemsByLabel.set(atom.label, atom));

  return {
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
  };
}

export type { Atom };

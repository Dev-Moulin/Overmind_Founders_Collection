import { useState, useCallback } from 'react';
import { useIntuition } from '../blockchain/useIntuition';

interface FounderData {
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter: string | null;
  linkedin?: string | null;
  github?: string | null;
  image?: string;
}

interface CategoriesConfig {
  predicate: { label: string };
  categories: Array<{ id: string; label: string }>;
}

interface UseAdminActionsProps {
  isAdmin: boolean;
  categoriesConfig: CategoriesConfig;
  refetchAtoms: () => Promise<unknown>;
  refetchPredicates: () => Promise<unknown>;
  refetchOfcAtoms: () => Promise<unknown>;
  refetchTotems: () => Promise<unknown>;
  refetchCategoryTriples: () => Promise<unknown>;
}

export function useAdminActions({
  isAdmin,
  categoriesConfig,
  refetchAtoms,
  refetchPredicates,
  refetchOfcAtoms,
  refetchTotems,
  refetchCategoryTriples,
}: UseAdminActionsProps) {
  const { createAtom, createFounderAtom, getOrCreateAtom, createTriple, isReady } = useIntuition();

  const [creatingItem, setCreatingItem] = useState<string | null>(null);
  const [createdItems, setCreatedItems] = useState<Map<string, { termId: string; txHash: string }>>(
    new Map()
  );
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateFounderAtom = useCallback(
    async (founder: FounderData) => {
      if (!isReady || !isAdmin) return;
      setCreatingItem(founder.name);
      setCreateError(null);
      try {
        const result = await createFounderAtom({
          name: founder.name,
          shortBio: founder.shortBio,
          fullBio: founder.fullBio,
          twitter: founder.twitter,
          linkedin: founder.linkedin,
          github: founder.github,
          image: founder.image,
        });
        setCreatedItems((prev) =>
          new Map(prev).set(founder.name, {
            termId: result.termId,
            txHash: result.transactionHash,
          })
        );
        await refetchAtoms();
      } catch (err) {
        setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création');
      } finally {
        setCreatingItem(null);
      }
    },
    [isReady, isAdmin, createFounderAtom, refetchAtoms]
  );

  const handleCreatePredicate = useCallback(
    async (label: string) => {
      if (!isReady || !isAdmin) return;
      setCreatingItem(label);
      setCreateError(null);
      try {
        const result = await createAtom(label);
        setCreatedItems((prev) =>
          new Map(prev).set(label, { termId: result.termId, txHash: result.transactionHash })
        );
        await refetchPredicates();
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : 'Erreur lors de la création du prédicat'
        );
      } finally {
        setCreatingItem(null);
      }
    },
    [isReady, isAdmin, createAtom, refetchPredicates]
  );

  const handleCreateTotem = useCallback(
    async (label: string, ofcCategoryId: string) => {
      console.log('[useAdminActions] ========== CREATE TOTEM START ==========');
      console.log('[useAdminActions] Creating totem:', { label, ofcCategoryId });

      if (!isReady || !isAdmin) {
        console.log('[useAdminActions] Not ready or not admin, aborting');
        return;
      }
      setCreatingItem(label);
      setCreateError(null);
      try {
        const category = categoriesConfig.categories.find((c) => c.id === ofcCategoryId);
        if (!category) throw new Error(`Catégorie OFC invalide: ${ofcCategoryId}`);
        console.log('[useAdminActions] Category found:', category);

        // Step 1: Create/get totem atom
        console.log('[useAdminActions] Step 1: getOrCreateAtom for totem:', label);
        const totemResult = await getOrCreateAtom(label);
        console.log('[useAdminActions] Totem atom result:', totemResult);

        // Step 2: Create/get "has category" predicate
        console.log('[useAdminActions] Step 2: getOrCreateAtom for predicate:', categoriesConfig.predicate.label);
        const predicateResult = await getOrCreateAtom(categoriesConfig.predicate.label);
        console.log('[useAdminActions] Predicate result:', predicateResult);

        // Step 3: Create/get category atom
        console.log('[useAdminActions] Step 3: getOrCreateAtom for category:', category.label);
        const categoryResult = await getOrCreateAtom(category.label);
        console.log('[useAdminActions] Category atom result:', categoryResult);

        // Step 4: Create triple [Totem] -> [has category] -> [Category]
        console.log('[useAdminActions] Step 4: createTriple');
        console.log('[useAdminActions] Triple structure:', {
          subject: `${label} (${totemResult.termId})`,
          predicate: `${categoriesConfig.predicate.label} (${predicateResult.termId})`,
          object: `${category.label} (${categoryResult.termId})`,
        });
        console.log('[useAdminActions] ⚠️ NOTE: This creates [Totem] -> [has category] -> [Category]');
        console.log('[useAdminActions] ⚠️ NOTE: This does NOT create [Founder] -> [has totem] -> [Totem]');
        console.log('[useAdminActions] ⚠️ NOTE: The founder-totem triple must be created by user when voting!');

        const tripleResult = await createTriple(
          totemResult.termId,
          predicateResult.termId,
          categoryResult.termId,
          '0.001'
        );
        console.log('[useAdminActions] Triple created:', tripleResult);

        setCreatedItems((prev) =>
          new Map(prev).set(label, {
            termId: totemResult.termId,
            txHash: tripleResult.transactionHash,
          })
        );
        console.log('[useAdminActions] ✅ Totem creation complete!');
        console.log('[useAdminActions] ========== CREATE TOTEM END ==========');
        await Promise.all([refetchTotems(), refetchCategoryTriples()]);
      } catch (err) {
        console.error('[useAdminActions] ❌ Error creating totem:', err);
        setCreateError(
          err instanceof Error ? err.message : "Erreur lors de la création de l'objet"
        );
      } finally {
        setCreatingItem(null);
      }
    },
    [
      isReady,
      isAdmin,
      categoriesConfig,
      getOrCreateAtom,
      createTriple,
      refetchTotems,
      refetchCategoryTriples,
    ]
  );

  const handleCreateOfcAtom = useCallback(
    async (label: string) => {
      if (!isReady || !isAdmin) return;
      setCreatingItem(label);
      setCreateError(null);
      try {
        const result = await createAtom(label);
        setCreatedItems((prev) =>
          new Map(prev).set(label, { termId: result.termId, txHash: result.transactionHash })
        );
        await refetchOfcAtoms();
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : "Erreur lors de la création de l'atom OFC"
        );
      } finally {
        setCreatingItem(null);
      }
    },
    [isReady, isAdmin, createAtom, refetchOfcAtoms]
  );

  return {
    creatingItem,
    createdItems,
    createError,
    handleCreateFounderAtom,
    handleCreatePredicate,
    handleCreateTotem,
    handleCreateOfcAtom,
  };
}

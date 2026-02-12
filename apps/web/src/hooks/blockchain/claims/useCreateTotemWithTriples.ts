/**
 * useCreateTotemWithTriples - Create new totem (atom + category triple) without deposit
 *
 * Ce hook gère la création d'un nouveau totem en deux étapes :
 * 1. Créer l'atom du totem (sans dépôt)
 * 2. Créer l'atom de la catégorie si nouvelle (sans dépôt)
 * 3. Créer le triple [Totem] → [has category] → [Category] avec assets = tripleBaseCost uniquement
 *
 * Le triple [Founder] → [predicate] → [Totem] sera créé plus tard lors du vote.
 *
 * OBJECTIF: Test de la séparation création/dépôt pour résoudre le bug counterTermId
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.9_REFACTORISATION_useBatchVote.md
 */

import { useState, useCallback } from 'react';
import type { Hex } from 'viem';
import { useIntuition } from '../useIntuition';
import { useBatchTriples } from '../batch/useBatchTriples';
import categoriesData from '../../../../../../packages/shared/src/data/categories.json';
import type { CategoryConfigType } from '../../../types/category';

const typedCategoriesConfig = categoriesData as CategoryConfigType;

/**
 * Input data for totem creation
 */
export interface TotemCreationInput {
  /** Totem name */
  name: string;
  /** Category name */
  category: string;
  /** Category termId if existing, null if new */
  categoryTermId: string | null;
  /** Whether this is a new category */
  isNewCategory: boolean;
  /** Optional image URL (IPFS or HTTP) */
  image?: string;
  /** Optional category image URL (for new categories) */
  categoryImage?: string;
}

/**
 * Result of totem creation
 */
export interface TotemCreationResult {
  /** Created totem atom ID */
  totemId: Hex;
  /** Totem name (for display/pre-fill) */
  totemName: string;
  /** Category atom ID (created or existing) */
  categoryId: Hex;
  /** Category name (for display) */
  categoryName: string;
  /** Triple termId for [Totem] → [has category] → [Category] */
  categoryTripleTermId?: Hex;
  /** Triple counterTermId */
  categoryTripleCounterTermId?: Hex;
  /** Whether totem atom was newly created */
  totemCreated: boolean;
  /** Whether category atom was newly created */
  categoryCreated: boolean;
  /** If totem already existed, user should be asked if they want to use it */
  totemAlreadyExisted: boolean;
}

/**
 * Current step in the creation process
 */
export type CreationStep =
  | 'idle'
  | 'creating_totem'
  | 'creating_category'
  | 'creating_triple'
  | 'success'
  | 'error';

/**
 * Hook result
 */
export interface UseCreateTotemWithTriplesResult {
  /** Create a new totem with its category triple */
  createTotem: (input: TotemCreationInput) => Promise<TotemCreationResult | null>;
  /** Current step */
  step: CreationStep;
  /** Error message if any */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook to create a new totem (atom + category triple) without deposit
 *
 * @example
 * ```tsx
 * function TotemCreator() {
 *   const { createTotem, step, error, isLoading } = useCreateTotemWithTriples();
 *
 *   const handleCreate = async () => {
 *     const result = await createTotem({
 *       name: 'MyTotem',
 *       category: 'Innovation',
 *       categoryTermId: '0x...',
 *       isNewCategory: false,
 *     });
 *     if (result) {
 *       console.log('Totem created:', result.totemId);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleCreate} disabled={isLoading}>
 *       {step === 'creating_totem' && 'Création du totem...'}
 *       {step === 'creating_category' && 'Création de la catégorie...'}
 *       {step === 'creating_triple' && 'Création de la relation...'}
 *       {step === 'idle' && 'Créer le totem'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreateTotemWithTriples(): UseCreateTotemWithTriplesResult {
  const { getOrCreateAtom, getOrCreateAtomWithImage, findAtomByLabel } = useIntuition();
  const { createBatch } = useBatchTriples();

  const [step, setStep] = useState<CreationStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
  }, []);

  const createTotem = useCallback(
    async (input: TotemCreationInput): Promise<TotemCreationResult | null> => {
      console.log('[useCreateTotemWithTriples] ========== START ==========');
      console.log('[useCreateTotemWithTriples] Input:', input);

      try {
        reset();

        // ====================================================================
        // STEP 1: Create totem atom
        // ====================================================================
        setStep('creating_totem');
        console.log('[useCreateTotemWithTriples] Step 1: Creating totem atom...');

        // Check if totem already exists
        const existingTotemId = await findAtomByLabel(input.name);
        let totemId: Hex;
        let totemCreated = false;
        let totemAlreadyExisted = false;

        if (existingTotemId) {
          console.log('[useCreateTotemWithTriples] Totem already exists:', existingTotemId);
          totemId = existingTotemId;
          totemAlreadyExisted = true;
        } else {
          // Create atom — with image uses Thing schema, without uses simple string
          const totemResult = await getOrCreateAtomWithImage(input.name, input.image);
          totemId = totemResult.termId;
          totemCreated = totemResult.created;
          console.log('[useCreateTotemWithTriples] Totem created:', totemId, input.image ? '(with image)' : '(string)');
        }

        // ====================================================================
        // STEP 2: Get or create category atom
        // ====================================================================
        setStep('creating_category');
        console.log('[useCreateTotemWithTriples] Step 2: Handling category...');

        let categoryId: Hex;
        let categoryCreated = false;

        if (input.categoryTermId) {
          // Use existing category
          categoryId = input.categoryTermId as Hex;
          console.log('[useCreateTotemWithTriples] Using existing category:', categoryId);
        } else {
          // Create new category atom — with image uses Thing schema
          const categoryResult = await getOrCreateAtomWithImage(input.category, input.categoryImage);
          categoryId = categoryResult.termId;
          categoryCreated = categoryResult.created;
          console.log('[useCreateTotemWithTriples] Category created/found:', categoryId, input.categoryImage ? '(with image)' : '(string)');
        }

        // ====================================================================
        // STEP 3: Create category triple [Totem] → [has category] → [Category]
        // ====================================================================
        setStep('creating_triple');
        console.log('[useCreateTotemWithTriples] Step 3: Creating category triple...');

        const categoryPredicateTermId = typedCategoriesConfig.predicate?.termId;
        if (!categoryPredicateTermId) {
          throw new Error('Category predicate termId not found in config');
        }

        let categoryTripleTermId: Hex | undefined;
        let categoryTripleCounterTermId: Hex | undefined;

        try {
          // Create triple with depositAmount: 0n (only pay base cost, no deposit)
          const tripleResult = await createBatch([
            {
              subjectId: totemId,
              predicateId: categoryPredicateTermId as Hex,
              objectId: categoryId,
              depositAmount: 0n, // <-- KEY: No deposit, only tripleBaseCost
            },
          ]);

          console.log('[useCreateTotemWithTriples] Triple created:', {
            txHash: tripleResult.transactionHash,
            termIds: tripleResult.tripleTermIds,
            counterTermIds: tripleResult.tripleCounterTermIds,
          });

          categoryTripleTermId = tripleResult.tripleTermIds[0];
          categoryTripleCounterTermId = tripleResult.tripleCounterTermIds[0];
        } catch (tripleError) {
          // Triple might already exist - that's OK
          const errorMessage = (tripleError as Error).message || '';
          if (errorMessage.includes('TripleExists') || errorMessage.includes('already exists')) {
            console.log('[useCreateTotemWithTriples] Triple already exists, continuing...');
          } else {
            throw tripleError;
          }
        }

        // ====================================================================
        // SUCCESS
        // ====================================================================
        setStep('success');

        const result: TotemCreationResult = {
          totemId,
          totemName: input.name,
          categoryId,
          categoryName: input.category,
          categoryTripleTermId,
          categoryTripleCounterTermId,
          totemCreated,
          categoryCreated,
          totemAlreadyExisted,
        };

        console.log('[useCreateTotemWithTriples] ========== SUCCESS ==========');
        console.log('[useCreateTotemWithTriples] Result:', result);

        return result;
      } catch (err) {
        console.error('[useCreateTotemWithTriples] Error:', err);
        setStep('error');

        const errorMessage = (err as Error).message || 'Une erreur est survenue';
        setError(errorMessage);

        return null;
      }
    },
    [getOrCreateAtom, getOrCreateAtomWithImage, findAtomByLabel, createBatch, reset]
  );

  return {
    createTotem,
    step,
    error,
    isLoading: step !== 'idle' && step !== 'success' && step !== 'error',
    reset,
  };
}

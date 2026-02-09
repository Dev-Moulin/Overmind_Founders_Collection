/**
 * useBatchVote - Batch Vote Execution (REFACTORED VERSION)
 *
 * VERSION REFACTORISÉE utilisant les modules extraits.
 * L'ancien code est conservé commenté pour référence.
 *
 * Hook pour exécuter un vote cart en batch transactions.
 * Orchestre le processus multi-étapes:
 * 0. createClaimWithCategory (pour nouveaux totems avec newTotemData)
 * 1. createTriples (pour nouvelles relations totem-founder sur totems existants)
 * 2. redeemBatch (si changement de position)
 * 3. depositBatch (pour triples existants)
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.9_REFACTORISATION_useBatchVote.md
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useApolloClient } from '@apollo/client';
import { type Hex, formatEther } from 'viem';
import { getMultiVaultAddressFromChainId } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../../config/wagmi';
import { toast } from 'sonner';
import { useIntuition } from '../useIntuition';
import { useBatchTriples } from './useBatchTriples';
import { GET_TRIPLE_BY_ATOMS } from '../../../lib/graphql/queries';

// NOUVEAU: Import des modules extraits
import {
  type VoteCart,
  type VoteCartItem,
  type VoteCartStatus,
  type VoteCartError,
  type ProcessableCartItem,
  type BatchVoteResult,
  type UseBatchVoteResult,
  isProcessableItem,
  BATCH_VOTE_CONSTANTS,
} from './types';

// Ré-export des types pour compatibilité avec l'API existante
export type { BatchVoteResult, UseBatchVoteResult };

import { executeCreateTriples } from './executeCreateTriples';
import { executeCreateNewTotems } from './executeCreateAtoms';
import { executeRedeems } from './executeRedeems';
import { executeDeposits } from './executeDeposits';
import { checkVaultInitialized, calculateTotalTransactions, deduplicateToTriples, categorizeTriples } from './utils';

/**
 * Hook pour exécuter les batch votes depuis un cart
 *
 * @example
 * ```tsx
 * function CartSubmit({ cart }) {
 *   const { executeBatch, status, error, isLoading, currentStep, totalSteps } = useBatchVote();
 *
 *   const handleSubmit = async () => {
 *     const result = await executeBatch(cart);
 *     if (result) {
 *       console.log('Batch executed:', result);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleSubmit} disabled={isLoading}>
 *       {isLoading ? `Étape ${currentStep}/${totalSteps}` : 'Valider le panier'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useBatchVote(): UseBatchVoteResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const apolloClient = useApolloClient();
  const { getOrCreateAtom } = useIntuition();
  const { createBatch: createTriplesBatch } = useBatchTriples();

  const [status, setStatus] = useState<VoteCartStatus>('idle');
  const [error, setError] = useState<VoteCartError | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);

  const stepCounterRef = useRef({ current: 0, total: 1 });

  const incrementStep = useCallback(() => {
    stepCounterRef.current.current++;
    setCurrentStep(stepCounterRef.current.current);
  }, []);

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setCurrentStep(0);
    setTotalSteps(1);
    stepCounterRef.current = { current: 0, total: 1 };
  }, []);

  /**
   * Vérifie si un triple existe déjà dans la blockchain
   */
  const checkTripleExists = useCallback(
    async (
      subjectId: Hex,
      predicateId: Hex,
      objectId: Hex
    ): Promise<{ exists: boolean; termId?: Hex; counterTermId?: Hex }> => {
      try {
        const { data } = await apolloClient.query<{
          triples: Array<{
            term_id: string;
            counter_term?: { id: string };
          }>;
        }>({
          query: GET_TRIPLE_BY_ATOMS,
          variables: { subjectId, predicateId, objectId },
          fetchPolicy: 'network-only',
        });

        if (data?.triples && data.triples.length > 0) {
          const triple = data.triples[0];
          return {
            exists: true,
            termId: triple.term_id as Hex,
            counterTermId: triple.counter_term?.id as Hex | undefined,
          };
        }
        return { exists: false };
      } catch (err) {
        console.warn('[useBatchVote] Error checking triple existence:', err);
        return { exists: false };
      }
    },
    [apolloClient]
  );

  /*
   * ============================================================================
   * ANCIEN CODE - executeCreateNewTotems (COMMENTÉ POUR RÉFÉRENCE)
   * ============================================================================
   *
   * Cette fonction a été extraite dans ./executeCreateAtoms.ts
   * Voir le nouveau fichier pour l'implémentation refactorisée.
   *
   * const executeCreateNewTotems = useCallback(
   *   async (
   *     founderId: Hex,
   *     itemsWithNewTotemData: VoteCartItem[]
   *   ): Promise<{ txHashes: Hex[]; createdCount: number }> => {
   *     // ... ~250 lignes de code original ...
   *   },
   *   [address, walletClient, publicClient, multiVaultAddress, getOrCreateAtom, createTriplesBatch]
   * );
   */

  /*
   * ============================================================================
   * ANCIEN CODE - executeCreateTriples (COMMENTÉ POUR RÉFÉRENCE)
   * ============================================================================
   *
   * Cette fonction a été extraite dans ./executeCreateTriples.ts
   * L'implémentation a été SIMPLIFIÉE basée sur les découvertes de 15.8:
   * - createTriples peut avoir assets=0
   * - counterTermId existe immédiatement après création
   * - On peut déposer directement sur counterTermId
   * - Progressive n'a pas besoin d'initialisation spéciale
   *
   * AVANT: Jusqu'à 5 transactions pour Progressive AGAINST
   * APRÈS: Maximum 2 transactions
   *
   * const executeCreateTriples = useCallback(
   *   async (
   *     founderId: Hex,
   *     itemsNeedingTriple: VoteCartItem[]
   *   ): Promise<{ txHash: Hex; createdTriples: Map<Hex, CreatedTripleInfo>; progressiveDepositTxHash?: Hex }> => {
   *     // ... ~970 lignes de code original ...
   *   },
   *   [address, walletClient, publicClient, multiVaultAddress]
   * );
   */

  /**
   * Exécute le processus complet de batch vote
   */
  const executeBatch = useCallback(
    async (cart: VoteCart): Promise<BatchVoteResult | null> => {
      if (!address) {
        setError({
          code: 'WALLET_NOT_CONNECTED',
          message: 'Veuillez connecter votre wallet',
          step: 'validating',
        });
        setStatus('error');
        toast.error('Veuillez connecter votre wallet');
        return null;
      }

      if (!walletClient || !publicClient) {
        setError({
          code: 'CLIENT_NOT_READY',
          message: 'Wallet client not ready',
          step: 'validating',
        });
        setStatus('error');
        toast.error('Wallet client not ready');
        return null;
      }

      if (!cart || cart.items.length === 0) {
        setError({
          code: 'EMPTY_CART',
          message: 'Le panier est vide',
          step: 'validating',
        });
        setStatus('error');
        toast.error('Le panier est vide');
        return null;
      }

      try {
        reset();

        console.log('[useBatchVote] ========== EXECUTE BATCH START ==========');
        console.log('[useBatchVote] Cart:', {
          founderName: cart.founderName,
          founderId: cart.founderId,
          itemCount: cart.items.length,
        });

        // Identifier les types d'items
        const itemsWithNewTotemData = cart.items.filter(
          item => item.newTotemData && item.totemId === null
        );

        // Vérifier l'existence des triples
        const verifiedItems: VoteCartItem[] = [];

        for (const item of cart.items) {
          if (item.newTotemData && item.totemId === null) {
            verifiedItems.push(item);
            continue;
          }

          if (item.totemId && item.isNewTotem) {
            const tripleCheck = await checkTripleExists(
              cart.founderId,
              item.predicateId,
              item.totemId
            );

            if (tripleCheck.exists && tripleCheck.termId) {
              verifiedItems.push({
                ...item,
                termId: tripleCheck.termId,
                counterTermId: tripleCheck.counterTermId || item.counterTermId,
                isNewTotem: false,
              });
              toast.info(`Triple "${item.totemName}" existe déjà - dépôt direct`);
            } else {
              verifiedItems.push(item);
            }
          } else {
            verifiedItems.push(item);
          }
        }

        // Filtrer les items processables
        const processableItems: ProcessableCartItem[] = verifiedItems.filter(isProcessableItem);
        const itemsNeedingTriple = processableItems.filter(item => item.isNewTotem);
        const itemsToRedeem = processableItems.filter(item => item.needsWithdraw);
        const itemsWithExistingTriples = processableItems.filter(item => !item.isNewTotem);

        const hasNewTotems = itemsWithNewTotemData.length > 0;
        const hasNewTriples = itemsNeedingTriple.length > 0;
        const hasRedeems = itemsToRedeem.length > 0;
        const hasExistingTriples = itemsWithExistingTriples.length > 0;

        // Déterminer si les nouveaux triples sont tous Linear FOR (1 tx vs 2 tx)
        let isLinearForOnly = false;
        if (hasNewTriples) {
          const uniqueTriples = deduplicateToTriples(cart.founderId, itemsNeedingTriple);
          const { linearOnlyTriples, progressiveOnlyTriples, mixedTriples } = categorizeTriples(uniqueTriples);

          // Linear FOR pur = tous les triples sont Linear ET tous les items sont FOR
          isLinearForOnly = progressiveOnlyTriples.length === 0 &&
            mixedTriples.length === 0 &&
            linearOnlyTriples.every(t => t.items.every(i => i.direction === 'for'));
        }

        // Compter les Oppose Progressive sur vaults non-initialisés
        let uninitializedProgressiveAgainstCount = 0;
        if (hasExistingTriples) {
          const progressiveAgainstItems = itemsWithExistingTriples.filter(
            item => item.curveId === 2 && item.direction === 'against'
          );

          // Vérifier l'état d'initialisation de chaque vault FOR Progressive
          for (const item of progressiveAgainstItems) {
            const isInitialized = await checkVaultInitialized(
              publicClient,
              multiVaultAddress,
              item.termId,
              BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID
            );
            if (!isInitialized) {
              uninitializedProgressiveAgainstCount++;
            }
          }
        }

        // Calculer le nombre total de transactions avec précision
        const steps = calculateTotalTransactions({
          hasNewTotems,
          hasNewTriples,
          hasRedeems,
          hasExistingTriples,
          isLinearForOnly,
          uninitializedProgressiveAgainstCount,
        });

        console.log('[useBatchVote] Transaction count calculation:', {
          hasNewTotems,
          hasNewTriples,
          hasRedeems,
          hasExistingTriples,
          isLinearForOnly,
          uninitializedProgressiveAgainstCount,
          totalSteps: steps,
        });

        setTotalSteps(steps);
        stepCounterRef.current = { current: 0, total: steps };

        console.log('[useBatchVote] Execution plan:', {
          hasNewTotems,
          hasNewTriples,
          hasRedeems,
          hasExistingTriples,
          totalSteps: steps,
        });

        let newTotemTxHashes: Hex[] | undefined;
        let createTriplesTxHash: Hex | undefined;
        let totalRedeemed = 0n;
        let triplesCreated = 0;
        let newTotemsCreated = 0;

        const updatedItems = [...verifiedItems];

        // Step 0: Créer les nouveaux totems (UTILISE LE MODULE EXTRAIT)
        if (hasNewTotems) {
          incrementStep();
          setStatus('creating_atoms');
          toast.info(`Étape ${stepCounterRef.current.current}/${steps}: Création des totems...`);

          const result = await executeCreateNewTotems({
            founderId: cart.founderId,
            items: itemsWithNewTotemData,
            address,
            walletClient,
            publicClient,
            multiVaultAddress,
            apolloClient,
            getOrCreateAtom,
            createTriplesBatch,
            onStepComplete: incrementStep,
          });

          newTotemTxHashes = result.txHashes;
          newTotemsCreated = result.createdCount;
          toast.success(`${result.createdCount} totem(s) créé(s) !`);
        }

        // Step 1: Créer les triples (UTILISE LE MODULE EXTRAIT - SIMPLIFIÉ!)
        if (hasNewTriples) {
          incrementStep();
          setStatus('creating_atoms');
          toast.info(`Étape ${stepCounterRef.current.current}/${steps}: Création des relations...`);

          const result = await executeCreateTriples({
            founderId: cart.founderId,
            items: itemsNeedingTriple,
            address,
            walletClient,
            publicClient,
            multiVaultAddress,
            apolloClient,
            checkTripleExists,
            onStepComplete: incrementStep,
          });

          createTriplesTxHash = result.txHash;
          triplesCreated = result.createdTriples.size;

          // Mettre à jour les items avec les termIds créés
          for (let i = 0; i < updatedItems.length; i++) {
            const item = updatedItems[i];
            if (item.isNewTotem && item.totemId !== null) {
              const tripleInfo = result.createdTriples.get(item.totemId);
              if (tripleInfo) {
                updatedItems[i] = {
                  ...item,
                  termId: tripleInfo.termId,
                  counterTermId: tripleInfo.counterTermId,
                  isNewTotem: false,
                };
              }
            }
          }

          toast.success(`${triplesCreated} relation(s) créée(s)!`);
        }

        // Step 2: Redeems (UTILISE LE MODULE EXTRAIT)
        let redeemTxHash: Hex | undefined;
        if (hasRedeems) {
          incrementStep();
          setStatus('withdrawing');
          toast.info(`Étape ${stepCounterRef.current.current}/${steps}: Retrait des positions...`);

          const result = await executeRedeems({
            items: itemsToRedeem,
            address,
            walletClient,
            publicClient,
            multiVaultAddress,
          });

          if (result) {
            redeemTxHash = result.txHash;
            totalRedeemed = result.totalRedeemed;
            toast.success(`Retrait de ${formatEther(totalRedeemed)} shares effectué!`);
          }
        }

        // Step 3: Deposits (UTILISE LE MODULE EXTRAIT)
        let depositTxHash: Hex | undefined;
        if (hasExistingTriples) {
          incrementStep();
          setStatus('depositing');
          toast.info(`Étape ${stepCounterRef.current.current}/${steps}: Dépôt des votes...`);

          // Récupérer les items à déposer
          const itemsToDeposit: ProcessableCartItem[] = updatedItems
            .filter(isProcessableItem)
            .filter(item => itemsWithExistingTriples.some(orig => orig.totemId === item.totemId));

          if (itemsToDeposit.length > 0) {
            const result = await executeDeposits({
              items: itemsToDeposit,
              address,
              walletClient,
              publicClient,
              multiVaultAddress,
              onStepComplete: incrementStep,
            });

            if (result) {
              depositTxHash = result.txHash;
              toast.success(`Dépôt de ${formatEther(result.totalDeposited)} TRUST effectué!`);
            }
          }
        }

        const totalDeposited = updatedItems.reduce((sum, item) => sum + item.amount, 0n);

        toast.success(
          `${updatedItems.length} vote(s) enregistré(s) pour ${formatEther(totalDeposited)} TRUST!`
        );

        setStatus('success');
        setError(null);

        return {
          newTotemTxHashes,
          createTriplesTxHash,
          redeemTxHash,
          depositTxHash,
          totalRedeemed,
          totalDeposited,
          triplesCreated,
          newTotemsCreated,
        };
      } catch (err: unknown) {
        console.error('[useBatchVote] Error:', err);

        let errorMessage = 'Une erreur inattendue est survenue';
        let errorCode = 'UNKNOWN_ERROR';

        const errWithMessage = err as { message?: string; shortMessage?: string };
        const fullMessage = errWithMessage.message || errWithMessage.shortMessage || '';

        if (fullMessage.includes('User rejected') || fullMessage.includes('user rejected')) {
          errorMessage = "Transaction rejetée par l'utilisateur";
          errorCode = 'USER_REJECTED';
        } else if (fullMessage.includes('insufficient funds')) {
          errorMessage = 'Balance TRUST insuffisante';
          errorCode = 'INSUFFICIENT_BALANCE';
        } else if (fullMessage.includes('HasCounterStake')) {
          errorMessage = 'Impossible de voter: position opposée existante.';
          errorCode = 'HAS_COUNTER_STAKE';
        } else if (fullMessage) {
          errorMessage = fullMessage;
        }

        setError({
          code: errorCode,
          message: errorMessage,
          step: status as VoteCartStatus,
        });
        setStatus('error');
        toast.error(errorMessage);

        return null;
      }
    },
    [
      address,
      walletClient,
      publicClient,
      reset,
      checkTripleExists,
      status,
      multiVaultAddress,
      getOrCreateAtom,
      createTriplesBatch,
    ]
  );

  const isLoading = useMemo(
    () => ['validating', 'withdrawing', 'creating_atoms', 'depositing'].includes(status),
    [status]
  );

  return useMemo(
    () => ({
      executeBatch,
      status,
      error,
      isLoading,
      reset,
      currentStep,
      totalSteps,
    }),
    [executeBatch, status, error, isLoading, reset, currentStep, totalSteps]
  );
}

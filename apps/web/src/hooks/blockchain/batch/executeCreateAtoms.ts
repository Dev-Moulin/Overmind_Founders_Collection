/**
 * executeCreateAtoms - Création de nouveaux totems (atoms)
 *
 * Ce module gère la création de nouveaux totems qui n'existent pas encore.
 * Pour chaque nouveau totem:
 * 1. Créer l'atom du totem (si nécessaire)
 * 2. Créer l'atom de la catégorie (si nouvelle catégorie)
 * 3. Créer les triples (totem-founder et totem-category) avec assets=0
 * 4. Attendre l'indexation GraphQL pour récupérer termId
 * 5. Déposer FOR sur termId avec la bonne courbe (Linear ou Progressive)
 *
 * RÈGLE DU PROTOCOLE INTUITION (Découverte 15.10):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Si tu CRÉES un triple → tu DOIS voter FOR (SUPPORT)
 * AGAINST n'est possible QUE sur des triples QUI EXISTENT DÉJÀ
 * Erreur: MultiVault_CannotDirectlyInitializeCounterTriple
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.10_DECOUVERTE_MAJEURE_Regle_Protocole.md
 */

import { type Hex, type Address, formatEther } from 'viem';
import type { PublicClient, WalletClient } from 'viem';
import type { ApolloClient } from '@apollo/client';
import { MultiVaultAbi } from '@0xintuition/protocol';
import type { VoteCartItem, TotemCreationData } from './types';
import { BATCH_VOTE_CONSTANTS } from './types';
import { getContractConfig, autoAdjustAmount, chunkBatchArrays, calculateMinSharesBatch } from './utils';
import type { BatchTripleItem } from './useBatchTriples';
import { waitForTripleIndexed } from './waitForIndexed';
import categoriesData from '../../../../../../packages/shared/src/data/categories.json';
import type { CategoryConfigType } from '../../../types/category';

const typedCategoriesConfig = categoriesData as CategoryConfigType;

/**
 * Paramètres pour executeCreateNewTotems
 */
export interface CreateNewTotemsParams {
  founderId: Hex;
  items: VoteCartItem[];
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apolloClient: ApolloClient<any>;
  getOrCreateAtom: (data: string) => Promise<{ termId: Hex; created: boolean }>;
  createTriplesBatch: (triples: BatchTripleItem[]) => Promise<{
    transactionHash: Hex;
    tripleCount: number;
    totalAmount: bigint;
    tripleTermIds?: Hex[];
  }>;
  onStepComplete?: () => void;
}

/**
 * Résultat de executeCreateNewTotems
 */
export interface CreateNewTotemsResult {
  txHashes: Hex[];
  createdCount: number;
}

/**
 * Crée de nouveaux totems (atoms + triples)
 *
 * OPTIMISÉ: Crée tous les triples en UNE seule transaction via createTriples batch
 * Pour chaque totem:
 * - Triple 1: [Founder] → [predicate] → [Totem] (vote principal)
 * - Triple 2: [Totem] → [has category] → [Category]
 */
export async function executeCreateNewTotems(
  params: CreateNewTotemsParams
): Promise<CreateNewTotemsResult> {
  const {
    founderId,
    items,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    apolloClient,
    getOrCreateAtom,
    createTriplesBatch,
    onStepComplete,
  } = params;

  console.log('[executeCreateAtoms] ========== START ==========');
  console.log('[executeCreateAtoms] Creating', items.length, 'brand new totems');

  const txHashes: Hex[] = [];
  const totemData: TotemCreationData[] = [];

  // RÈGLE PROTOCOLE: Tous les items pour nouveaux totems doivent être FOR
  // Filtrer les AGAINST (l'UI aurait dû les bloquer mais on sécurise ici)
  const againstItems = items.filter(item => item.direction === 'against');
  if (againstItems.length > 0) {
    console.warn('[executeCreateAtoms] ⚠️ AGAINST items detected on new totems - BLOCKED by protocol rule');
    console.warn('[executeCreateAtoms] The UI should prevent AGAINST on new totems');
    // On filtre pour ne garder que les FOR
  }

  // Filtrer pour ne garder que les FOR (respect règle protocole)
  const forOnlyItems = items.filter(item => item.direction === 'for');

  // Vérifier si des items veulent Progressive
  const progressiveItems = forOnlyItems.filter(item => item.curveId === 2);
  if (progressiveItems.length > 0) {
    console.log('[executeCreateAtoms] Progressive FOR items:', progressiveItems.length);
  }

  // ÉTAPE 1: Créer les atoms (totem + catégorie si nouvelle)
  console.log('[executeCreateAtoms] Step 1: Creating atoms for', forOnlyItems.length, 'FOR items...');

  for (const item of forOnlyItems) {
    if (!item.newTotemData) {
      console.warn('[executeCreateAtoms] Item missing newTotemData:', item.totemName);
      continue;
    }

    const { name, category, categoryTermId, isNewCategory } = item.newTotemData;

    // Créer l'atom de catégorie si nécessaire
    let resolvedCategoryTermId = categoryTermId;
    if (isNewCategory) {
      console.log('[executeCreateAtoms] Creating category atom:', category);
      const categoryResult = await getOrCreateAtom(category);
      resolvedCategoryTermId = categoryResult.termId;
    }

    // Créer l'atom du totem
    console.log('[executeCreateAtoms] Creating totem atom:', name);
    const totemResult = await getOrCreateAtom(name);

    totemData.push({
      totemId: totemResult.termId,
      categoryTermId: resolvedCategoryTermId,
      item,
    });
  }

  if (totemData.length === 0) {
    console.log('[executeCreateAtoms] No totems to create');
    return { txHashes, createdCount: 0 };
  }

  // Récupérer la config du contrat
  const config = await getContractConfig(publicClient, multiVaultAddress);

  // Auto-ajuster les montants
  for (const { item } of totemData) {
    const adjusted = autoAdjustAmount(item.amount, config.minRequiredAmount, item.newTotemData?.name || '');
    if (adjusted !== item.amount) {
      (item as { amount: bigint }).amount = adjusted;
    }
  }

  // ÉTAPE 2: Construire les triples pour le batch
  console.log('[executeCreateAtoms] Step 2: Building batch triples...');

  const batchTriples: BatchTripleItem[] = [];

  // Tracker les triples vote pour le polling et dépôt ultérieur
  const voteTripleData: {
    totemId: Hex;
    predicateId: Hex;
    item: VoteCartItem;
  }[] = [];

  for (const { totemId, categoryTermId, item } of totemData) {
    // SIMPLIFIÉ: Créer tous les triples avec depositAmount: 0
    // L'initialisation des vaults se fera après le polling selon la courbe

    // Triple 1: [Founder] → [predicate] → [Totem]
    batchTriples.push({
      subjectId: founderId,
      predicateId: item.predicateId,
      objectId: totemId,
      depositAmount: 0n, // Pas de dépôt lors de la création
    });

    // Tracker pour polling + dépôt
    voteTripleData.push({
      totemId,
      predicateId: item.predicateId,
      item,
    });

    console.log('[executeCreateAtoms] Triple vote (creation only):', {
      totem: item.newTotemData?.name,
      direction: item.direction,
      curveId: item.curveId,
      amount: formatEther(item.amount),
    });

    // Triple 2: [Totem] → [has category] → [Category]
    const categoryPredicateTermId = typedCategoriesConfig.predicate?.termId;
    if (categoryPredicateTermId && categoryTermId) {
      batchTriples.push({
        subjectId: totemId,
        predicateId: categoryPredicateTermId as Hex,
        objectId: categoryTermId as Hex,
        depositAmount: 0n, // Pas de dépôt sur le triple catégorie
      });
    }
  }

  // ÉTAPE 3: Exécuter le batch createTriples
  console.log('[executeCreateAtoms] Step 3: Creating triples batch...');

  const result = await createTriplesBatch(batchTriples);

  console.log('[executeCreateAtoms] Batch success:', {
    txHash: result.transactionHash,
    tripleCount: result.tripleCount,
    totalAmount: formatEther(result.totalAmount),
  });

  txHashes.push(result.transactionHash);
  onStepComplete?.();

  // ÉTAPE 4: Polling GraphQL pour récupérer termId et counterTermId
  console.log('[executeCreateAtoms] Step 4: Polling GraphQL for termId/counterTermId...');

  // Stocker les résultats du polling avec toutes les infos nécessaires
  const polledTriples: {
    termId: Hex;
    counterTermId: Hex;
    item: VoteCartItem;
  }[] = [];

  for (const { totemId, predicateId, item } of voteTripleData) {
    try {
      console.log(`[executeCreateAtoms] Polling for triple: ${item.totemName}...`);

      const indexedResult = await waitForTripleIndexed(
        apolloClient,
        founderId,
        predicateId,
        totemId,
        {
          interval: 2000,
          maxAttempts: 15,
          onAttempt: (attempt, max) => {
            console.log(`[executeCreateAtoms] Polling ${item.totemName}: ${attempt}/${max}...`);
          },
        }
      );

      polledTriples.push({
        termId: indexedResult.termId,
        counterTermId: indexedResult.counterTermId,
        item,
      });

      console.log('[executeCreateAtoms] Triple indexed:', {
        totem: item.totemName,
        direction: item.direction,
        curveId: item.curveId,
        termId: indexedResult.termId,
        counterTermId: indexedResult.counterTermId,
      });
    } catch (pollingError) {
      console.error(`[executeCreateAtoms] Polling failed for ${item.totemName}:`, pollingError);
      // Continuer avec les autres totems
    }
  }

  // NOTE: ÉTAPE 5 SUPPRIMÉE (16 janvier 2026)
  // Raison: Règle du protocole - AGAINST impossible sur nouveaux triples
  // L'ancienne logique "init FOR Progressive pour AGAINST" n'est plus nécessaire
  // Voir: 15.10_DECOUVERTE_MAJEURE_Regle_Protocole.md

  // ÉTAPE 5: Dépôts FOR sur termId
  if (polledTriples.length > 0) {
    console.log('[executeCreateAtoms] Step 5: FOR deposits on termIds...');

    const depositData: {
      termId: Hex;
      curveId: bigint;
      amount: bigint;
      totemName: string;
    }[] = [];

    for (const { termId, item } of polledTriples) {
      // Sécurité: ignorer les AGAINST (le protocole les bloquera de toute façon)
      if (item.direction === 'against') {
        console.warn('[executeCreateAtoms] ⚠️ Skipping AGAINST item (blocked by protocol):', item.totemName);
        continue;
      }

      // FOR = toujours termId (pas counterTermId)
      const curveId = item.curveId === 2
        ? BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID
        : BATCH_VOTE_CONSTANTS.LINEAR_CURVE_ID;

      depositData.push({
        termId,
        curveId,
        amount: item.amount,
        totemName: item.totemName,
      });
    }

    if (depositData.length === 0) {
      console.log('[executeCreateAtoms] No FOR deposits to make');
      return { txHashes, createdCount: totemData.length };
    }

    const depositTermIds = depositData.map(d => d.termId);
    const depositCurveIds = depositData.map(d => d.curveId);
    const depositAmounts = depositData.map(d => d.amount);

    for (const d of depositData) {
      console.log('[executeCreateAtoms] FOR deposit:', {
        totem: d.totemName,
        termId: d.termId,
        curveId: Number(d.curveId) === 2 ? 'Progressive' : 'Linear',
        amount: formatEther(d.amount),
      });
    }

    const minShares = await calculateMinSharesBatch(publicClient, multiVaultAddress, depositTermIds, depositCurveIds, depositAmounts);
    const chunks = chunkBatchArrays(depositTermIds, depositCurveIds, depositAmounts, minShares, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

    for (const chunk of chunks) {
      const chunkTotal = chunk.values.reduce((s, a) => s + a, 0n);
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: multiVaultAddress,
        abi: MultiVaultAbi,
        functionName: 'depositBatch',
        args: [address, chunk.termIds, chunk.curveIds, chunk.values, chunk.minValues],
        value: chunkTotal,
      });
      const depositTxHash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash: depositTxHash });
      txHashes.push(depositTxHash);
    }

    console.log('[executeCreateAtoms] FOR deposits SUCCESS!');
    onStepComplete?.();
  }

  console.log('[executeCreateAtoms] Created', totemData.length, 'new totems');
  console.log('[executeCreateAtoms] ========== END ==========');

  return { txHashes, createdCount: totemData.length };
}

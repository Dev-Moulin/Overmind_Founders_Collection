/**
 * executeCreateTriples - Création de triples pour le batch voting
 *
 * Ce module gère la création de triples (relations founder-totem) avec support pour:
 * - Linear FOR: 1 transaction (createTriples avec dépôt inclus)
 * - Progressive FOR: 2 transactions (createTriples + depositBatch Progressive)
 *
 * RÈGLE DU PROTOCOLE INTUITION (Découverte 15.10):
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Si tu CRÉES un triple → tu DOIS voter FOR (SUPPORT)
 * AGAINST n'est possible QUE sur des triples QUI EXISTENT DÉJÀ
 * Erreur: MultiVault_CannotDirectlyInitializeCounterTriple
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * IMPORTANT (Découverte 15.8):
 * - createTriples PEUT avoir assets[i] = 0 (création sans dépôt)
 * - counterTermId existe IMMÉDIATEMENT après création du triple
 * - Progressive n'a pas besoin d'initialisation spéciale (juste curveId=2)
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.10_DECOUVERTE_MAJEURE_Regle_Protocole.md
 */

import { type Hex, type Address, formatEther } from 'viem';
import type { PublicClient, WalletClient } from 'viem';
import type { ApolloClient } from '@apollo/client';
import { MultiVaultAbi } from '@0xintuition/protocol';
import { toast } from 'sonner';
import type {
  ProcessableCartItem,
  CreatedTripleInfo,
  ContractConfig,
  UniqueTriple,
} from './types';
import { isProcessableItem, BATCH_VOTE_CONSTANTS } from './types';
import {
  getContractConfig,
  autoAdjustAmount,
  deduplicateToTriples,
  categorizeTriples,
  parseTripleCreatedEvents,
  chunkBatchArrays,
  calculateMinSharesBatch,
} from './utils';
import { waitForTripleIndexed } from './waitForIndexed';
import type { VoteCartItem } from '../../../types/voteCart';

/**
 * Paramètres pour executeCreateTriples
 */
export interface CreateTriplesParams {
  founderId: Hex;
  items: VoteCartItem[];
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  /** Client Apollo pour le polling GraphQL (récupération des counterTermIds) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apolloClient: ApolloClient<any>;
  checkTripleExists: (
    subjectId: Hex,
    predicateId: Hex,
    objectId: Hex
  ) => Promise<{ exists: boolean; termId?: Hex; counterTermId?: Hex }>;
  onStepComplete?: () => void;
}

/**
 * Résultat de executeCreateTriples
 */
export interface CreateTriplesResult {
  txHash: Hex;
  createdTriples: Map<Hex, CreatedTripleInfo>;
  progressiveDepositTxHash?: Hex;
}

/**
 * Crée les triples pour les items du cart qui en ont besoin
 *
 * PROCESSUS SIMPLIFIÉ (basé sur découverte 15.8):
 * 1. Pour Linear FOR: createTriples avec assets = montant complet
 * 2. Pour tout le reste: createTriples avec assets = tripleBaseCost seulement (pas de dépôt user)
 * 3. Puis depositBatch sur la bonne termId/counterTermId avec la bonne courbe
 */
export async function executeCreateTriples(
  params: CreateTriplesParams
): Promise<CreateTriplesResult> {
  const {
    founderId,
    items,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    apolloClient,
    checkTripleExists,
    onStepComplete,
  } = params;

  // Filtrer les items processables (avec totemId valide)
  const processableItems = items.filter(isProcessableItem);

  console.log('[executeCreateTriples] ========== START ==========');
  console.log('[executeCreateTriples] Creating triples for', processableItems.length, 'items');
  console.log('[executeCreateTriples] Founder ID:', founderId);

  // Récupérer la config du contrat
  const config = await getContractConfig(publicClient, multiVaultAddress);

  // Auto-ajuster les montants proches du minimum
  for (const item of processableItems) {
    const adjustedAmount = autoAdjustAmount(item.amount, config.minRequiredAmount, item.totemName);
    if (adjustedAmount !== item.amount) {
      (item as { amount: bigint }).amount = adjustedAmount;
    }
  }

  // Valider que les montants couvrent le minimum
  validateAmounts(processableItems, config);

  // Dédupliquer en triples uniques
  const uniqueTriples = deduplicateToTriples(founderId, processableItems);

  // Catégoriser par type de courbe
  const { linearOnlyTriples, progressiveOnlyTriples, mixedTriples } = categorizeTriples(uniqueTriples);

  // RÈGLE PROTOCOLE: Tous les items pour nouveaux triples doivent être FOR
  // Filtrer les AGAINST (l'UI aurait dû les bloquer mais on sécurise ici)
  const againstItems = processableItems.filter(item => item.direction === 'against');
  if (againstItems.length > 0) {
    console.warn('[executeCreateTriples] ⚠️ AGAINST items detected on new triples - BLOCKED by protocol rule');
    console.warn('[executeCreateTriples] The UI should prevent AGAINST on new triples');
    // On ne les traite pas - le protocole les bloquera de toute façon
  }

  console.log('[executeCreateTriples] Breakdown:', {
    linearOnly: linearOnlyTriples.length,
    progressiveOnly: progressiveOnlyTriples.length,
    mixed: mixedTriples.length,
    blockedAgainst: againstItems.length,
  });

  // ÉTAPE 1: Créer tous les triples
  toast.info('Création des relations en cours...', { id: 'batch-create-triples' });

  const { txHash, createdTriples } = await createAllTriples({
    founderId,
    uniqueTriples,
    linearOnlyTriples,
    progressiveOnlyTriples,
    mixedTriples,
    config,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    apolloClient,
    checkTripleExists,
  });

  toast.success('Relations créées! Récupération des IDs...', { id: 'batch-create-triples' });

  onStepComplete?.();

  // ÉTAPE 2: Gérer les dépôts Progressive FOR
  // (Linear FOR est déjà inclus dans createTriples, pas besoin de dépôt séparé)
  let progressiveDepositTxHash: Hex | undefined;

  // Progressive FOR - deposit sur termId avec curveId=2
  // Filtrer pour ne garder que les FOR (AGAINST bloqué par règle protocole)
  const progressiveForItems = progressiveOnlyTriples
    .flatMap(t => t.items)
    .filter(item => item.direction === 'for');
  if (progressiveForItems.length > 0) {
    progressiveDepositTxHash = await handleProgressiveDeposits({
      items: progressiveForItems,
      createdTriples,
      config,
      address,
      walletClient,
      publicClient,
      multiVaultAddress,
      onStepComplete,
    });
  }

  // 2c: Mixed triples - chaque item FOR sur sa courbe
  // Filtrer les triples pour ne garder que les items FOR
  const mixedTriplesForOnly = mixedTriples.map(triple => ({
    ...triple,
    items: triple.items.filter(item => item.direction === 'for'),
  })).filter(triple => triple.items.length > 0);

  if (mixedTriplesForOnly.length > 0) {
    await handleMixedDeposits({
      triples: mixedTriplesForOnly,
      createdTriples,
      config,
      address,
      walletClient,
      publicClient,
      multiVaultAddress,
      onStepComplete,
    });
  }

  console.log('[executeCreateTriples] ========== END ==========');

  return { txHash, createdTriples, progressiveDepositTxHash };
}

/**
 * Valide que tous les montants couvrent le minimum requis
 */
function validateAmounts(items: ProcessableCartItem[], config: ContractConfig): void {
  for (const item of items) {
    if (item.amount < config.minRequiredAmount) {
      const missing = config.minRequiredAmount - item.amount;
      throw new Error(`"${item.totemName}" : il manque ${formatEther(missing)} TRUST`);
    }
  }
}

/**
 * Interface pour les paramètres de création de triples
 */
interface CreateAllTriplesParams {
  founderId: Hex;
  uniqueTriples: Map<string, UniqueTriple>;
  linearOnlyTriples: UniqueTriple[];
  progressiveOnlyTriples: UniqueTriple[];
  mixedTriples: UniqueTriple[];
  config: ContractConfig;
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apolloClient: ApolloClient<any>;
  checkTripleExists: (
    subjectId: Hex,
    predicateId: Hex,
    objectId: Hex
  ) => Promise<{ exists: boolean; termId?: Hex; counterTermId?: Hex }>;
}

/**
 * Crée tous les triples en une seule transaction
 *
 * STRATÉGIE (basée sur découverte 15.8):
 * - Linear FOR: assets = montant complet (dépôt inclus)
 * - Tout le reste: assets = 0 (juste les frais de création, pas de dépôt)
 */
async function createAllTriples(
  params: CreateAllTriplesParams
): Promise<{ txHash: Hex; createdTriples: Map<Hex, CreatedTripleInfo> }> {
  const {
    founderId,
    uniqueTriples,
    linearOnlyTriples,
    config,
    address: _address, // Non utilisé directement, walletClient.account est utilisé
    walletClient,
    publicClient,
    multiVaultAddress,
    apolloClient,
    checkTripleExists,
  } = params;

  // Ignorer _address et checkTripleExists pour éviter warnings
  void _address;
  void checkTripleExists;

  const subjectIds: Hex[] = [];
  const predicateIds: Hex[] = [];
  const objectIds: Hex[] = [];
  const assets: bigint[] = [];

  for (const triple of uniqueTriples.values()) {
    subjectIds.push(founderId);
    predicateIds.push(triple.predicateId);
    objectIds.push(triple.totemId);

    // Déterminer si c'est du Linear FOR pur (un seul item FOR sur courbe Linear)
    const isLinearForOnly = linearOnlyTriples.some(
      t => t.totemId === triple.totemId &&
        t.items.length === 1 &&
        t.items[0].direction === 'for'
    );

    if (isLinearForOnly) {
      // Linear FOR: dépôt complet dans createTriples (optimisation)
      const item = triple.items[0];
      assets.push(item.amount);

      console.log('[executeCreateTriples] Triple (Linear FOR - full deposit):', {
        totem: triple.totemName,
        amount: formatEther(item.amount),
      });
    } else {
      // Tous les autres cas: juste les frais de création
      // Les dépôts (y compris init FOR Progressive pour AGAINST) se font après
      assets.push(config.tripleBaseCost);

      console.log('[executeCreateTriples] Triple (deferred deposit):', {
        totem: triple.totemName,
        createCost: formatEther(config.tripleBaseCost),
        willDepositAfter: true,
      });
    }
  }

  const totalValue = assets.reduce((sum, a) => sum + a, 0n);

  console.log('[executeCreateTriples] Creating', uniqueTriples.size, 'triples, total value:', formatEther(totalValue));

  // Simuler et exécuter createTriples
  const { request } = await publicClient.simulateContract({
    account: walletClient.account,
    address: multiVaultAddress,
    abi: MultiVaultAbi,
    functionName: 'createTriples',
    args: [subjectIds, predicateIds, objectIds, assets],
    value: totalValue,
  });

  console.log('[executeCreateTriples] Simulation OK, sending to wallet...');
  const txHash = await walletClient.writeContract(request);

  // Attendre la confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status !== 'success') {
    throw new Error('createTriples transaction failed');
  }

  console.log('[executeCreateTriples] Transaction confirmed!');

  // Parser les événements TripleCreated
  const triplesFromLogs = parseTripleCreatedEvents(receipt.logs);

  console.log('[executeCreateTriples] Parsed', triplesFromLogs.length, 'TripleCreated events');

  // NOUVEAU: Utiliser le polling GraphQL pour récupérer les counterTermIds
  // Cela garantit qu'on a les bons IDs avant de faire les dépôts
  toast.info('Vérification blockchain en cours...', { id: 'batch-verify-triples' });

  const createdTriples = new Map<Hex, CreatedTripleInfo>();

  for (const tripleLog of triplesFromLogs) {
    try {
      console.log('[executeCreateTriples] Polling for triple:', {
        subject: tripleLog.subjectId,
        predicate: tripleLog.predicateId,
        object: tripleLog.objectId,
      });

      // Polling avec retry jusqu'à ce que le triple soit indexé avec counterTermId
      const indexedResult = await waitForTripleIndexed(
        apolloClient,
        tripleLog.subjectId,
        tripleLog.predicateId,
        tripleLog.objectId,
        {
          interval: 2000, // 2 secondes entre les tentatives
          maxAttempts: 15, // Maximum 30 secondes d'attente
          onAttempt: (attempt, max) => {
            console.log(`[executeCreateTriples] Polling attempt ${attempt}/${max}...`);
          },
        }
      );

      createdTriples.set(tripleLog.objectId, {
        termId: indexedResult.termId,
        counterTermId: indexedResult.counterTermId,
      });

      console.log('[executeCreateTriples] Triple indexed with counterTermId:', {
        objectId: tripleLog.objectId,
        termId: indexedResult.termId,
        counterTermId: indexedResult.counterTermId,
      });
    } catch (error) {
      console.error('[executeCreateTriples] Failed to get counterTermId for:', tripleLog.objectId, error);
      // Fallback: utiliser le termId du log, counterTermId vide
      createdTriples.set(tripleLog.objectId, {
        termId: tripleLog.termId,
        counterTermId: '0x0' as Hex,
      });
    }
  }

  toast.success('IDs récupérés! Préparation des dépôts...', { id: 'batch-verify-triples' });

  return { txHash, createdTriples };
}

// NOTE: handleLinearAgainstDeposits a été SUPPRIMÉE (16 janvier 2026)
// Raison: Règle du protocole - AGAINST impossible sur nouveaux triples
// Voir: 15.10_DECOUVERTE_MAJEURE_Regle_Protocole.md

/**
 * Gère les dépôts Progressive FOR
 *
 * SIMPLIFIÉ (Découverte 15.10):
 * - Cette fonction ne gère QUE les FOR car AGAINST sur nouveaux triples est IMPOSSIBLE
 * - Règle protocole: Si tu CRÉES → tu DOIS voter FOR
 */
interface HandleProgressiveParams {
  items: ProcessableCartItem[];
  createdTriples: Map<Hex, CreatedTripleInfo>;
  config: ContractConfig;
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  onStepComplete?: () => void;
}

async function handleProgressiveDeposits(params: HandleProgressiveParams): Promise<Hex | undefined> {
  const {
    items,
    createdTriples,
    config,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    onStepComplete,
  } = params;

  console.log('[executeCreateTriples] Handling', items.length, 'Progressive FOR deposits');

  // Construire les arrays pour depositBatch sur termId (FOR uniquement)
  const depositTermIds: Hex[] = [];
  const depositCurveIds: bigint[] = [];
  const depositAmounts: bigint[] = [];

  for (const item of items) {
    // Sécurité: ignorer les AGAINST (le protocole les bloquera de toute façon)
    if (item.direction === 'against') {
      console.warn('[executeCreateTriples] ⚠️ Skipping AGAINST item (blocked by protocol):', item.totemName);
      continue;
    }

    const tripleInfo = createdTriples.get(item.totemId);
    if (!tripleInfo) {
      console.warn('[executeCreateTriples] Missing tripleInfo for:', item.totemName);
      continue;
    }

    // FOR = termId
    const depositTermId = tripleInfo.termId;

    if (depositTermId === '0x0') {
      console.warn('[executeCreateTriples] Invalid termId for:', item.totemName);
      continue;
    }

    // Montant = montant user - frais de création
    const depositAmount = item.amount - config.tripleBaseCost;
    if (depositAmount <= 0n) continue;

    depositTermIds.push(depositTermId);
    depositCurveIds.push(BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID);
    depositAmounts.push(depositAmount);

    console.log('[executeCreateTriples] Progressive FOR deposit:', {
      totem: item.totemName,
      termId: depositTermId,
      amount: formatEther(depositAmount),
    });
  }

  if (depositTermIds.length === 0) return undefined;

  const minShares = await calculateMinSharesBatch(publicClient, multiVaultAddress, depositTermIds, depositCurveIds, depositAmounts);
  const chunks = chunkBatchArrays(depositTermIds, depositCurveIds, depositAmounts, minShares, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

  let lastTxHash: Hex = '0x0' as Hex;
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
    lastTxHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: lastTxHash });
  }

  console.log('[executeCreateTriples] Progressive FOR deposits SUCCESS!');
  onStepComplete?.();

  return lastTxHash;
}

/**
 * Gère les dépôts pour triples mixtes (Linear + Progressive sur même triple)
 *
 * SIMPLIFIÉ (Découverte 15.10):
 * - Cette fonction ne gère QUE les FOR car AGAINST sur nouveaux triples est IMPOSSIBLE
 * - Les items sont pré-filtrés avant l'appel mais on sécurise aussi ici
 */
interface HandleMixedParams {
  triples: UniqueTriple[];
  createdTriples: Map<Hex, CreatedTripleInfo>;
  config: ContractConfig;
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  onStepComplete?: () => void;
}

async function handleMixedDeposits(params: HandleMixedParams): Promise<void> {
  const {
    triples,
    createdTriples,
    config,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    onStepComplete,
  } = params;

  console.log('[executeCreateTriples] Handling mixed triples FOR:', triples.length);

  const depositTermIds: Hex[] = [];
  const depositCurveIds: bigint[] = [];
  const depositAmounts: bigint[] = [];

  for (const triple of triples) {
    const tripleInfo = createdTriples.get(triple.totemId);
    if (!tripleInfo) continue;

    for (const item of triple.items) {
      // Sécurité: ignorer les AGAINST (le protocole les bloquera de toute façon)
      if (item.direction === 'against') {
        console.warn('[executeCreateTriples] ⚠️ Skipping AGAINST item in mixed (blocked by protocol):', item.totemName);
        continue;
      }

      // FOR = termId
      const depositTermId = tripleInfo.termId;

      if (depositTermId === '0x0') continue;

      // Le premier dépôt déduit les frais de création, les suivants non
      const isFirstForThisTriple = depositTermIds.filter(
        (_, i) => depositTermIds[i] === tripleInfo.termId
      ).length === 0;

      const depositAmount = isFirstForThisTriple
        ? item.amount - config.tripleBaseCost
        : item.amount;

      if (depositAmount <= 0n) continue;

      depositTermIds.push(depositTermId);
      depositCurveIds.push(BigInt(item.curveId));
      depositAmounts.push(depositAmount);

      console.log('[executeCreateTriples] Mixed FOR deposit:', {
        totem: item.totemName,
        curve: item.curveId === 1 ? 'Linear' : 'Progressive',
        amount: formatEther(depositAmount),
      });
    }
  }

  if (depositTermIds.length === 0) return;

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
    const txHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  console.log('[executeCreateTriples] Mixed FOR deposits SUCCESS!');
  onStepComplete?.();
}

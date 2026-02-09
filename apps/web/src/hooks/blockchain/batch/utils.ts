/**
 * Fonctions utilitaires pour le batch voting
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.8_RECHERCHE_Transactions_Complete.md
 */

import { type Hex, type Address, formatEther, decodeEventLog } from 'viem';
import type { PublicClient } from 'viem';
import { MultiVaultAbi, multiCallIntuitionConfigs } from '@0xintuition/protocol';
import type { ContractConfig, ProcessableCartItem, UniqueTriple } from './types';
import { BATCH_VOTE_CONSTANTS } from './types';

/**
 * Récupère la configuration du contrat MultiVault
 */
export async function getContractConfig(
  publicClient: PublicClient,
  multiVaultAddress: Address
): Promise<ContractConfig> {
  const contractConfig = await multiCallIntuitionConfigs({
    publicClient,
    address: multiVaultAddress,
  });

  const tripleBaseCost = BigInt(contractConfig.triple_cost);
  const minDeposit = BigInt(contractConfig.min_deposit);
  const minRequiredAmount = tripleBaseCost + minDeposit;

  return {
    tripleBaseCost,
    minDeposit,
    minRequiredAmount,
  };
}

/**
 * Auto-ajuste les montants proches du minimum
 * (compense les arrondis d'affichage UI)
 */
export function autoAdjustAmount(
  amount: bigint,
  minRequiredAmount: bigint,
  itemName: string
): bigint {
  if (amount < minRequiredAmount) {
    const missing = minRequiredAmount - amount;
    if (missing <= BATCH_VOTE_CONSTANTS.TOLERANCE_WEI) {
      console.log('[batch/utils] Auto-adjusting amount for', itemName, ':', {
        original: formatEther(amount),
        adjusted: formatEther(minRequiredAmount),
        missing: formatEther(missing),
      });
      return minRequiredAmount;
    }
  }
  return amount;
}

/**
 * Déduplique les items du cart en triples uniques
 * Un triple est défini par (subject, predicate, object) - la courbe n'en fait pas partie
 */
export function deduplicateToTriples(
  _founderId: Hex, // Préfixé _ car utilisé seulement pour le logging conceptuel
  items: ProcessableCartItem[]
): Map<string, UniqueTriple> {
  const uniqueTriples = new Map<string, UniqueTriple>();

  for (const item of items) {
    // Clé par predicate+totem (le subject est toujours founderId)
    const tripleKey = `${item.predicateId}_${item.totemId}`;

    if (!uniqueTriples.has(tripleKey)) {
      uniqueTriples.set(tripleKey, {
        predicateId: item.predicateId,
        totemId: item.totemId,
        totemName: item.totemName,
        items: [item],
      });
    } else {
      // Même triple, courbe différente - ajouter au groupe
      uniqueTriples.get(tripleKey)!.items.push(item);
    }
  }

  console.log('[batch/utils] Deduplicated:', items.length, 'items →', uniqueTriples.size, 'unique triples');
  return uniqueTriples;
}

/**
 * Catégorise les triples uniques par type de courbe
 */
export function categorizeTriples(uniqueTriples: Map<string, UniqueTriple>): {
  linearOnlyTriples: UniqueTriple[];
  progressiveOnlyTriples: UniqueTriple[];
  mixedTriples: UniqueTriple[];
} {
  const linearOnlyTriples: UniqueTriple[] = [];
  const progressiveOnlyTriples: UniqueTriple[] = [];
  const mixedTriples: UniqueTriple[] = [];

  for (const triple of uniqueTriples.values()) {
    const hasLinear = triple.items.some(i => i.curveId === 1);
    const hasProgressive = triple.items.some(i => i.curveId === 2);

    if (hasLinear && hasProgressive) {
      mixedTriples.push(triple);
    } else if (hasProgressive) {
      progressiveOnlyTriples.push(triple);
    } else {
      linearOnlyTriples.push(triple);
    }
  }

  return { linearOnlyTriples, progressiveOnlyTriples, mixedTriples };
}

/**
 * Parse les événements TripleCreated depuis les logs d'une transaction
 */
export function parseTripleCreatedEvents(logs: readonly { data: Hex; topics: readonly Hex[] }[]): Array<{
  termId: Hex;
  objectId: Hex;
  subjectId: Hex;
  predicateId: Hex;
}> {
  const triplesFromLogs: Array<{
    termId: Hex;
    objectId: Hex;
    subjectId: Hex;
    predicateId: Hex;
  }> = [];

  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: MultiVaultAbi,
        data: log.data,
        topics: [...log.topics] as [Hex, ...Hex[]],
      });

      if (decoded.eventName === 'TripleCreated') {
        const args = decoded.args as unknown as {
          termId: Hex;
          subjectId: Hex;
          predicateId: Hex;
          objectId: Hex;
        };

        triplesFromLogs.push({
          termId: args.termId,
          objectId: args.objectId,
          subjectId: args.subjectId,
          predicateId: args.predicateId,
        });
      }
    } catch {
      // Pas un événement TripleCreated, ignorer
    }
  }

  return triplesFromLogs;
}

/**
 * Parse les événements Deposited pour extraire les shares
 */
export function parseDepositedShares(logs: readonly { data: Hex; topics: readonly Hex[] }[]): bigint {
  for (const log of logs) {
    try {
      const decoded = decodeEventLog({
        abi: MultiVaultAbi,
        data: log.data,
        topics: [...log.topics] as [Hex, ...Hex[]],
      });

      if (decoded.eventName === 'Deposited') {
        const args = decoded.args as { shares?: bigint };
        if (args.shares) {
          return args.shares;
        }
      }
    } catch {
      // Ignorer
    }
  }
  return 0n;
}

/**
 * Récupère les shares d'une position
 */
export async function getPositionShares(
  publicClient: PublicClient,
  multiVaultAddress: Address,
  userAddress: Address,
  termId: Hex,
  curveId: bigint
): Promise<bigint> {
  return publicClient.readContract({
    address: multiVaultAddress,
    abi: MultiVaultAbi,
    functionName: 'getShares',
    args: [userAddress, termId, curveId],
  }) as Promise<bigint>;
}

/**
 * Attend l'indexation GraphQL
 */
export function waitForGraphQLIndexing(): Promise<void> {
  console.log('[batch/utils] Waiting for GraphQL indexing...');
  return new Promise(resolve =>
    setTimeout(resolve, BATCH_VOTE_CONSTANTS.GRAPHQL_INDEXING_DELAY)
  );
}

/**
 * Calcule le montant effectif de dépôt (après déduction des frais de création)
 */
export function calculateEffectiveDeposit(amount: bigint, tripleBaseCost: bigint): bigint {
  return amount > tripleBaseCost ? amount - tripleBaseCost : 0n;
}

/**
 * Log structuré pour les items de dépôt/retrait
 */
export function logBatchItems(
  prefix: string,
  items: Array<{ termId: Hex; curveId: bigint; amount?: bigint; shares?: bigint }>
): void {
  console.log(`[${prefix}] Items:`, items.map((item, i) => ({
    index: i,
    termId: item.termId,
    curveId: item.curveId.toString(),
    ...(item.amount !== undefined ? { amount: formatEther(item.amount) } : {}),
    ...(item.shares !== undefined ? { shares: formatEther(item.shares) } : {}),
  })));
}

/**
 * Vérifie si un vault Progressive est initialisé (totalShares > 0)
 *
 * INTUITION Protocol Rule:
 * - Oppose Progressive nécessite que le vault FOR Progressive soit initialisé
 * - Un vault est initialisé si totalShares > 0 (ghost shares persistent après redeem)
 *
 * @returns true si le vault est initialisé, false sinon
 */
export async function checkVaultInitialized(
  publicClient: PublicClient,
  multiVaultAddress: Address,
  termId: Hex,
  curveId: bigint
): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: multiVaultAddress,
      abi: MultiVaultAbi,
      functionName: 'getVault',
      args: [termId, curveId],
    }) as [bigint, bigint]; // [totalAssets, totalShares]

    const totalShares = result[1];
    return totalShares > 0n;
  } catch (error) {
    console.warn('[batch/utils] Error checking vault init status:', error);
    return false;
  }
}

/**
 * Calcule le nombre total de transactions nécessaires pour un batch vote
 *
 * Prend en compte:
 * - Nouveaux totems: 2 tx (createAtoms + createTriples)
 * - Nouveaux triples Linear FOR pur: 1 tx (dépôt inclus dans createTriples)
 * - Nouveaux triples Progressive/mixte: 2 tx (createTriples + depositBatch)
 * - Redeems: 1 tx
 * - Oppose Progressive sur vault non-initialisé: 3 tx (init + redeem + deposit)
 * - Autres dépôts existants: 1 tx
 */
export interface TransactionCountParams {
  hasNewTotems: boolean;
  hasNewTriples: boolean;
  hasRedeems: boolean;
  hasExistingTriples: boolean;
  /** Nouveaux triples: tous les items sont Linear FOR? */
  isLinearForOnly: boolean;
  /** Nombre de Progressive AGAINST sur vaults non-initialisés */
  uninitializedProgressiveAgainstCount: number;
}

export function calculateTotalTransactions(params: TransactionCountParams): number {
  const {
    hasNewTotems,
    hasNewTriples,
    hasRedeems,
    hasExistingTriples,
    isLinearForOnly,
    uninitializedProgressiveAgainstCount,
  } = params;

  let steps = 0;

  // Nouveaux totems: 2 tx (createAtoms + createTriples avec dépôt)
  if (hasNewTotems) {
    steps += 2;
  }

  // Nouveaux triples
  if (hasNewTriples) {
    if (isLinearForOnly) {
      // Linear FOR pur: dépôt inclus dans createTriples = 1 tx
      steps += 1;
    } else {
      // Progressive ou mixte: createTriples + depositBatch = 2 tx
      steps += 2;
    }
  }

  // Redeems (changement de position)
  if (hasRedeems) {
    steps += 1;
  }

  // Dépôts sur triples existants
  if (hasExistingTriples) {
    if (uninitializedProgressiveAgainstCount > 0) {
      // Oppose Progressive sur vault non-initialisé: 3 tx (init + redeem + deposit)
      steps += 3;
    } else {
      // Dépôt normal: 1 tx
      steps += 1;
    }
  }

  // Au minimum 1 étape
  return Math.max(1, steps);
}

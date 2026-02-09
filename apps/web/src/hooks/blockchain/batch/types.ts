/**
 * Types pour le système de batch vote
 *
 * Ce fichier contient toutes les interfaces et types utilisés
 * par le système de batch voting (création de triples, deposits, redeems).
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.8_RECHERCHE_Transactions_Complete.md
 */

import type { Hex, Address, PublicClient, WalletClient } from 'viem';
import type {
  VoteCart,
  VoteCartItem,
  VoteCartStatus,
  VoteCartError,
} from '../../../types/voteCart';

// Re-export les types du cart pour simplifier les imports
export type { VoteCart, VoteCartItem, VoteCartStatus, VoteCartError };

/**
 * VoteCartItem avec tous les IDs résolus (prêt pour batch processing)
 * Les items avec newTotemData ont besoin de création d'atom d'abord
 */
export interface ProcessableCartItem extends Omit<VoteCartItem, 'totemId' | 'termId' | 'counterTermId'> {
  totemId: Hex;
  termId: Hex;
  counterTermId: Hex;
}

/**
 * Type guard pour vérifier si un cart item a tous les IDs requis
 */
export function isProcessableItem(item: VoteCartItem): item is ProcessableCartItem {
  return item.totemId !== null && item.termId !== null && item.counterTermId !== null;
}

/**
 * Résultat de l'exécution du batch vote
 */
export interface BatchVoteResult {
  /** Hash de transaction pour création de nouveaux totems (via createClaimWithCategory) */
  newTotemTxHashes?: Hex[];
  /** Hash de transaction createTriples (si nouveaux totems) - inclut le dépôt */
  createTriplesTxHash?: Hex;
  /** Hash de transaction redeem (si des retraits) */
  redeemTxHash?: Hex;
  /** Hash de transaction deposit (seulement pour triples existants) */
  depositTxHash?: Hex;
  /** Total des shares retirées */
  totalRedeemed: bigint;
  /** Total des assets déposés */
  totalDeposited: bigint;
  /** Nombre de triples créés */
  triplesCreated: number;
  /** Nombre de nouveaux totems créés */
  newTotemsCreated: number;
}

/**
 * Info sur un triple créé (extraite des logs de transaction)
 */
export interface CreatedTripleInfo {
  termId: Hex;
  counterTermId: Hex;
}

/**
 * Résultat du hook useBatchVote
 */
export interface UseBatchVoteResult {
  /** Exécute le batch vote depuis le cart */
  executeBatch: (cart: VoteCart) => Promise<BatchVoteResult | null>;
  /** Status actuel de l'exécution */
  status: VoteCartStatus;
  /** Erreur si présente */
  error: VoteCartError | null;
  /** En cours d'exécution */
  isLoading: boolean;
  /** Reset le state */
  reset: () => void;
  /** Étape actuelle pour l'affichage de progression */
  currentStep: number;
  /** Nombre total d'étapes */
  totalSteps: number;
}

/**
 * Configuration du contrat MultiVault
 */
export interface ContractConfig {
  tripleBaseCost: bigint;
  minDeposit: bigint;
  minRequiredAmount: bigint; // tripleBaseCost + minDeposit
}

/**
 * Configuration pour les fonctions d'exécution
 */
export interface ExecutionConfig {
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
}

/**
 * Triple unique (dédupliqué par subject/predicate/object)
 * Un même triple peut avoir plusieurs items du cart (courbes différentes)
 */
export interface UniqueTriple {
  predicateId: Hex;
  totemId: Hex;
  totemName: string;
  items: ProcessableCartItem[]; // Tous les items du cart pour ce triple
}

/**
 * Info sur un dépôt Progressive
 */
export interface ProgressiveDepositInfo {
  termId: Hex;
  amount: bigint;
  direction: 'for' | 'against';
}

/**
 * Info sur un redeem Progressive
 */
export interface ProgressiveRedeemInfo {
  termId: Hex; // Note: c'est temporairement le totemId avant résolution
  shares: bigint;
}

/**
 * Dépôt post-création (pour triples mixtes)
 */
export interface PostCreationDeposit {
  totemId: Hex;
  curveId: number;
  amount: bigint;
  direction: 'for' | 'against';
}

/**
 * Données d'un totem en cours de création
 */
export interface TotemCreationData {
  totemId: Hex;
  categoryTermId: string | null;
  item: VoteCartItem;
}

/**
 * Info sur un dépôt Progressive AGAINST (nécessite 3 étapes)
 */
export interface ProgressiveAgainstDeposit {
  totemId: Hex;
  termId: Hex;
  counterTermId: Hex;
  amount: bigint;
}

/**
 * Constantes pour le batch voting
 */
export const BATCH_VOTE_CONSTANTS = {
  /** Tolérance pour auto-ajustement des montants (1 gwei) */
  TOLERANCE_WEI: 1_000_000_000n,
  /** CurveId pour Linear */
  LINEAR_CURVE_ID: 1n,
  /** CurveId pour Progressive */
  PROGRESSIVE_CURVE_ID: 2n,
  /** Délai d'attente pour l'indexation GraphQL (ms) */
  GRAPHQL_INDEXING_DELAY: 3000,
  /** Taille max d'un batch pour éviter le revert gas limit du contrat */
  MAX_BATCH_SIZE: 150,
  /** Slippage par défaut en basis points (200 = 2%) */
  DEFAULT_SLIPPAGE_BPS: 200,
  /** Dénominateur pour les basis points */
  BPS_DENOMINATOR: 10_000n,
} as const;

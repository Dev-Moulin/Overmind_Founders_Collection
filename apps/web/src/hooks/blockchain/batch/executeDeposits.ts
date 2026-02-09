/**
 * executeDeposits - Dépôts sur triples existants
 *
 * Ce module gère les dépôts sur des triples qui existent déjà.
 * Supporte Linear et Progressive, FOR et AGAINST.
 *
 * IMPORTANT (Découverte 15.8):
 * - Progressive AGAINST peut nécessiter une initialisation du vault FOR d'abord
 * - Ceci est géré automatiquement via try-catch sur CannotDirectlyInitializeCounterTriple
 *
 * @see Documentation: Claude/00_GESTION_PROJET/Projet_02_SDK_V2/Phase_18_Positions_UX/15.8_RECHERCHE_Transactions_Complete.md
 */

import { type Hex, type Address, formatEther } from 'viem';
import type { PublicClient, WalletClient } from 'viem';
import { MultiVaultAbi } from '@0xintuition/protocol';
import type { ProcessableCartItem, ContractConfig } from './types';
import { BATCH_VOTE_CONSTANTS } from './types';
import {
  getContractConfig,
  getPositionShares,
  chunkBatchArrays,
  calculateMinSharesBatch,
  calculateMinAssetsBatch,
} from './utils';

/**
 * Paramètres pour executeDeposits
 */
export interface DepositsParams {
  items: ProcessableCartItem[];
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  onStepComplete?: () => void;
}

/**
 * Résultat de executeDeposits
 */
export interface DepositsResult {
  txHash: Hex;
  totalDeposited: bigint;
}

/**
 * Exécute les dépôts sur des triples existants
 *
 * Gère automatiquement:
 * - Linear FOR/AGAINST
 * - Progressive FOR/AGAINST
 * - Initialisation des vaults Progressive si nécessaire
 */
export async function executeDeposits(params: DepositsParams): Promise<DepositsResult | null> {
  const {
    items,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    onStepComplete,
  } = params;

  console.log('[executeDeposits] ========== START ==========');
  console.log('[executeDeposits] Depositing on', items.length, 'existing triples');

  if (items.length === 0) {
    console.log('[executeDeposits] No items to deposit');
    return null;
  }

  // Récupérer la config du contrat
  const config = await getContractConfig(publicClient, multiVaultAddress);

  // Séparer les items par type
  const progressiveAgainstItems = items.filter(
    item => item.curveId === 2 && item.direction === 'against'
  );
  const linearAgainstItems = items.filter(
    item => item.curveId === 1 && item.direction === 'against'
  );
  const otherItems = items.filter(
    item => !(item.curveId === 2 && item.direction === 'against') &&
            !(item.curveId === 1 && item.direction === 'against')
  );

  console.log('[executeDeposits] Item breakdown:', {
    progressiveAgainst: progressiveAgainstItems.length,
    linearAgainst: linearAgainstItems.length,
    other: otherItems.length,
  });

  // Gérer les positions FOR bloquantes pour Linear AGAINST
  if (linearAgainstItems.length > 0) {
    await handleBlockingLinearFor({
      items: linearAgainstItems,
      address,
      walletClient,
      publicClient,
      multiVaultAddress,
      onStepComplete,
    });
  }

  // Gérer les positions FOR bloquantes pour Progressive AGAINST
  if (progressiveAgainstItems.length > 0) {
    await handleBlockingProgressiveFor({
      items: progressiveAgainstItems,
      address,
      walletClient,
      publicClient,
      multiVaultAddress,
      onStepComplete,
    });
  }

  // Construire les arrays pour depositBatch
  const depositTermIds: Hex[] = [];
  const depositCurveIds: bigint[] = [];
  const depositAmounts: bigint[] = [];

  for (const item of items) {
    const depositTermId = item.direction === 'for' ? item.termId : item.counterTermId;
    depositTermIds.push(depositTermId);
    depositCurveIds.push(BigInt(item.curveId));
    depositAmounts.push(item.amount);
  }

  const totalDeposit = depositAmounts.reduce((sum, a) => sum + a, 0n);

  console.log('[executeDeposits] Total deposit:', formatEther(totalDeposit));

  // Tenter le dépôt avec gestion de CannotDirectlyInitializeCounterTriple
  const txHash = await executeDepositWithRetry({
    depositTermIds,
    depositCurveIds,
    depositAmounts,
    progressiveAgainstItems,
    config,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    onStepComplete,
  });

  console.log('[executeDeposits] SUCCESS! Hash:', txHash);
  console.log('[executeDeposits] ========== END ==========');

  return { txHash, totalDeposited: totalDeposit };
}

/**
 * Gère les positions FOR bloquantes pour Linear AGAINST
 */
interface HandleBlockingParams {
  items: ProcessableCartItem[];
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  onStepComplete?: () => void;
}

async function handleBlockingLinearFor(params: HandleBlockingParams): Promise<void> {
  const { items, address, walletClient, publicClient, multiVaultAddress, onStepComplete } = params;

  console.log('[executeDeposits] Checking blocking Linear FOR positions...');

  const positionsToRedeem: { termId: Hex; shares: bigint }[] = [];

  for (const item of items) {
    const forShares = await getPositionShares(
      publicClient,
      multiVaultAddress,
      address,
      item.termId,
      BATCH_VOTE_CONSTANTS.LINEAR_CURVE_ID
    );

    if (forShares > 0n) {
      positionsToRedeem.push({ termId: item.termId, shares: forShares });
    }
  }

  if (positionsToRedeem.length === 0) return;

  console.log('[executeDeposits] Redeeming', positionsToRedeem.length, 'blocking Linear FOR');

  const redeemTermIds = positionsToRedeem.map(p => p.termId);
  const redeemCurveIds = positionsToRedeem.map(() => BATCH_VOTE_CONSTANTS.LINEAR_CURVE_ID);
  const redeemSharesArr = positionsToRedeem.map(p => p.shares);
  const minAssets = await calculateMinAssetsBatch(publicClient, multiVaultAddress, redeemTermIds, redeemCurveIds, redeemSharesArr);
  const chunks = chunkBatchArrays(redeemTermIds, redeemCurveIds, redeemSharesArr, minAssets, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

  for (const chunk of chunks) {
    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: multiVaultAddress,
      abi: MultiVaultAbi,
      functionName: 'redeemBatch',
      args: [address, chunk.termIds, chunk.curveIds, chunk.values, chunk.minValues],
    });
    const txHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  console.log('[executeDeposits] Blocking Linear FOR redeemed!');
  onStepComplete?.();
}

async function handleBlockingProgressiveFor(params: HandleBlockingParams): Promise<void> {
  const { items, address, walletClient, publicClient, multiVaultAddress, onStepComplete } = params;

  console.log('[executeDeposits] Checking blocking Progressive FOR positions...');

  const positionsToRedeem: { termId: Hex; shares: bigint }[] = [];

  for (const item of items) {
    const forShares = await getPositionShares(
      publicClient,
      multiVaultAddress,
      address,
      item.termId,
      BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID
    );

    if (forShares > 0n) {
      positionsToRedeem.push({ termId: item.termId, shares: forShares });
    }
  }

  if (positionsToRedeem.length === 0) return;

  console.log('[executeDeposits] Redeeming', positionsToRedeem.length, 'blocking Progressive FOR');

  const redeemTermIds = positionsToRedeem.map(p => p.termId);
  const redeemCurveIds = positionsToRedeem.map(() => BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID);
  const redeemSharesArr = positionsToRedeem.map(p => p.shares);
  const minAssets = await calculateMinAssetsBatch(publicClient, multiVaultAddress, redeemTermIds, redeemCurveIds, redeemSharesArr);
  const chunks = chunkBatchArrays(redeemTermIds, redeemCurveIds, redeemSharesArr, minAssets, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

  for (const chunk of chunks) {
    const { request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: multiVaultAddress,
      abi: MultiVaultAbi,
      functionName: 'redeemBatch',
      args: [address, chunk.termIds, chunk.curveIds, chunk.values, chunk.minValues],
    });
    const txHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  console.log('[executeDeposits] Blocking Progressive FOR redeemed!');
  onStepComplete?.();
}

/**
 * Exécute le dépôt avec retry si CannotDirectlyInitializeCounterTriple
 */
interface ExecuteDepositWithRetryParams {
  depositTermIds: Hex[];
  depositCurveIds: bigint[];
  depositAmounts: bigint[];
  progressiveAgainstItems: ProcessableCartItem[];
  config: ContractConfig;
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
  multiVaultAddress: Address;
  onStepComplete?: () => void;
}

async function executeDepositWithRetry(params: ExecuteDepositWithRetryParams): Promise<Hex> {
  const {
    depositTermIds,
    depositCurveIds,
    depositAmounts,
    progressiveAgainstItems,
    config,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    onStepComplete,
  } = params;

  try {
    console.log('[executeDeposits] Attempting deposit simulation...');

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

      console.log('[executeDeposits] Simulation OK, executing...');
      lastTxHash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash: lastTxHash });
    }
    onStepComplete?.();

    return lastTxHash;
  } catch (error: unknown) {
    const errorMessage = (error as { message?: string })?.message || '';

    // Gérer CannotDirectlyInitializeCounterTriple
    if (errorMessage.includes('CannotDirectlyInitializeCounterTriple')) {
      console.log('[executeDeposits] Vault not initialized, initializing...');

      return await initializeAndRetryDeposit({
        depositTermIds,
        depositCurveIds,
        depositAmounts,
        progressiveAgainstItems,
        config,
        address,
        walletClient,
        publicClient,
        multiVaultAddress,
        onStepComplete,
      });
    }

    throw error;
  }
}

/**
 * Initialise les vaults Progressive FOR et réessaie le dépôt
 */
async function initializeAndRetryDeposit(
  params: ExecuteDepositWithRetryParams
): Promise<Hex> {
  const {
    depositTermIds,
    depositCurveIds,
    depositAmounts,
    progressiveAgainstItems,
    config,
    address,
    walletClient,
    publicClient,
    multiVaultAddress,
    onStepComplete,
  } = params;

  // Étape 1: Initialiser les vaults Progressive FOR
  const initTermIds = progressiveAgainstItems.map(item => item.termId);
  const initCurveIds = initTermIds.map(() => BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID);
  const initAmounts = progressiveAgainstItems.map(() => config.minDeposit);

  console.log('[executeDeposits] Initializing', initTermIds.length, 'Progressive FOR vaults');

  const initMinShares = await calculateMinSharesBatch(publicClient, multiVaultAddress, initTermIds, initCurveIds, initAmounts);
  const initChunks = chunkBatchArrays(initTermIds, initCurveIds, initAmounts, initMinShares, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

  for (const chunk of initChunks) {
    const chunkTotal = chunk.values.reduce((s, a) => s + a, 0n);
    const { request: initRequest } = await publicClient.simulateContract({
      account: walletClient.account,
      address: multiVaultAddress,
      abi: MultiVaultAbi,
      functionName: 'depositBatch',
      args: [address, chunk.termIds, chunk.curveIds, chunk.values, chunk.minValues],
      value: chunkTotal,
    });
    const initTxHash = await walletClient.writeContract(initRequest);
    await publicClient.waitForTransactionReceipt({ hash: initTxHash });
  }
  onStepComplete?.();

  console.log('[executeDeposits] Progressive FOR vaults initialized!');

  // Étape 2: Retirer les dépôts d'initialisation
  const redeemTermIds: Hex[] = [];
  const redeemSharesArr: bigint[] = [];

  for (const item of progressiveAgainstItems) {
    const shares = await getPositionShares(
      publicClient,
      multiVaultAddress,
      address,
      item.termId,
      BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID
    );

    if (shares > 0n) {
      redeemTermIds.push(item.termId);
      redeemSharesArr.push(shares);
    }
  }

  if (redeemTermIds.length > 0) {
    const redeemCurveIds = redeemTermIds.map(() => BATCH_VOTE_CONSTANTS.PROGRESSIVE_CURVE_ID);
    const redeemMinAssets = await calculateMinAssetsBatch(publicClient, multiVaultAddress, redeemTermIds, redeemCurveIds, redeemSharesArr);
    const redeemChunks = chunkBatchArrays(redeemTermIds, redeemCurveIds, redeemSharesArr, redeemMinAssets, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

    for (const chunk of redeemChunks) {
      const { request: redeemRequest } = await publicClient.simulateContract({
        account: walletClient.account,
        address: multiVaultAddress,
        abi: MultiVaultAbi,
        functionName: 'redeemBatch',
        args: [address, chunk.termIds, chunk.curveIds, chunk.values, chunk.minValues],
      });
      const redeemTxHash = await walletClient.writeContract(redeemRequest);
      await publicClient.waitForTransactionReceipt({ hash: redeemTxHash });
    }
    onStepComplete?.();

    console.log('[executeDeposits] Init deposits redeemed!');
  }

  // Étape 3: Réessayer le dépôt original
  console.log('[executeDeposits] Retrying original deposit...');

  const retryMinShares = await calculateMinSharesBatch(publicClient, multiVaultAddress, depositTermIds, depositCurveIds, depositAmounts);
  const retryChunks = chunkBatchArrays(depositTermIds, depositCurveIds, depositAmounts, retryMinShares, BATCH_VOTE_CONSTANTS.MAX_BATCH_SIZE);

  let lastTxHash: Hex = '0x0' as Hex;
  for (const chunk of retryChunks) {
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
  onStepComplete?.();

  return lastTxHash;
}

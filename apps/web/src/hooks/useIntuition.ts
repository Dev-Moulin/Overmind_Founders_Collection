import { useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useApolloClient } from '@apollo/client';
import {
  createAtomFromString,
  createAtomFromThing,
  getMultiVaultAddressFromChainId,
} from '@0xintuition/sdk';
import { parseEther, formatEther, type Hex } from 'viem';
import { intuitionTestnet, multiCallIntuitionConfigs, MultiVaultAbi } from '@0xintuition/protocol';
import { GET_ATOMS_BY_LABELS, GET_TRIPLE_BY_ATOMS } from '../lib/graphql/queries';

export interface CreateAtomResult {
  uri: string;
  transactionHash: string;
  termId: Hex;
}

export interface CreateTripleResult {
  transactionHash: string;
  tripleId: Hex;
  subjectId: Hex;
  predicateId: Hex;
  objectId: Hex;
}

/**
 * Custom error for when a claim already exists
 * Contains the existing triple info so UI can redirect to vote page
 */
export class ClaimExistsError extends Error {
  public readonly termId: Hex;
  public readonly subjectLabel: string;
  public readonly predicateLabel: string;
  public readonly objectLabel: string;

  constructor(data: {
    termId: Hex;
    subjectLabel: string;
    predicateLabel: string;
    objectLabel: string;
  }) {
    super(
      `Ce claim existe déjà : "${data.subjectLabel} ${data.predicateLabel} ${data.objectLabel}". ` +
      `Vous pouvez voter dessus au lieu de le recréer.`
    );
    this.name = 'ClaimExistsError';
    this.termId = data.termId;
    this.subjectLabel = data.subjectLabel;
    this.predicateLabel = data.predicateLabel;
    this.objectLabel = data.objectLabel;
  }
}

export interface FounderData {
  name: string;
  shortBio: string;
  fullBio?: string;
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
  image?: string;
}

/**
 * Get the best available image URL for a founder
 * Priority: manual image > Twitter avatar > GitHub avatar > DiceBear fallback
 */
export function getFounderImageUrl(founder: FounderData): string {
  // 1. Manual image if provided
  if (founder.image) {
    return founder.image;
  }

  // 2. Twitter avatar via unavatar.io
  if (founder.twitter) {
    return `https://unavatar.io/twitter/${founder.twitter.replace('@', '')}`;
  }

  // 3. GitHub avatar (direct from GitHub)
  if (founder.github) {
    return `https://github.com/${founder.github}.png`;
  }

  // 4. DiceBear fallback - generates unique avatar based on name
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
}

export function useIntuition() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const apolloClient = useApolloClient();

  const multiVaultAddress = getMultiVaultAddressFromChainId(intuitionTestnet.id);

  /**
   * Look up an existing atom by label via GraphQL
   * Returns the term_id if found, null otherwise
   */
  const findAtomByLabel = useCallback(
    async (label: string): Promise<Hex | null> => {
      try {
        const { data } = await apolloClient.query<{
          atoms: Array<{ term_id: string; label: string }>;
        }>({
          query: GET_ATOMS_BY_LABELS,
          variables: { labels: [label] },
          fetchPolicy: 'network-only', // Always check fresh data
        });

        if (data?.atoms && data.atoms.length > 0) {
          return data.atoms[0].term_id as Hex;
        }
        return null;
      } catch (error) {
        console.warn('[useIntuition] Error looking up atom:', label, error);
        return null;
      }
    },
    [apolloClient]
  );

  /**
   * Vérifie si un triple existe déjà via GraphQL
   * Returns the triple info if found, null otherwise
   */
  const findTriple = useCallback(
    async (
      subjectId: Hex,
      predicateId: Hex,
      objectId: Hex
    ): Promise<{ termId: Hex; subjectLabel: string; predicateLabel: string; objectLabel: string } | null> => {
      try {
        console.log('[useIntuition] findTriple - searching with:', {
          subjectId,
          predicateId,
          objectId,
        });

        const { data } = await apolloClient.query<{
          triples: Array<{
            term_id: string;
            subject: { label: string };
            predicate: { label: string };
            object: { label: string };
          }>;
        }>({
          query: GET_TRIPLE_BY_ATOMS,
          variables: { subjectId, predicateId, objectId },
          fetchPolicy: 'network-only',
        });

        console.log('[useIntuition] findTriple - result:', data);

        if (data?.triples && data.triples.length > 0) {
          const triple = data.triples[0];
          return {
            termId: triple.term_id as Hex,
            subjectLabel: triple.subject.label,
            predicateLabel: triple.predicate.label,
            objectLabel: triple.object.label,
          };
        }
        console.log('[useIntuition] findTriple - triple NOT found');
        return null;
      } catch (error) {
        console.warn('[useIntuition] Error looking up triple:', error);
        return null;
      }
    },
    [apolloClient]
  );

  /**
   * Create an Atom from a string (for predicates, totems)
   */
  const createAtom = useCallback(
    async (value: string, depositAmount?: string): Promise<CreateAtomResult> => {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      const config = {
        walletClient,
        publicClient,
        address: multiVaultAddress,
      };

      const deposit = depositAmount ? parseEther(depositAmount) : undefined;

      const result = await createAtomFromString(config, value, deposit);

      return {
        uri: result.uri,
        transactionHash: result.transactionHash,
        termId: result.state.termId,
      };
    },
    [walletClient, publicClient, multiVaultAddress]
  );

  /**
   * Get or create an atom - first checks if it exists, creates only if not found
   * This avoids the "AtomExists" error when trying to create an atom that already exists
   */
  const getOrCreateAtom = useCallback(
    async (value: string, depositAmount?: string): Promise<{ termId: Hex; created: boolean }> => {
      // First, check if atom already exists
      const existingId = await findAtomByLabel(value);
      if (existingId) {
        console.log('[useIntuition] Atom already exists:', value, existingId);
        return { termId: existingId, created: false };
      }

      // Create new atom
      console.log('[useIntuition] Creating new atom:', value);
      const result = await createAtom(value, depositAmount);
      return { termId: result.termId, created: true };
    },
    [findAtomByLabel, createAtom]
  );

  /**
   * Create an Atom with full metadata (for founders)
   * Uses createAtomFromThing to include name, description, image, url
   */
  const createFounderAtom = useCallback(
    async (founder: FounderData, depositAmount?: string): Promise<CreateAtomResult> => {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      const config = {
        walletClient,
        publicClient,
        address: multiVaultAddress,
      };

      const deposit = depositAmount ? parseEther(depositAmount) : undefined;

      // Build URL from twitter or linkedin
      const url = founder.twitter
        ? `https://twitter.com/${founder.twitter.replace('@', '')}`
        : founder.linkedin || undefined;

      // Build image URL using cascade: manual > Twitter > GitHub > DiceBear
      const image = getFounderImageUrl(founder);

      const result = await createAtomFromThing(
        config,
        {
          url,
          name: founder.name,
          description: founder.fullBio || founder.shortBio,
          image,
        },
        deposit
      );

      return {
        uri: result.uri,
        transactionHash: result.transactionHash,
        termId: result.state.termId,
      };
    },
    [walletClient, publicClient, multiVaultAddress]
  );

  /**
   * Create a Triple (claim) from three atom IDs
   */
  const createTriple = useCallback(
    async (
      subjectId: Hex,
      predicateId: Hex,
      objectId: Hex,
      depositAmount: string
    ): Promise<CreateTripleResult> => {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Get ALL contract config including minDeposit for debugging
      try {
        const contractConfig = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });
        const walletBalance = await publicClient.getBalance({ address: walletClient.account.address });
        const depositAmountWei = parseEther(depositAmount);
        const tripleBaseCost = BigInt(contractConfig.triple_cost);
        const minDeposit = BigInt(contractConfig.min_deposit);
        const totalRequired = tripleBaseCost + depositAmountWei;

        console.log('[useIntuition] === CONFIGURATION CONTRAT V2 ===');
        console.log('[useIntuition] Triple base cost:', contractConfig.formatted_triple_cost, 'tTRUST');
        console.log('[useIntuition] Min deposit:', contractConfig.formatted_min_deposit, 'tTRUST');
        console.log('[useIntuition] Entry fee:', contractConfig.formatted_entry_fee);
        console.log('[useIntuition] Protocol fee:', contractConfig.formatted_protocol_fee);
        console.log('[useIntuition] === VOTRE TRANSACTION ===');
        console.log('[useIntuition] Deposit amount:', depositAmount, 'tTRUST');
        console.log('[useIntuition] Total required (base + deposit):', formatEther(totalRequired), 'tTRUST');
        console.log('[useIntuition] Your wallet balance:', formatEther(walletBalance), 'tTRUST');
        console.log('[useIntuition] Deposit >= minDeposit?', depositAmountWei >= minDeposit ? 'YES ✓' : 'NO ✗');
        console.log('[useIntuition] Balance >= required?', walletBalance >= totalRequired ? 'YES ✓' : 'NO ✗');

        // Check minDeposit FIRST - this is likely the issue!
        if (depositAmountWei < minDeposit) {
          throw new Error(
            `Dépôt trop faible! Le minimum requis par le contrat V2 est ${contractConfig.formatted_min_deposit} tTRUST, ` +
            `mais vous avez mis ${depositAmount} tTRUST. Augmentez le montant du dépôt.`
          );
        }

        if (walletBalance < totalRequired) {
          const deficit = totalRequired - walletBalance;
          throw new Error(
            `Balance insuffisante! Vous avez ${formatEther(walletBalance)} tTRUST mais il faut ${formatEther(totalRequired)} tTRUST ` +
            `(${contractConfig.formatted_triple_cost} coût de base + ${depositAmount} dépôt). ` +
            `Il vous manque ${formatEther(deficit)} tTRUST. Allez sur le faucet: https://testnet.hub.intuition.systems`
          );
        }
      } catch (err) {
        // If it's our custom error, rethrow it
        if (err instanceof Error && (err.message.includes('Balance insuffisante') || err.message.includes('Dépôt trop faible'))) {
          throw err;
        }
        console.warn('[useIntuition] Could not check costs:', err);
      }

      // Call contract directly with viem instead of SDK to have full control over msg.value
      //
      // IMPORTANT V2 CONTRACT FIX:
      // In V2, the contract validates: msg.value == sum(assets)
      // The tripleBaseCost is deducted INTERNALLY from assets[i], not separately!
      // So assets[0] must include BOTH the base cost AND the deposit amount.
      //
      const depositAmountWei = parseEther(depositAmount);
      const contractConfig = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });
      const tripleBaseCost = BigInt(contractConfig.triple_cost);

      // V2: assets[0] = tripleBaseCost + userDeposit
      // V2: msg.value = sum(assets) = assets[0] (for single triple)
      const totalAssetValue = tripleBaseCost + depositAmountWei;

      console.log('[useIntuition] === APPEL DIRECT CONTRAT V2 ===');
      console.log('[useIntuition] Triple base cost (wei):', tripleBaseCost.toString());
      console.log('[useIntuition] User deposit (wei):', depositAmountWei.toString());
      console.log('[useIntuition] assets[0] = base + deposit (wei):', totalAssetValue.toString());
      console.log('[useIntuition] msg.value = sum(assets) (wei):', totalAssetValue.toString());
      console.log('[useIntuition] msg.value (ETH):', formatEther(totalAssetValue));

      // Simulate first to catch errors
      // V2: msg.value MUST EQUAL sum(assets), and assets includes the base cost
      const { request } = await publicClient.simulateContract({
        account: walletClient.account,
        address: multiVaultAddress,
        abi: MultiVaultAbi,
        functionName: 'createTriples',
        args: [[subjectId], [predicateId], [objectId], [totalAssetValue]],
        value: totalAssetValue,
      });

      // Execute the transaction
      const txHash = await walletClient.writeContract(request);
      console.log('[useIntuition] Transaction hash:', txHash);

      // Wait for transaction receipt to get events
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('[useIntuition] Transaction confirmed, block:', receipt.blockNumber);

      // For now, return the transaction hash - we'll parse events later if needed
      return {
        transactionHash: txHash,
        tripleId: subjectId, // Placeholder - actual tripleId would come from event parsing
        subjectId,
        predicateId,
        objectId,
      };
    },
    [walletClient, publicClient, multiVaultAddress]
  );

  /**
   * Create a complete claim with new atoms if needed
   * Uses getOrCreateAtom to avoid "AtomExists" errors
   * Checks if triple exists to avoid "TripleExists" errors
   * Returns the triple result
   */
  const createClaim = useCallback(
    async (params: {
      subjectId: Hex; // Founder atom ID (pre-existing)
      predicate: string | Hex; // String = get or create atom, Hex = use existing
      object: string | Hex; // String = get or create atom, Hex = use existing
      depositAmount: string;
    }): Promise<{
      triple: CreateTripleResult;
      predicateCreated: boolean;
      objectCreated: boolean;
    }> => {
      let predicateId: Hex;
      let objectId: Hex;
      let predicateCreated = false;
      let objectCreated = false;

      // Helper to check if a value is a Hex atomId (starts with 0x and is 66 chars long)
      const isHexAtomId = (value: string): boolean => {
        return value.startsWith('0x') && value.length === 66;
      };

      // Get or create predicate atom if it's NOT already a Hex atomId
      if (typeof params.predicate === 'string' && !isHexAtomId(params.predicate)) {
        const result = await getOrCreateAtom(params.predicate);
        predicateId = result.termId;
        predicateCreated = result.created;
      } else {
        predicateId = params.predicate as Hex;
      }

      // Get or create object atom if it's NOT already a Hex atomId
      if (typeof params.object === 'string' && !isHexAtomId(params.object)) {
        const result = await getOrCreateAtom(params.object);
        objectId = result.termId;
        objectCreated = result.created;
      } else {
        objectId = params.object as Hex;
      }

      // Vérifier si le triple existe déjà AVANT de tenter la création
      console.log('[useIntuition] Vérification si le triple existe déjà...');
      const existingTriple = await findTriple(params.subjectId, predicateId, objectId);
      if (existingTriple) {
        console.log('[useIntuition] Triple existe déjà:', existingTriple);
        throw new ClaimExistsError({
          termId: existingTriple.termId,
          subjectLabel: existingTriple.subjectLabel,
          predicateLabel: existingTriple.predicateLabel,
          objectLabel: existingTriple.objectLabel,
        });
      }

      // Create the triple
      const triple = await createTriple(
        params.subjectId,
        predicateId,
        objectId,
        params.depositAmount
      );

      return {
        triple,
        predicateCreated,
        objectCreated,
      };
    },
    [getOrCreateAtom, createTriple, findTriple]
  );

  return {
    createAtom,
    createFounderAtom,
    createTriple,
    createClaim,
    isReady: !!walletClient && !!publicClient,
  };
}

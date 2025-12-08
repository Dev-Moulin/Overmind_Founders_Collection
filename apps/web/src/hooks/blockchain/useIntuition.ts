import { useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useApolloClient } from '@apollo/client';
import {
  createAtomFromString,
  createAtomFromThing,
  getMultiVaultAddressFromChainId,
} from '@0xintuition/sdk';
import { parseEther, formatEther, type Hex } from 'viem';
import { multiCallIntuitionConfigs, MultiVaultAbi } from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import { GET_ATOMS_BY_LABELS, GET_TRIPLE_BY_ATOMS } from '../../lib/graphql/queries';
import categoriesConfig from '../../../../../packages/shared/src/data/categories.json';
import type { CategoryConfig, CreateAtomResult, CreateTripleResult, FounderData } from '../../types/intuition';
import { ClaimExistsError } from '../../types/intuition';

// Re-export types for backward compatibility
export type { CreateAtomResult, CreateTripleResult, FounderData };
export { ClaimExistsError };

// Cast imported JSON to typed config
const typedCategoriesConfig = categoriesConfig as CategoryConfig;

// DEPRECATED: Fonction déplacée vers utils/founderImage.ts
// Gardée en commentaire pour rollback si nécessaire
// Import pour usage interne + re-export pour compatibilité
import { getFounderImageUrl } from '../../utils/founderImage';
export { getFounderImageUrl };
/*
export function getFounderImageUrl(founder: FounderData): string {
  if (founder.image) return founder.image;
  if (founder.twitter) return `https://unavatar.io/twitter/${founder.twitter.replace('@', '')}`;
  if (founder.github) return `https://github.com/${founder.github}.png`;
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(founder.name)}`;
}
*/

export function useIntuition() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const apolloClient = useApolloClient();

  const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

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
    ): Promise<{
      termId: Hex;
      counterTermId?: Hex;
      subjectLabel: string;
      predicateLabel: string;
      objectLabel: string;
      forVotes?: string;
      againstVotes?: string;
    } | null> => {
      try {
        const { data } = await apolloClient.query<{
          triples: Array<{
            term_id: string;
            subject: { label: string };
            predicate: { label: string };
            object: { label: string };
            triple_vault?: { total_assets: string };
            counter_term?: { id: string; total_assets: string };
          }>;
        }>({
          query: GET_TRIPLE_BY_ATOMS,
          variables: { subjectId, predicateId, objectId },
          fetchPolicy: 'network-only',
        });

        if (data?.triples && data.triples.length > 0) {
          const triple = data.triples[0];
          return {
            termId: triple.term_id as Hex,
            counterTermId: triple.counter_term?.id as Hex | undefined,
            subjectLabel: triple.subject.label,
            predicateLabel: triple.predicate.label,
            objectLabel: triple.object.label,
            forVotes: triple.triple_vault?.total_assets,
            againstVotes: triple.counter_term?.total_assets,
          };
        }
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
      console.log('[useIntuition] getOrCreateAtom called for:', value);

      // First, check if atom already exists
      const existingId = await findAtomByLabel(value);
      if (existingId) {
        console.log('[useIntuition] Atom already exists:', { value, termId: existingId });
        return { termId: existingId, created: false };
      }

      // Create new atom
      console.log('[useIntuition] Atom does not exist, creating new atom:', value);
      const result = await createAtom(value, depositAmount);
      console.log('[useIntuition] New atom created:', { value, termId: result.termId });
      return { termId: result.termId, created: true };
    },
    [findAtomByLabel, createAtom]
  );

  /**
   * Create an atom with metadata (for totems with description)
   * Uses createAtomFromThing to include name and description
   */
  const createAtomWithDescription = useCallback(
    async (name: string, description: string, depositAmount?: string): Promise<CreateAtomResult> => {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      const config = {
        walletClient,
        publicClient,
        address: multiVaultAddress,
      };

      const deposit = depositAmount ? parseEther(depositAmount) : undefined;

      const result = await createAtomFromThing(
        config,
        {
          name,
          description,
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
   * Get or create an atom with description - creates with metadata if new
   */
  const getOrCreateAtomWithDescription = useCallback(
    async (
      name: string,
      description: string,
      depositAmount?: string
    ): Promise<{ termId: Hex; created: boolean }> => {
      // First, check if atom already exists by name
      const existingId = await findAtomByLabel(name);
      if (existingId) {
        return { termId: existingId, created: false };
      }

      // Create new atom with description
      const result = await createAtomWithDescription(name, description, depositAmount);
      return { termId: result.termId, created: true };
    },
    [findAtomByLabel, createAtomWithDescription]
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
      console.log('[useIntuition] ========== CREATE TRIPLE START ==========');
      console.log('[useIntuition] Creating triple with:', {
        subjectId,
        predicateId,
        objectId,
        depositAmount,
      });

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
      console.log('[useIntuition] Sending createTriples transaction...');
      const txHash = await walletClient.writeContract(request);
      console.log('[useIntuition] Transaction sent! Hash:', txHash);

      // Wait for transaction receipt
      console.log('[useIntuition] Waiting for transaction receipt...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('[useIntuition] Transaction confirmed!', {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      });

      // For now, return the transaction hash - we'll parse events later if needed
      console.log('[useIntuition] ✅ Triple created successfully!');
      console.log('[useIntuition] ========== CREATE TRIPLE END ==========');
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
      const existingTriple = await findTriple(params.subjectId, predicateId, objectId);
      if (existingTriple) {
        throw new ClaimExistsError({
          termId: existingTriple.termId,
          counterTermId: existingTriple.counterTermId,
          subjectLabel: existingTriple.subjectLabel,
          predicateLabel: existingTriple.predicateLabel,
          objectLabel: existingTriple.objectLabel,
          forVotes: existingTriple.forVotes,
          againstVotes: existingTriple.againstVotes,
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

  /**
   * Create a complete claim with object having a description
   * Used for creating totems with category metadata
   */
  const createClaimWithDescription = useCallback(
    async (params: {
      subjectId: Hex; // Founder atom ID (pre-existing)
      predicate: string | Hex; // String = get or create atom, Hex = use existing
      objectName: string; // Object name (totem name)
      objectDescription: string; // Description to include (e.g. "Categorie : Animaux")
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

      // Get or create object atom with description
      const objectResult = await getOrCreateAtomWithDescription(
        params.objectName,
        params.objectDescription
      );
      objectId = objectResult.termId;
      objectCreated = objectResult.created;

      // Vérifier si le triple existe déjà AVANT de tenter la création
      const existingTriple = await findTriple(params.subjectId, predicateId, objectId);
      if (existingTriple) {
        throw new ClaimExistsError({
          termId: existingTriple.termId,
          counterTermId: existingTriple.counterTermId,
          subjectLabel: existingTriple.subjectLabel,
          predicateLabel: existingTriple.predicateLabel,
          objectLabel: existingTriple.objectLabel,
          forVotes: existingTriple.forVotes,
          againstVotes: existingTriple.againstVotes,
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
    [getOrCreateAtom, getOrCreateAtomWithDescription, createTriple, findTriple]
  );

  /**
   * Create a complete claim with category triples (3-triple system)
   * Creates THREE triples:
   * 1. [Founder] [predicate] [Totem] - Vote principal (FOR/AGAINST)
   * 2. [Totem] [has category] [Category] - Catégorie (sans préfixe)
   * 3. [Category] [tag category] [Overmind Founders Collection] - Marqueur système
   *
   * This enables semantic queries and WebSocket subscriptions
   */
  const createClaimWithCategory = useCallback(
    async (params: {
      subjectId: Hex; // Founder atom ID (pre-existing)
      predicate: string | Hex; // String = get or create atom, Hex = use existing
      objectName: string; // Object name (totem name)
      categoryId: string; // Category ID from categories.json (e.g. "animal", "object")
      depositAmount: string;
    }): Promise<{
      triple: CreateTripleResult;
      categoryTriple: CreateTripleResult | null;
      tagTriple: CreateTripleResult | null;
      predicateCreated: boolean;
      objectCreated: boolean;
      categoryPredicateCreated: boolean;
      categoryObjectCreated: boolean;
      tagPredicateCreated: boolean;
      systemObjectCreated: boolean;
    }> => {
      let predicateId: Hex;
      let objectId: Hex;
      let predicateCreated = false;
      let objectCreated = false;
      let categoryPredicateCreated = false;
      let categoryObjectCreated = false;
      let tagPredicateCreated = false;
      let systemObjectCreated = false;

      // Find category config - support both predefined and dynamic categories
      const predefinedCategory = typedCategoriesConfig.categories.find(c => c.id === params.categoryId);

      // For dynamic categories, use category name directly (no OFC: prefix)
      const categoryLabel = predefinedCategory
        ? predefinedCategory.label
        : params.categoryId.charAt(0).toUpperCase() + params.categoryId.slice(1);


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

      // Get or create object atom (totem) - simple atom without description
      const objectResult = await getOrCreateAtom(params.objectName);
      objectId = objectResult.termId;
      objectCreated = objectResult.created;

      // Vérifier si le triple existe déjà AVANT de tenter la création
      const existingTriple = await findTriple(params.subjectId, predicateId, objectId);
      if (existingTriple) {
        throw new ClaimExistsError({
          termId: existingTriple.termId,
          counterTermId: existingTriple.counterTermId,
          subjectLabel: existingTriple.subjectLabel,
          predicateLabel: existingTriple.predicateLabel,
          objectLabel: existingTriple.objectLabel,
          forVotes: existingTriple.forVotes,
          againstVotes: existingTriple.againstVotes,
        });
      }

      // === TRIPLE 1: Vote principal ===
      const triple = await createTriple(
        params.subjectId,
        predicateId,
        objectId,
        params.depositAmount
      );

      // === TRIPLE 2: [Totem] → [has category] → [Category] ===
      // Atoms système doivent être pré-créés par l'admin (termId dans categories.json)
      let categoryTriple: CreateTripleResult | null = null;
      let tagTriple: CreateTripleResult | null = null;

      // Get category termId from config (must be pre-created by admin)
      const categoryTermId = predefinedCategory?.termId;
      const categoryPredicateTermId = typedCategoriesConfig.predicate.termId;
      const tagPredicateTermId = typedCategoriesConfig.tagPredicate?.termId;
      const systemObjectTermId = typedCategoriesConfig.systemObject?.termId;

      try {
        // Vérifier que les atoms système existent
        if (!categoryPredicateTermId) {
          console.warn('[useIntuition] Prédicat "has category" non créé par admin, triple 2 ignoré');
        } else if (!categoryTermId) {
          console.warn(`[useIntuition] Catégorie "${categoryLabel}" non créée par admin, triple 2 ignoré`);
        } else {
          const categoryPredicateId = categoryPredicateTermId as Hex;
          const categoryObjectId = categoryTermId as Hex;

          // Vérifier si le triple de catégorie existe déjà
          const existingCategoryTriple = await findTriple(objectId, categoryPredicateId, categoryObjectId);
          if (!existingCategoryTriple) {
            // Get min deposit for category triple (minimum cost)
            const contractConfig = await multiCallIntuitionConfigs({ publicClient: publicClient!, address: multiVaultAddress });
            const minDeposit = formatEther(BigInt(contractConfig.min_deposit));

            categoryTriple = await createTriple(
              objectId, // Subject = le totem qu'on vient de créer
              categoryPredicateId, // Predicate = "has category" (pré-créé)
              categoryObjectId, // Object = Animal, Object, etc. (pre-created)
              minDeposit // Dépôt minimum pour le triple de catégorie
            );
            categoryPredicateCreated = false; // Pré-existant
            categoryObjectCreated = false; // Pré-existant
          }
        }
      } catch (categoryError) {
        // Log but don't fail - the main vote triple was created successfully
        console.error('[useIntuition] Erreur création triple catégorie (non bloquant):', categoryError);
      }

      // === TRIPLE 3: [Category] → [tag category] → [Overmind Founders Collection] ===
      // Ce triple est créé UNE SEULE FOIS par catégorie (généralement par l'admin)
      // On vérifie s'il existe, sinon on le crée
      try {
        if (categoryTermId && tagPredicateTermId && systemObjectTermId) {
          const categoryObjectId = categoryTermId as Hex;
          const tagPredicateId = tagPredicateTermId as Hex;
          const systemObjectId = systemObjectTermId as Hex;

          // Vérifier si le triple tag existe déjà
          const existingTagTriple = await findTriple(categoryObjectId, tagPredicateId, systemObjectId);
          if (!existingTagTriple) {
            // Get min deposit for tag triple
            const contractConfig = await multiCallIntuitionConfigs({ publicClient: publicClient!, address: multiVaultAddress });
            const minDeposit = formatEther(BigInt(contractConfig.min_deposit));

            tagTriple = await createTriple(
              categoryObjectId, // Subject = la catégorie (pré-créée)
              tagPredicateId, // Predicate = "tag category" (pré-créé)
              systemObjectId, // Object = "Overmind Founders Collection" (pré-créé)
              minDeposit // Dépôt minimum
            );
            tagPredicateCreated = false; // Pré-existant
            systemObjectCreated = false; // Pré-existant
          }
        } else {
          console.warn('[useIntuition] Atoms système pour triple 3 non créés par admin, triple tag ignoré');
        }
      } catch (tagError) {
        // Log but don't fail - triples 1 and 2 were created successfully
        console.error('[useIntuition] Erreur création triple tag (non bloquant):', tagError);
      }

      return {
        triple,
        categoryTriple,
        tagTriple,
        predicateCreated,
        objectCreated,
        categoryPredicateCreated,
        categoryObjectCreated,
        tagPredicateCreated,
        systemObjectCreated,
      };
    },
    [getOrCreateAtom, createTriple, findTriple, publicClient, multiVaultAddress]
  );

  return {
    createAtom,
    createFounderAtom,
    createTriple,
    createClaim,
    createClaimWithDescription,
    createClaimWithCategory,
    getOrCreateAtom,
    findTriple,
    isReady: !!walletClient && !!publicClient,
  };
}

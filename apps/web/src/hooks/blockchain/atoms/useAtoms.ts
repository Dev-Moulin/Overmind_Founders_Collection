/**
 * useAtoms - Hook pour la gestion des Atoms INTUITION
 *
 * Fonctions pour rechercher et créer des atoms (entités) sur la blockchain.
 *
 * Types d'atoms:
 * - Simple (string): "support", "oppose", "Decentralization"
 * - Avec description: nom + description
 * - Founder complet: nom + bio + image + URL
 *
 * @see Documentation: 06_Hooks/blockchain/useIntuition_creation-atoms.md
 */

import { useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useApolloClient } from '@apollo/client';
import {
  createAtomFromString,
  createAtomFromThing,
  getMultiVaultAddressFromChainId,
} from '@0xintuition/sdk';
import { parseEther, type Hex } from 'viem';
import { currentIntuitionChain } from '../../../config/wagmi';
import { GET_ATOMS_BY_LABELS } from '../../../lib/graphql/queries';
import type { CreateAtomResult, FounderData } from '../../../types/intuition';
import { getFounderImageUrl } from '../../../utils/founderImage';

/**
 * Hook pour la gestion des atoms
 */
export function useAtoms() {
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
          fetchPolicy: 'network-only',
        });

        if (data?.atoms && data.atoms.length > 0) {
          return data.atoms[0].term_id as Hex;
        }
        return null;
      } catch (error) {
        console.warn('[useAtoms] Error looking up atom:', label, error);
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
   * This avoids the "AtomExists" error
   */
  const getOrCreateAtom = useCallback(
    async (value: string, depositAmount?: string): Promise<{ termId: Hex; created: boolean }> => {
      console.log('[useAtoms] getOrCreateAtom called for:', value);

      const existingId = await findAtomByLabel(value);
      if (existingId) {
        console.log('[useAtoms] Atom already exists:', { value, termId: existingId });
        return { termId: existingId, created: false };
      }

      console.log('[useAtoms] Atom does not exist, creating new atom:', value);
      const result = await createAtom(value, depositAmount);
      console.log('[useAtoms] New atom created:', { value, termId: result.termId });
      return { termId: result.termId, created: true };
    },
    [findAtomByLabel, createAtom]
  );

  /**
   * Create an atom with metadata (for totems with description)
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
      const result = await createAtomFromThing(config, { name, description }, deposit);

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
      const existingId = await findAtomByLabel(name);
      if (existingId) {
        return { termId: existingId, created: false };
      }

      const result = await createAtomWithDescription(name, description, depositAmount);
      return { termId: result.termId, created: true };
    },
    [findAtomByLabel, createAtomWithDescription]
  );

  /**
   * Create an Atom with image (for totems with image via Thing schema)
   */
  const createAtomWithImage = useCallback(
    async (name: string, image: string, depositAmount?: string): Promise<CreateAtomResult> => {
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      const config = {
        walletClient,
        publicClient,
        address: multiVaultAddress,
      };

      const deposit = depositAmount ? parseEther(depositAmount) : undefined;
      const result = await createAtomFromThing(config, { name, image }, deposit);

      return {
        uri: result.uri,
        transactionHash: result.transactionHash,
        termId: result.state.termId,
      };
    },
    [walletClient, publicClient, multiVaultAddress]
  );

  /**
   * Get or create an atom with optional image - uses Thing schema if image provided
   */
  const getOrCreateAtomWithImage = useCallback(
    async (
      name: string,
      image?: string,
      depositAmount?: string
    ): Promise<{ termId: Hex; created: boolean }> => {
      console.log('[useAtoms] getOrCreateAtomWithImage called for:', name, image ? '(with image)' : '(no image)');

      const existingId = await findAtomByLabel(name);
      if (existingId) {
        console.log('[useAtoms] Atom already exists:', { name, termId: existingId });
        return { termId: existingId, created: false };
      }

      if (image) {
        console.log('[useAtoms] Creating atom with image (Thing schema):', name);
        const result = await createAtomWithImage(name, image, depositAmount);
        console.log('[useAtoms] Atom with image created:', { name, termId: result.termId });
        return { termId: result.termId, created: true };
      }

      console.log('[useAtoms] Creating atom without image (string):', name);
      const result = await createAtom(name, depositAmount);
      console.log('[useAtoms] Atom created:', { name, termId: result.termId });
      return { termId: result.termId, created: true };
    },
    [findAtomByLabel, createAtom, createAtomWithImage]
  );

  /**
   * Create an Atom with full metadata (for founders)
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

      const url = founder.twitter
        ? `https://twitter.com/${founder.twitter.replace('@', '')}`
        : founder.linkedin || undefined;

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

  const isReady = !!walletClient && !!publicClient;

  return {
    findAtomByLabel,
    createAtom,
    getOrCreateAtom,
    createAtomWithImage,
    getOrCreateAtomWithImage,
    createAtomWithDescription,
    getOrCreateAtomWithDescription,
    createFounderAtom,
    isReady,
  };
}

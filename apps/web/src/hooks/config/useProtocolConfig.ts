import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import {
  multiCallIntuitionConfigs,
  getMultiVaultAddressFromChainId,
} from '@0xintuition/protocol';
import { currentIntuitionChain } from '../../config/wagmi';
import type { ProtocolConfig } from '../../types/protocol';

// Re-export for backward compatibility
export type { ProtocolConfig };

/**
 * Hook pour récupérer la configuration du protocole INTUITION
 *
 * Récupère les coûts de création d'atoms/triples et les frais du protocole
 * depuis le contrat MultiVault.
 *
 * @returns Configuration du protocole avec états de chargement
 *
 * @example
 * ```tsx
 * function VotePanel() {
 *   const { config, loading, error } = useProtocolConfig();
 *
 *   if (loading) return <div>Chargement config...</div>;
 *
 *   return (
 *     <div>
 *       <p>Coût minimum: {config?.formattedMinDeposit} TRUST</p>
 *       <p>Frais d'entrée: {config?.formattedEntryFee}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProtocolConfig() {
  const publicClient = usePublicClient();
  const [config, setConfig] = useState<ProtocolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      if (!publicClient) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const multiVaultAddress = getMultiVaultAddressFromChainId(currentIntuitionChain.id);

        const contractConfig = await multiCallIntuitionConfigs({
          publicClient,
          address: multiVaultAddress,
        });

        // Clean up formatted values - remove trailing zeros for cleaner display
        const cleanNumber = (value: string): string => {
          const num = parseFloat(value);
          if (isNaN(num)) return value;
          // Keep at most 6 decimal places, remove trailing zeros
          return parseFloat(num.toFixed(6)).toString();
        };

        setConfig({
          // Coûts de base (wei)
          atomCost: contractConfig.atom_cost,
          tripleCost: contractConfig.triple_cost,
          minDeposit: contractConfig.min_deposit,

          // Coûts formatés (TRUST) - cleaned up
          formattedAtomCost: cleanNumber(contractConfig.formatted_atom_cost),
          formattedTripleCost: cleanNumber(contractConfig.formatted_triple_cost),
          formattedMinDeposit: cleanNumber(contractConfig.formatted_min_deposit),

          // Frais (basis points)
          entryFee: contractConfig.entry_fee,
          exitFee: contractConfig.exit_fee,
          protocolFee: contractConfig.protocol_fee,
          feeDenominator: contractConfig.fee_denominator,

          // Frais formatés
          formattedEntryFee: contractConfig.formatted_entry_fee,
          formattedExitFee: contractConfig.formatted_exit_fee,
          formattedProtocolFee: contractConfig.formatted_protocol_fee,
        });
      } catch (err) {
        console.error('[useProtocolConfig] Error fetching config:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch protocol config'));
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [publicClient]);

  return {
    /** Configuration du protocole */
    config,
    /** État de chargement */
    loading,
    /** Erreur éventuelle */
    error,
    /** Helpers pour validation */
    isDepositValid: (amount: string) => {
      if (!config) return false;
      try {
        const amountWei = parseEther(amount);
        const minDepositWei = BigInt(config.minDeposit);
        return amountWei >= minDepositWei;
      } catch {
        return false;
      }
    },
    /** Calcul du coût total pour créer un triple */
    getTotalTripleCost: (depositAmount: string) => {
      if (!config) return null;
      try {
        const depositWei = parseEther(depositAmount);
        const tripleCostWei = BigInt(config.tripleCost);
        const totalWei = tripleCostWei + depositWei;
        // Format and remove trailing zeros
        const formattedValue = parseFloat(Number(formatEther(totalWei)).toFixed(4)).toString();
        return {
          totalWei: totalWei.toString(),
          formatted: formattedValue,
        };
      } catch {
        return null;
      }
    },
  };
}

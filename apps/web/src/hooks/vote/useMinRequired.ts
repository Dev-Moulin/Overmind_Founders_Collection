/**
 * useMinRequired - Calculate minimum required amount for voting
 *
 * Based on creation mode:
 * - New totem (from creation form OR new triple): 1 triple + minDeposit
 *   Category atoms and triple are already created by TotemCreationForm,
 *   so only the main triple [founder] [predicate] [totem] remains.
 * - Existing triple: just minDeposit
 *
 * IMPORTANT: Uses BigInt arithmetic to preserve exact wei precision!
 * The protocol's tripleCost is NOT exactly 0.001 (e.g., 1000000002000000 wei)
 *
 * @see VoteTotemPanel.tsx
 */

import { useMemo } from 'react';
import { formatEther } from 'viem';
import { truncateAmount } from '../../utils/formatters';
import type { ProtocolConfig } from '../../types/protocol';
import type { NewTotemData } from '../../components/founder/TotemCreationForm';

export interface MinRequiredAmount {
  /** Exact value for contract (e.g., "0.002000000002") */
  minRequiredExact: string;
  /** Truncated value for UI display (e.g., "0.002") */
  minRequiredDisplay: string;
}

export interface UseMinRequiredParams {
  /** Protocol configuration */
  protocolConfig: ProtocolConfig | null;
  /** Whether this is a new totem (triple doesn't exist yet) */
  isNewTotem: boolean;
  /** New totem data (if creating) */
  newTotemData: NewTotemData | null | undefined;
}

/**
 * Hook for calculating minimum required amount based on creation mode
 */
export function useMinRequired({
  protocolConfig,
  isNewTotem,
  newTotemData,
}: UseMinRequiredParams): MinRequiredAmount {
  return useMemo(() => {
    if (!protocolConfig) return { minRequiredExact: '0.001', minRequiredDisplay: '0.001' };

    // Convert string values to BigInt for exact arithmetic
    const tripleCostBigInt = BigInt(protocolConfig.tripleCost);
    const minDepositBigInt = BigInt(protocolConfig.minDeposit);

    let totalBigInt: bigint;

    // New totem: 1 triple cost + minDeposit
    // Whether from creation form (category already paid) or new relationship triple
    if (newTotemData || isNewTotem) {
      totalBigInt = tripleCostBigInt + minDepositBigInt;
    }
    // Existing triple: just minDeposit
    else {
      totalBigInt = minDepositBigInt;
    }

    // formatEther gives exact string representation (e.g., "0.002000000002")
    const exact = formatEther(totalBigInt);

    // Truncate for clean UI display (e.g., "0.002")
    // User sees "0.002" but we actually use the exact value for validation
    const display = truncateAmount(exact);

    return { minRequiredExact: exact, minRequiredDisplay: display };
  }, [protocolConfig, isNewTotem, newTotemData]);
}

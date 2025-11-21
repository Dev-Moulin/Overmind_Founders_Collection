/**
 * Triple data structure from INTUITION GraphQL API
 */
export interface Triple {
  id: string;
  predicate: {
    id: string;
    label: string;
  };
  object: {
    id: string;
    label: string;
    image?: string;
    description?: string;
  };
  positiveVault: {
    totalAssets: string;
  };
  negativeVault: {
    totalAssets: string;
  };
}

/**
 * Represents a single claim (triple) within an aggregated totem
 */
export interface Claim {
  tripleId: string;
  predicate: string;
  netScore: bigint;
  trustFor: bigint;
  trustAgainst: bigint;
}

/**
 * Aggregated totem data with all claims and totals
 */
export interface AggregatedTotem {
  objectId: string;
  object: {
    id: string;
    label: string;
    image?: string;
    description?: string;
  };
  claims: Claim[];
  netScore: bigint;
  totalFor: bigint;
  totalAgainst: bigint;
  claimCount: number;
}

/**
 * Aggregates triples by their object (totem) to calculate total scores
 *
 * Example:
 * - Triple 1: [Joseph Lubin] [is represented by] [Lion] → 50 FOR, 5 AGAINST = 45 NET
 * - Triple 2: [Joseph Lubin] [embodies] [Lion] → 30 FOR, 2 AGAINST = 28 NET
 * - Triple 3: [Joseph Lubin] [channels] [Lion] → 20 FOR, 0 AGAINST = 20 NET
 *
 * Result: Lion totem has NET score of 93 (45 + 28 + 20)
 *
 * @param triples - Array of triples from GraphQL query
 * @returns Array of aggregated totems sorted by NET score (descending)
 */
export function aggregateTriplesByObject(triples: Triple[]): AggregatedTotem[] {
  const grouped: Record<string, AggregatedTotem> = {};

  triples.forEach((triple) => {
    const objectId = triple.object.id;

    // Initialize totem entry if not exists
    if (!grouped[objectId]) {
      grouped[objectId] = {
        objectId: objectId,
        object: triple.object,
        claims: [],
        netScore: 0n,
        totalFor: 0n,
        totalAgainst: 0n,
        claimCount: 0,
      };
    }

    // Parse vault amounts to bigint
    const trustFor = BigInt(triple.positiveVault.totalAssets);
    const trustAgainst = BigInt(triple.negativeVault.totalAssets);
    const netScore = trustFor - trustAgainst;

    // Add claim to totem
    grouped[objectId].claims.push({
      tripleId: triple.id,
      predicate: triple.predicate.label,
      netScore: netScore,
      trustFor: trustFor,
      trustAgainst: trustAgainst,
    });

    // Aggregate totals
    grouped[objectId].netScore += netScore;
    grouped[objectId].totalFor += trustFor;
    grouped[objectId].totalAgainst += trustAgainst;
    grouped[objectId].claimCount += 1;
  });

  // Convert to array and sort by NET score (descending)
  return Object.values(grouped).sort((a, b) => {
    if (a.netScore > b.netScore) return -1;
    if (a.netScore < b.netScore) return 1;
    return 0;
  });
}

/**
 * Returns the totem with the highest NET score (winning totem)
 *
 * @param totems - Array of aggregated totems
 * @returns The winning totem or null if array is empty
 */
export function getWinningTotem(
  totems: AggregatedTotem[]
): AggregatedTotem | null {
  if (totems.length === 0) return null;

  // Array is already sorted by aggregateTriplesByObject
  return totems[0];
}

/**
 * Formats a TRUST token amount (bigint with 18 decimals) to human-readable string
 *
 * Examples:
 * - 1000000000000000000n → "1.00"
 * - 1500000000000000000n → "1.50"
 * - 123456789012345678n → "0.12"
 *
 * @param amount - Amount in wei (18 decimals)
 * @param decimals - Number of decimal places to display (default: 2)
 * @returns Formatted string
 */
export function formatTrustAmount(
  amount: bigint,
  decimals: number = 2
): string {
  // Convert to ether (divide by 10^18)
  const divisor = 10n ** 18n;
  const integerPart = amount / divisor;
  const remainder = amount % divisor;

  if (decimals === 0) {
    return `${integerPart}.`;
  }

  // Get fractional part as string with 18 digits
  const fractionalPart = remainder.toString().padStart(18, '0');

  // Truncate to desired decimals
  const truncated = fractionalPart.substring(0, decimals);

  return `${integerPart}.${truncated}`;
}

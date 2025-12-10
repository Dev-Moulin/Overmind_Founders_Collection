/**
 * TypeScript types for INTUITION GraphQL schema
 *
 * Based on the INTUITION Protocol GraphQL schema
 */

/**
 * Atom types in INTUITION Protocol
 */
export type AtomType = 'Thing' | 'Person' | 'Organization' | 'Account';

/**
 * Vault types - differentiate between atom vaults and triple vaults
 */
export type VaultType = 'atom' | 'triple_positive' | 'triple_negative';

/**
 * Account/User in INTUITION
 */
export interface Account {
  id: string;
  label?: string;
}

/**
 * Vault - stores deposits of $TRUST tokens
 */
export interface Vault {
  id: string;
  curveId?: string;
  isActive: boolean;
  totalShares: string; // BigInt as string
  totalAssets: string; // BigInt as string (wei)
}

/**
 * Atom - atomic unit of knowledge (person, concept, object)
 */
export interface Atom {
  term_id: string;
  id: string;
  wallet_id?: string;
  creator?: Account;
  creator_id: string;
  label: string;
  data?: string;
  raw_data?: string;
  emoji?: string;
  image?: string;
  type: AtomType;
  block_number?: string;
  log_index?: string;
  transaction_hash?: string;
  created_at: string;
  updated_at?: string;
  totalShares?: string;
  totalAssets?: string;
  vault?: Vault;
}

/**
 * Triple - RDF triple statement (Subject - Predicate - Object)
 *
 * For our project: [Founder] [represented_by] [Totem]
 */
export interface Triple {
  term_id: string;
  subject: Atom;
  subject_id: string;
  predicate: Atom;
  predicate_id: string;
  object: Atom;
  object_id: string;
  creator?: Account;
  creator_id: string;
  triple_vault?: {
    total_shares: string;
    total_assets: string;
  };
  counter_term?: {
    id: string;
    total_assets: string;
  };
  block_number: string;
  log_index?: string;
  transaction_hash: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Deposit - a vote (deposit of $TRUST tokens in a vault)
 */
export interface Deposit {
  id: string;
  sender?: Account;
  sender_id: string;
  receiver?: Account;
  receiver_id: string;
  term_id: string;
  vault_type: VaultType;
  shares: string; // BigInt as string
  total_shares: string;
  assets_after_fees: string; // BigInt as string (wei)
  block_number: string;
  log_index?: string;
  transaction_hash: string;
  created_at: string;
  curve_id: string;
  term?: {
    id: string;
    term_id: string;
  };
}

/**
 * Position - user's position on a term (atom or triple)
 */
export interface Position {
  id: string;
  account?: Account;
  account_id: string;
  term_id: string;
  shares: string; // BigInt as string
  total_deposit_assets_after_total_fees: string;
  total_redeem_assets_for_receiver: string;
  block_number?: string;
  log_index?: string;
  transaction_hash?: string;
  transaction_index?: string;
  created_at: string;
  updated_at: string;
  curve_id?: string;
}

/**
 * Query result types
 */

export interface GetFounderProposalsResult {
  triples: Triple[];
}

export interface GetUserProposalsResult {
  triples: Triple[];
}

export interface CountUserProposalsForFounderResult {
  triples_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export interface GetUserVotesResult {
  deposits: Deposit[];
}

export interface GetUserVotesDetailedResult {
  deposits: Deposit[];
}

export interface GetTripleByIdResult {
  triples: Triple[];
}

export interface GetAtomByIdResult {
  atoms: Atom[];
}

export interface SearchAtomsResult {
  atoms: Atom[];
}

export interface GetAllProposalsResult {
  triples: Triple[];
}

export interface GetUserPositionResult {
  positions: Position[];
}

/**
 * Aggregate vote counts for a triple
 */
export interface TripleVoteCounts {
  forVotes: string; // Total $TRUST in positiveVault (wei)
  againstVotes: string; // Total $TRUST in negativeVault (wei)
  netVotes: string; // forVotes - againstVotes (wei)
  forShares: string; // Total shares in positiveVault
  againstShares: string; // Total shares in negativeVault
}

/**
 * Proposal with computed vote data
 */
export interface ProposalWithVotes extends Triple {
  votes: TripleVoteCounts;
  percentage: number; // Percentage of FOR votes vs total votes (0-100)
}

/**
 * Result type for GET_TRIPLE_VOTES query
 */
export interface GetTripleVotesResult {
  deposits: Deposit[];
}

/**
 * Result type for GET_RECENT_VOTES query
 */
export interface GetRecentVotesResult {
  deposits: Deposit[];
}

/**
 * Result type for GET_VOTE_STATS query
 */
export interface GetVoteStatsResult {
  deposits_aggregate: {
    aggregate: {
      count: number;
      sum: {
        assets_after_fees: string;
      };
    };
    nodes: Array<{ sender_id: string }>;
  };
}

/**
 * Result type for GET_TOP_VOTERS query
 */
export interface GetTopVotersResult {
  deposits: Array<{
    sender_id: string;
    assets_after_fees: string;
    created_at: string;
  }>;
}

/**
 * Aggregated voter for leaderboard
 */
export interface AggregatedVoter {
  address: string;
  totalVoted: string; // wei
  voteCount: number;
  formattedTotal: string;
}

/**
 * Global vote statistics
 */
export interface VoteStats {
  totalVotes: number;
  totalTrustDeposited: string; // wei
  uniqueVoters: number;
  averageVoteAmount: string; // wei
  formattedTotal: string;
  formattedAverage: string;
}

/**
 * Result type for GET_VOTES_TIMELINE query
 */
export interface GetVotesTimelineResult {
  deposits: Array<{
    id: string;
    vault_type: VaultType;
    assets_after_fees: string;
    created_at: string;
  }>;
}

/**
 * Result type for GET_VOTES_DISTRIBUTION query
 */
export interface GetVotesDistributionResult {
  deposits: Array<{
    id: string;
    sender_id: string;
    vault_type: VaultType;
    assets_after_fees: string;
  }>;
}

/**
 * Result type for GET_FOUNDER_STATS query
 */
export interface GetFounderStatsResult {
  triples: Array<{
    term_id: string;
    object: {
      term_id: string;
      label: string;
    };
    triple_vault?: {
      total_assets: string;
      total_shares: string;
    } | null;
    counter_term?: {
      id: string;
      total_assets: string;
    } | null;
    created_at: string;
  }>;
  deposits: Array<{
    created_at: string;
  }>;
}

/**
 * Timeline data point for charts
 */
export interface TimelineDataPoint {
  timestamp: string;
  date: Date;
  cumulativeFor: bigint;
  cumulativeAgainst: bigint;
  cumulativeNet: bigint;
  formattedFor: string;
  formattedAgainst: string;
  formattedNet: string;
}

/**
 * Distribution bucket for histogram
 */
export interface DistributionBucket {
  range: string; // e.g., "0-1", "1-5", "5-10"
  minAmount: bigint;
  maxAmount: bigint;
  count: number;
  totalAmount: bigint;
  formattedTotal: string;
}

/**
 * Founder statistics
 */
export interface FounderStats {
  founderName: string;
  totalTrust: string; // wei
  formattedTrust: string;
  proposalCount: number;
  uniqueVoters: number;
  mostRecentProposal: string | null;
  mostRecentVote: string | null;
  totemDistribution: Array<{
    totemId: string;
    totemLabel: string;
    trustFor: string;
    trustAgainst: string;
    netScore: string;
  }>;
}

/**
 * Deposit with triple details for user votes display
 *
 * Note: The `term` field uses GraphQL inline fragments to access triple-specific fields.
 * For atom deposits, subject/predicate/object will be undefined.
 */
export interface DepositWithTriple {
  id: string;
  sender_id: string;
  term_id: string;
  vault_type: VaultType;
  shares: string;
  assets_after_fees: string;
  created_at: string;
  transaction_hash: string;
  term: {
    id: string;
    // Triple-specific fields (only present for triple deposits via inline fragment)
    subject?: {
      term_id: string;
      label: string;
      image?: string;
      emoji?: string;
    };
    predicate?: {
      term_id: string;
      label: string;
      image?: string;
      emoji?: string;
    };
    object?: {
      term_id: string;
      label: string;
      image?: string;
      emoji?: string;
    };
  };
}

/**
 * Result type for GET_USER_VOTES_FOR_FOUNDER query
 */
export interface GetUserVotesForFounderResult {
  deposits: DepositWithTriple[];
}

/**
 * Result type for GET_FOUNDER_PANEL_STATS query
 */
export interface GetFounderPanelStatsResult {
  triples: Array<{
    term_id: string;
    triple_vault?: {
      total_assets: string;
    } | null;
    counter_term?: {
      total_assets: string;
    } | null;
  }>;
}

/**
 * Result type for GET_DEPOSITS_BY_TERM_IDS query
 */
export interface GetDepositsByTermIdsResult {
  deposits: Array<{
    term_id: string;
    sender_id: string;
    vault_type: string;
  }>;
}

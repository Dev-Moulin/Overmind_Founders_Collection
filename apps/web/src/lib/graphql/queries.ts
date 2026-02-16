import { gql } from '@apollo/client';

/**
 * GraphQL queries for INTUITION Protocol data
 *
 * Queries atoms (identities), triples (propositions), deposits (votes), and positions.
 */

/**
 * Get all triples (propositions) for a specific founder
 *
 * Returns all totem proposals for a founder where they are the subject
 * with the "has totem" or "embodies" predicate.
 */
export const GET_FOUNDER_PROPOSALS = gql`
  query GetFounderProposals($founderName: String!) {
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
      order_by: { created_at: desc }
    ) {
      term_id
      subject {
        term_id
        label
        image
        emoji
        type
      }
      predicate {
        term_id
        label
      }
      object {
        term_id
        label
        image
        emoji
        type
      }
      creator {
        id
      }
      creator_id
      triple_vault {
        total_shares
        total_assets
      }
      counter_term {
        id
        total_assets
      }
      block_number
      transaction_hash
      created_at
    }
  }
`;

/**
 * Get all proposals created by a specific user (wallet address)
 */
export const GET_USER_PROPOSALS = gql`
  query GetUserProposals($walletAddress: String!) {
    triples(
      where: {
        creator_id: { _eq: $walletAddress }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
      order_by: { created_at: desc }
    ) {
      term_id
      subject {
        term_id
        label
        image
        emoji
      }
      predicate {
        term_id
        label
      }
      object {
        term_id
        label
        image
        emoji
      }
      creator_id
      triple_vault {
        total_shares
        total_assets
      }
      counter_term {
        id
        total_assets
      }
      created_at
    }
  }
`;

/**
 * Count how many proposals a user has created for a specific founder
 *
 * Used to enforce the 3 proposals per founder limit
 */
export const COUNT_USER_PROPOSALS_FOR_FOUNDER = gql`
  query CountUserProposalsForFounder(
    $walletAddress: String!
    $founderName: String!
  ) {
    triples_aggregate(
      where: {
        creator_id: { _eq: $walletAddress }
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Get all deposits (votes) made by a user
 */
export const GET_USER_VOTES = gql`
  query GetUserVotes($walletAddress: String!) {
    deposits(
      where: { sender_id: { _eq: $walletAddress } }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      receiver_id
      term_id
      vault_type
      shares
      total_shares
      assets_after_fees
      block_number
      transaction_hash
      created_at
      curve_id
      term {
        id
        term_id
      }
    }
  }
`;

/**
 * Get detailed vote information including triple details
 */
export const GET_USER_VOTES_DETAILED = gql`
  query GetUserVotesDetailed($walletAddress: String!) {
    deposits(
      where: {
        sender_id: { _eq: $walletAddress }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
    }
  }
`;

/**
 * Get a specific triple by its ID
 */
export const GET_TRIPLE_BY_ID = gql`
  query GetTripleById($termId: String!) {
    triples(where: { term_id: { _eq: $termId } }, limit: 1) {
      term_id
      subject {
        term_id
        label
        image
        emoji
      }
      predicate {
        term_id
        label
      }
      object {
        term_id
        label
        image
        emoji
      }
      creator {
        id
      }
      creator_id
      triple_vault {
        total_shares
        total_assets
      }
      counter_term {
        id
        total_assets
      }
      created_at
      transaction_hash
    }
  }
`;

/**
 * Get an atom by its term_id
 */
export const GET_ATOM_BY_ID = gql`
  query GetAtomById($termId: String!) {
    atoms(where: { term_id: { _eq: $termId } }) {
      term_id
      id
      label
      image
      emoji
      type
      creator {
        id
      }
      creator_id
      created_at
      totalShares
      totalAssets
    }
  }
`;

/**
 * Search atoms by label (for autocomplete/search features)
 */
export const SEARCH_ATOMS = gql`
  query SearchAtoms($searchTerm: String!, $limit: Int = 10) {
    atoms(
      where: { label: { _ilike: $searchTerm } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      term_id
      label
      image
      emoji
      type
    }
  }
`;

/**
 * Get all triples with the "has totem" or "embodies" predicate
 * Used for getting all founder-totem proposals
 */
export const GET_ALL_PROPOSALS = gql`
  query GetAllProposals {
    triples(
      where: { predicate: { label: { _in: ["has totem", "embodies"] } } }
      order_by: { created_at: desc }
    ) {
      term_id
      subject {
        term_id
        label
        image
        emoji
        type
      }
      predicate {
        term_id
        label
        image
        emoji
      }
      object {
        term_id
        label
        image
        emoji
        type
      }
      creator {
        id
      }
      creator_id
      counter_term_id
      triple_vault {
        total_shares
        total_assets
      }
      counter_term {
        id
        total_assets
      }
      block_number
      transaction_hash
      created_at
    }
  }
`;

/**
 * Get all triples with our specific predicates (for VotePanel)
 * Includes object description to filter by category
 */
export const GET_TRIPLES_BY_PREDICATES = gql`
  query GetTriplesByPredicates($predicateLabels: [String!]!) {
    triples(
      where: { predicate: { label: { _in: $predicateLabels } } }
      order_by: { created_at: desc }
    ) {
      term_id
      subject {
        term_id
        label
        image
      }
      predicate {
        term_id
        label
      }
      object {
        term_id
        label
        image
        emoji
        description
      }
      triple_vault {
        total_shares
        total_assets
      }
      counter_term {
        id
        total_assets
      }
      created_at
    }
  }
`;

/**
 * Get user's position on a specific triple
 */
export const GET_USER_POSITION = gql`
  query GetUserPosition($walletAddress: String!, $termId: String!) {
    positions(
      where: { account_id: { _eq: $walletAddress }, term_id: { _eq: $termId } }
    ) {
      id
      account_id
      term_id
      shares
      total_deposit_assets_after_total_fees
      total_redeem_assets_for_receiver
      created_at
      updated_at
    }
  }
`;

/**
 * Get all deposits (votes) for a specific triple
 *
 * Returns all voters on a proposal (both FOR and AGAINST)
 */
export const GET_TRIPLE_VOTES = gql`
  query GetTripleVotes($termId: String!) {
    deposits(
      where: {
        term_id: { _eq: $termId }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { assets_after_fees: desc }
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
    }
  }
`;

/**
 * Get recent votes across all proposals
 *
 * For activity feed / recent votes display
 */
export const GET_RECENT_VOTES = gql`
  query GetRecentVotes($limit: Int = 20) {
    deposits(
      where: { vault_type: { _in: ["Triple", "CounterTriple"] } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
    }
  }
`;

/**
 * Get global vote statistics
 *
 * Aggregate stats for the entire platform
 */
export const GET_VOTE_STATS = gql`
  query GetVoteStats {
    deposits_aggregate(
      where: { vault_type: { _in: ["Triple", "CounterTriple"] } }
    ) {
      aggregate {
        count
        sum {
          assets_after_fees
        }
      }
      nodes {
        sender_id
      }
    }
  }
`;

/**
 * Get top voters leaderboard
 *
 * Aggregate deposits by sender to find top voters
 */
export const GET_TOP_VOTERS = gql`
  query GetTopVoters($limit: Int = 10) {
    deposits(
      where: { vault_type: { _in: ["Triple", "CounterTriple"] } }
      order_by: { assets_after_fees: desc }
      limit: $limit
    ) {
      sender_id
      assets_after_fees
      created_at
    }
  }
`;

/**
 * Get votes timeline for a specific triple
 *
 * Returns all deposits ordered by time for chart display
 */
export const GET_VOTES_TIMELINE = gql`
  query GetVotesTimeline($termId: String!) {
    deposits(
      where: {
        term_id: { _eq: $termId }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { created_at: asc }
    ) {
      id
      vault_type
      assets_after_fees
      created_at
    }
  }
`;

/**
 * Get all deposits for a triple to compute distribution
 *
 * Returns all vote amounts for histogram/distribution analysis
 */
export const GET_VOTES_DISTRIBUTION = gql`
  query GetVotesDistribution($termId: String!) {
    deposits(
      where: {
        term_id: { _eq: $termId }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { assets_after_fees: desc }
    ) {
      id
      sender_id
      vault_type
      assets_after_fees
    }
  }
`;

/**
 * Get founder statistics
 *
 * Returns all triples for a founder with vault data
 */
export const GET_FOUNDER_STATS = gql`
  query GetFounderStats($founderName: String!) {
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
    ) {
      term_id
      object {
        term_id
        label
      }
      triple_vault {
        total_assets
        total_shares
      }
      counter_term {
        id
        total_assets
      }
      created_at
    }
    deposits(
      where: {
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { created_at: desc }
      limit: 1
    ) {
      created_at
    }
  }
`;

/**
 * Get atoms by exact label match
 * Used for auditing founder atoms on INTUITION
 */
export const GET_ATOMS_BY_LABELS = gql`
  query GetAtomsByLabels($labels: [String!]!) {
    atoms(where: { label: { _in: $labels } }) {
      term_id
      label
      image
      emoji
      type
    }
  }
`;

/**
 * Get all predicates used in triples (distinct)
 * Since there's no "predicate" type, we get predicates from existing triples
 */
export const GET_ALL_PREDICATES = gql`
  query GetAllPredicates {
    triples(
      distinct_on: [predicate_id]
      limit: 100
    ) {
      predicate {
        term_id
        label
      }
    }
  }
`;

/**
 * Vérifie si un triple existe déjà par ses subject/predicate/object term_ids
 * Utilisé pour éviter l'erreur "TripleExists" lors de la création de claims
 * Note: utilise subject_id, predicate_id, object_id directement sur le triple
 */
export const GET_TRIPLE_BY_ATOMS = gql`
  query GetTripleByAtoms($subjectId: String!, $predicateId: String!, $objectId: String!) {
    triples(
      where: {
        subject_id: { _eq: $subjectId }
        predicate_id: { _eq: $predicateId }
        object_id: { _eq: $objectId }
      }
      limit: 1
    ) {
      term_id
      subject {
        term_id
        label
      }
      predicate {
        term_id
        label
      }
      object {
        term_id
        label
      }
      triple_vault {
        total_shares
        total_assets
      }
      counter_term {
        id
        total_assets
      }
      created_at
    }
  }
`;

/**
 * Get recent votes (deposits) for a specific founder
 *
 * DEPRECATED: This query only returns FOR votes because it filters by term.subject.label.
 * AGAINST votes are made on counter_term_id which doesn't have subject/predicate/object.
 *
 * Use useRecentVotesForFounder hook instead, which uses the two-query approach:
 * 1. GET_FOUNDER_TRIPLES_WITH_DETAILS to get term_ids + counter_term_ids
 * 2. GET_RECENT_VOTES_BY_TERM_IDS to get deposits for those term_ids
 *
 * @see useRecentVotesForFounder in hooks/data/useRecentVotesForFounder.ts
 * @see Section 17.10 in TODO_FIX_01_Discussion.md
 */
export const GET_FOUNDER_RECENT_VOTES = gql`
  query GetFounderRecentVotes($founderName: String!, $limit: Int = 10) {
    deposits(
      where: {
        term: {
          subject: { label: { _eq: $founderName } }
        }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
      term {
        term_id
        counter_term {
          id
        }
        subject {
          label
        }
        predicate {
          label
        }
        object {
          label
        }
      }
    }
  }
`;

/**
 * Get category for a specific totem via 3-Triples system
 *
 * Looks for triple: [Totem] [has category] [Category]
 * Where [Category] is marked by: [Category] [tag category] [Overmind Founders Collection]
 *
 * Note: This query returns the category without the OFC: prefix.
 * The category is validated by the existence of the tag triple.
 */
export const GET_TOTEM_CATEGORY = gql`
  query GetTotemCategory($totemId: String!) {
    triples(
      where: {
        subject_id: { _eq: $totemId }
        predicate: { label: { _eq: "has category" } }
      }
      limit: 1
    ) {
      term_id
      object {
        term_id
        label
      }
    }
  }
`;

/**
 * Get categories for multiple totems (batch query)
 *
 * Fetches categories for a list of totem IDs at once
 * Used to enrich proposals with category info
 */
export const GET_CATEGORIES_BY_TOTEMS = gql`
  query GetCategoriesByTotems($totemIds: [String!]!) {
    triples(
      where: {
        subject_id: { _in: $totemIds }
        predicate: { label: { _eq: "has category" } }
      }
    ) {
      term_id
      subject_id
      subject {
        term_id
        label
      }
      object {
        term_id
        label
      }
    }
  }
`;

/**
 * Get all totem categories (for statistics/debugging)
 *
 * Returns all category triples for totems tagged with "Overmind Founders Collection"
 */
export const GET_ALL_TOTEM_CATEGORIES = gql`
  query GetAllTotemCategories {
    triples(
      where: {
        predicate: { label: { _eq: "has category" } }
      }
      order_by: { created_at: desc }
    ) {
      term_id
      subject {
        term_id
        label
        image
      }
      object {
        term_id
        label
      }
      created_at
    }
  }
`;

/**
 * Get all totems of a specific category
 *
 * Returns all totems with a specific category label
 */
export const GET_TOTEMS_BY_CATEGORY = gql`
  query GetTotemsByCategory($categoryLabel: String!) {
    triples(
      where: {
        predicate: { label: { _eq: "has category" } }
        object: { label: { _eq: $categoryLabel } }
      }
    ) {
      term_id
      subject {
        term_id
        label
        image
      }
      object {
        term_id
        label
      }
    }
  }
`;

/**
 * Get voters for a specific totem (triple)
 * Returns the last N voters ordered by creation date (most recent first)
 */
export const GET_TOTEM_VOTERS = gql`
  query GetTotemVoters($termId: String!, $limit: Int = 50) {
    deposits(
      where: {
        term_id: { _eq: $termId }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      sender_id
      vault_type
      assets_after_fees
      shares
      created_at
      transaction_hash
    }
  }
`;

/**
 * Get user's votes for a specific founder with full triple details
 *
 * Returns deposits on triples where the subject is the founder,
 * including subject, predicate, and object images for display.
 * Format: [Img Subject] Subject - [Img Predicate] Predicate - [Img Object] Object  +X.XXX
 *
 * NOTE: Due to Hasura limitations with nested filters on polymorphic relations,
 * we fetch all triple deposits for the user and filter by founder client-side.
 * The filtering is done in useUserVotesForFounder hook.
 */
export const GET_USER_VOTES_FOR_FOUNDER = gql`
  query GetUserVotesForFounder($walletAddress: String!) {
    deposits(
      where: {
        sender_id: { _ilike: $walletAddress }
      }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
      term {
        id
        ... on triples {
          subject {
            term_id
            label
            image
            emoji
          }
          predicate {
            term_id
            label
            image
            emoji
          }
          object {
            term_id
            label
            image
            emoji
          }
        }
      }
    }
  }
`;

/**
 * Get founder panel stats: Market Cap, Holders, Claims
 *
 * Returns aggregated stats for the left panel:
 * - Total Market Cap = Σ(FOR + AGAINST) on all founder's triples
 * - Total Holders = count distinct sender_id
 * - Claims = count of distinct triples
 *
 * NOTE: Due to Hasura limitations with nested filters on polymorphic relations,
 * we use term_id filtering for deposits. The hook first gets triples by founder,
 * then uses those term_ids to filter deposits.
 */
export const GET_FOUNDER_PANEL_STATS = gql`
  query GetFounderPanelStats($founderName: String!) {
    # Get all triples for this founder to calculate Market Cap and Claims count
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
    ) {
      term_id
      object {
        term_id
      }
      triple_vault {
        total_assets
      }
      counter_term {
        id
        total_assets
      }
    }
  }
`;

/**
 * Get deposits for specific term IDs
 *
 * Used to count unique holders for a founder's triples.
 * Called after GET_FOUNDER_PANEL_STATS to get the term_ids.
 *
 * Note: term_ids are from triples, so deposits will only be triple deposits.
 * We include vault_type in response to filter client-side if needed.
 */
export const GET_DEPOSITS_BY_TERM_IDS = gql`
  query GetDepositsByTermIds($termIds: [String!]!) {
    deposits(
      where: {
        term_id: { _in: $termIds }
        vault_type: { _in: ["Triple", "CounterTriple"] }
      }
    ) {
      id
      term_id
      sender_id
      vault_type
      curve_id
      shares
      assets_after_fees
      created_at
      transaction_hash
    }
  }
`;

/**
 * Get user deposits (simple version without term details)
 *
 * Used by useUserVotesForFounder hook.
 * Returns basic deposit info, then we join with triples client-side.
 *
 * NOTE: Uses _ilike for case-insensitive wallet matching since
 * the DB stores checksummed addresses but frontend normalizes to lowercase.
 */
export const GET_USER_DEPOSITS_SIMPLE = gql`
  query GetUserDepositsSimple($walletAddress: String!) {
    deposits(
      where: { sender_id: { _ilike: $walletAddress } }
      order_by: { created_at: desc }
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
      curve_id
    }
  }
`;

/**
 * Get all positions for a user (ACCURATE: accounts for redeems)
 *
 * This is more accurate than deposits because positions track:
 * - total_deposit_assets_after_total_fees: sum of all deposits
 * - total_redeem_assets_for_receiver: sum of all withdrawals
 * - shares: current position (0 if fully redeemed)
 *
 * Current position value = deposits - redeems
 *
 * NOTE: Uses _ilike for case-insensitive wallet matching.
 */
export const GET_USER_POSITIONS_ALL = gql`
  query GetUserPositionsAll($walletAddress: String!) {
    positions(
      where: { account_id: { _ilike: $walletAddress } }
    ) {
      id
      account_id
      term_id
      shares
      curve_id
      total_deposit_assets_after_total_fees
      total_redeem_assets_for_receiver
      created_at
      updated_at
    }
  }
`;

/**
 * Get user's positions for specific term_ids (founder's triples)
 *
 * More efficient approach: instead of fetching ALL user positions and filtering client-side,
 * we fetch positions for specific term_ids (the founder's triples and their counter_terms).
 *
 * Used by useUserVotesForFounder hook:
 * 1. First get founder's triples (GET_FOUNDER_TRIPLES_WITH_DETAILS) to get term_ids + counter_term_ids
 * 2. Then get user's positions for those specific term_ids with this query
 *
 * NOTE: Uses _ilike for case-insensitive wallet matching.
 */
export const GET_USER_POSITIONS_FOR_TERMS = gql`
  query GetUserPositionsForTerms($walletAddress: String!, $termIds: [String!]!) {
    positions(
      where: {
        account_id: { _ilike: $walletAddress }
        term_id: { _in: $termIds }
      }
    ) {
      id
      account_id
      term_id
      shares
      curve_id
      total_deposit_assets_after_total_fees
      total_redeem_assets_for_receiver
      created_at
      updated_at
    }
  }
`;

/**
 * Get founder's triples with full subject/predicate/object details
 *
 * Used by useUserVotesForFounder hook to get triple info for display.
 * Returns all triples where this founder is the subject with "has totem" or "embodies" predicates.
 *
 * NOTE: Due to Hasura limitations with inline fragments on deposits.term,
 * we query triples directly and join with deposits client-side.
 */
export const GET_FOUNDER_TRIPLES_WITH_DETAILS = gql`
  query GetFounderTriplesWithDetails($founderName: String!) {
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
    ) {
      term_id
      counter_term_id
      subject {
        term_id
        label
        image
        emoji
      }
      predicate {
        term_id
        label
        image
        emoji
      }
      object {
        term_id
        label
        image
        emoji
      }
    }
  }
`;

/**
 * Get deposits for timeline (with full details)
 *
 * Used by useVotesTimeline to get deposits for founder's triples.
 * First we get term_ids from GET_FOUNDER_TRIPLES_WITH_DETAILS,
 * then we get deposits for those term_ids with this query.
 *
 * Different from GET_DEPOSITS_BY_TERM_IDS which only returns sender_id for counting.
 */
export const GET_DEPOSITS_FOR_TIMELINE = gql`
  query GetDepositsForTimeline($termIds: [String!]!, $limit: Int = 100) {
    deposits(
      where: {
        term_id: { _in: $termIds }
      }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      sender_id
      term_id
      vault_type
      shares
      assets_after_fees
      created_at
      transaction_hash
      curve_id
    }
  }
`;

/**
 * Get tags for a specific founder
 *
 * Returns all triples where the founder is subject and predicate is "has tag"
 */
export const GET_FOUNDER_TAGS = gql`
  query GetFounderTags($founderName: String!) {
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _eq: "has tag" } }
      }
      order_by: { created_at: desc }
    ) {
      term_id
      object {
        term_id
        label
      }
    }
  }
`;

// ============================================================================
// CURVE-SPECIFIC QUERIES - For Linear vs Progressive totals
// ============================================================================

/**
 * Get deposits aggregated by curve_id for a specific term
 *
 * Returns total assets deposited per curve (Linear=1, Progressive=4)
 * Grouped by vault_type (Triple for V2) to separate FOR/AGAINST
 *
 * @param termId - The triple's term_id (FOR deposits)
 * @param counterTermId - The triple's counter_term_id (AGAINST deposits)
 */
export const GET_DEPOSITS_BY_CURVE = gql`
  query GetDepositsByCurve($termId: String!, $counterTermId: String!) {
    # FOR deposits on termId
    for_linear: deposits_aggregate(
      where: {
        term_id: { _eq: $termId }
        curve_id: { _eq: "1" }
      }
    ) {
      aggregate {
        sum { assets_after_fees }
        count
      }
      nodes { sender_id }
    }
    for_progressive: deposits_aggregate(
      where: {
        term_id: { _eq: $termId }
        curve_id: { _eq: "2" }
      }
    ) {
      aggregate {
        sum { assets_after_fees }
        count
      }
      nodes { sender_id }
    }
    # AGAINST deposits on counterTermId
    against_linear: deposits_aggregate(
      where: {
        term_id: { _eq: $counterTermId }
        curve_id: { _eq: "1" }
      }
    ) {
      aggregate {
        sum { assets_after_fees }
        count
      }
      nodes { sender_id }
    }
    against_progressive: deposits_aggregate(
      where: {
        term_id: { _eq: $counterTermId }
        curve_id: { _eq: "2" }
      }
    ) {
      aggregate {
        sum { assets_after_fees }
        count
      }
      nodes { sender_id }
    }
  }
`;

/**
 * Get all deposits for a founder's triples, grouped by curve_id
 *
 * Used to calculate:
 * - Total TRUST per curve (Linear vs Progressive)
 * - Number of unique wallets per curve
 * - Top totem per curve (winner Linear vs winner Progressive)
 *
 * @param founderName - The founder's name
 */
export const GET_FOUNDER_DEPOSITS_BY_CURVE = gql`
  query GetFounderDepositsByCurve($founderName: String!) {
    # First get all triples for this founder
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _in: ["has totem", "embodies"] } }
      }
    ) {
      term_id
      object {
        term_id
        label
        image
      }
      counter_term {
        id
      }
    }
  }
`;

/**
 * Get deposits for multiple term_ids with curve breakdown
 *
 * @param termIds - Array of term_ids (triples and counter_terms)
 */
export const GET_DEPOSITS_FOR_TERMS_BY_CURVE = gql`
  query GetDepositsForTermsByCurve($termIds: [String!]!) {
    deposits(
      where: {
        term_id: { _in: $termIds }
      }
    ) {
      term_id
      sender_id
      curve_id
      assets_after_fees
      vault_type
    }
  }
`;

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
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
      where: { vault_type: { _in: ["triple_positive", "triple_negative"] } }
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
      where: { vault_type: { _in: ["triple_positive", "triple_negative"] } }
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
      where: { vault_type: { _in: ["triple_positive", "triple_negative"] } }
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
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
 * Fetches deposits made on triples where the subject is the founder.
 * Used for activity feed in the VotePanel.
 */
export const GET_FOUNDER_RECENT_VOTES = gql`
  query GetFounderRecentVotes($founderName: String!, $limit: Int = 10) {
    deposits(
      where: {
        term: {
          subject: { label: { _eq: $founderName } }
        }
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
        vault_type: { _in: ["triple_positive", "triple_negative"] }
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
      triple_vault {
        total_assets
      }
      counter_term {
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
      }
    ) {
      sender_id
      vault_type
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

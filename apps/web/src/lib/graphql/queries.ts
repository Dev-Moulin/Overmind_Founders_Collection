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
 * with the "represented_by" predicate.
 */
export const GET_FOUNDER_PROPOSALS = gql`
  query GetFounderProposals($founderName: String!) {
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _eq: "represented_by" } }
      }
      order_by: { created_at: desc }
    ) {
      id
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
      positiveVault {
        id
        totalShares
        totalAssets
        isActive
      }
      negativeVault {
        id
        totalShares
        totalAssets
        isActive
      }
      block_number
      transaction_hash
      created_at
      updated_at
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
        predicate: { label: { _eq: "represented_by" } }
      }
      order_by: { created_at: desc }
    ) {
      id
      term_id
      subject {
        term_id
        label
        image
        emoji
      }
      predicate {
        label
      }
      object {
        term_id
        label
        image
        emoji
      }
      creator_id
      positiveVault {
        totalShares
        totalAssets
      }
      negativeVault {
        totalShares
        totalAssets
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
        predicate: { label: { _eq: "represented_by" } }
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
  query GetTripleById($tripleId: String!) {
    triples_by_pk(id: $tripleId) {
      id
      term_id
      subject {
        term_id
        label
        image
        emoji
      }
      predicate {
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
      positiveVault {
        id
        totalShares
        totalAssets
      }
      negativeVault {
        id
        totalShares
        totalAssets
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
 * Get all triples with the "represented_by" predicate
 * Used for getting all founder-totem proposals
 */
export const GET_ALL_PROPOSALS = gql`
  query GetAllProposals {
    triples(
      where: { predicate: { label: { _eq: "represented_by" } } }
      order_by: { created_at: desc }
    ) {
      id
      term_id
      subject {
        term_id
        label
        image
      }
      object {
        term_id
        label
        image
        emoji
      }
      positiveVault {
        totalShares
        totalAssets
      }
      negativeVault {
        totalShares
        totalAssets
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

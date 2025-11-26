import { gql } from '@apollo/client';

/**
 * GraphQL Subscriptions for real-time updates
 *
 * Uses WebSocket connection to receive live updates from Hasura/INTUITION.
 * Subscriptions automatically push data when changes occur on-chain.
 */

/**
 * Subscribe to proposals for a specific founder
 *
 * Real-time updates when:
 * - New totem is proposed for the founder
 * - Vote is added (deposit in vault)
 * - Vote is removed (redeem from vault)
 */
export const SUBSCRIBE_FOUNDER_PROPOSALS = gql`
  subscription SubscribeFounderProposals($founderName: String!) {
    triples(
      where: {
        subject: { label: { _eq: $founderName } }
        predicate: { label: { _eq: "represented_by" } }
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
 * Subscribe to all proposals with our predicates
 *
 * Real-time updates for all founders' proposals
 * Used for global statistics and activity feed
 */
export const SUBSCRIBE_ALL_PROPOSALS = gql`
  subscription SubscribeAllProposals($predicateLabels: [String!]!) {
    triples(
      where: {
        predicate: { label: { _in: $predicateLabels } }
      }
      order_by: { created_at: desc }
      limit: 100
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
 * Subscribe to recent deposits (votes) on a specific claim
 *
 * Real-time updates when someone votes FOR or AGAINST
 */
export const SUBSCRIBE_CLAIM_DEPOSITS = gql`
  subscription SubscribeClaimDeposits($claimId: String!) {
    deposits(
      where: { triple_id: { _eq: $claimId } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      sender_id
      receiver_id
      assets_deposited
      shares_issued
      triple_id
      is_positive
      created_at
    }
  }
`;

/**
 * Subscribe to user's positions (their votes across all claims)
 *
 * Real-time updates when user's positions change
 */
export const SUBSCRIBE_USER_POSITIONS = gql`
  subscription SubscribeUserPositions($walletAddress: String!) {
    positions(
      where: { account_id: { _eq: $walletAddress } }
      order_by: { updated_at: desc }
    ) {
      id
      account_id
      triple_id
      shares
      is_positive
      triple {
        term_id
        subject {
          label
          image
        }
        predicate {
          label
        }
        object {
          label
          image
        }
        triple_vault {
          total_shares
          total_assets
        }
        counter_term {
          total_assets
        }
      }
      created_at
      updated_at
    }
  }
`;

/**
 * Subscribe to totem categories (OFC: system)
 *
 * Real-time updates when:
 * - New totem is categorized
 * - Category triple is created
 *
 * Uses the has_category predicate and OFC: prefix for filtering
 */
export const SUBSCRIBE_TOTEM_CATEGORIES = gql`
  subscription SubscribeTotemCategories {
    triples(
      where: {
        predicate: { label: { _eq: "has_category" } }
        object: { label: { _like: "OFC:%" } }
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
 * Get totem categories by totem IDs (batch query)
 *
 * Fetches categories for multiple totems at once
 * Used to enrich proposals with category info
 */
export const SUBSCRIBE_CATEGORIES_BY_TOTEMS = gql`
  subscription SubscribeCategoriesByTotems($totemIds: [String!]!) {
    triples(
      where: {
        subject_id: { _in: $totemIds }
        predicate: { label: { _eq: "has_category" } }
        object: { label: { _like: "OFC:%" } }
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

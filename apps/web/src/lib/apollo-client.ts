import { ApolloClient, InMemoryCache, HttpLink, split, type ApolloLink, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { getNetworkConfig } from './networkConfig';
import { createThrottleLink } from './throttleLink';

/**
 * Apollo Client configuration for INTUITION GraphQL API
 *
 * Connects to the INTUITION L3 subgraph to query atoms, triples, deposits, and positions.
 * Supports dynamic network switching between Testnet and Mainnet.
 *
 * Supports:
 * - HTTP for queries and mutations
 * - WebSocket for subscriptions (real-time updates)
 * - Dynamic network configuration (Testnet/Mainnet)
 */

// Get current network configuration
const networkConfig = getNetworkConfig();
const GRAPHQL_HTTP_ENDPOINT = networkConfig.graphqlHttp;
const GRAPHQL_WS_ENDPOINT = networkConfig.graphqlWs;

// Throttle link to prevent 429 rate limiting errors
// - Limits concurrent requests to 1 (very conservative)
// - Minimum 1000ms between requests (1 request/second max)
// - Auto-retry with exponential backoff on 429/network errors
const throttleLink = createThrottleLink({
  minDelay: 1000,     // 1s minimum between requests (matches API rate limit)
  maxConcurrent: 1,   // Only 1 concurrent request to avoid rate limiting
  maxRetries: 5,      // Retry 5 times on 429
  retryDelay: 3000,   // Start with 3s delay, doubles each retry
});

// HTTP Link for queries and mutations
const httpLink = new HttpLink({
  uri: GRAPHQL_HTTP_ENDPOINT,
});

// Throttled HTTP link chain
const throttledHttpLink = from([throttleLink, httpLink]);

// WebSocket Link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_ENDPOINT,
    // Reconnection settings
    retryAttempts: 5,
    shouldRetry: () => true,
    // Lazy connection - only connect when subscription is active
    lazy: true,
    // Connection callbacks - errors only
    on: {
      error: (err) => console.error('[Apollo] WebSocket error:', err),
    },
  })
);

// Split link: use WebSocket for subscriptions, throttled HTTP for everything else
// Type assertion needed due to multiple @apollo/client versions in monorepo
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink as unknown as ApolloLink,
  throttledHttpLink
);

/**
 * Apollo Client instance with in-memory cache
 * - Uses split link for HTTP queries/mutations and WebSocket subscriptions
 * - Cache policy: cache-and-network for best UX
 */
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cache triples by their ID
          triples: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          // Cache atoms by their term_id
          atoms: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          // Cache deposits
          deposits: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
          // Cache positions
          positions: {
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      // OPTIMIZED: Use cache-first to avoid excessive network requests
      // Components should use refetch() when they need fresh data
      fetchPolicy: 'cache-first',
      // After first fetch, always use cache to prevent re-fetch storms
      nextFetchPolicy: 'cache-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

/**
 * Apollo Client configuration for INTUITION GraphQL API
 *
 * Connects to the INTUITION testnet subgraph to query atoms, triples, deposits, and positions.
 * Base Sepolia testnet endpoint.
 */

const GRAPHQL_ENDPOINT = 'https://testnet.intuition.sh/v1/graphql';

const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
});

/**
 * Apollo Client instance with in-memory cache
 */
export const apolloClient = new ApolloClient({
  link: httpLink,
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
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

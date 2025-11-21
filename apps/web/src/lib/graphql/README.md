# GraphQL Integration - INTUITION Protocol

This directory contains the GraphQL setup for querying data from the INTUITION Protocol subgraph on Base Sepolia testnet.

## Files

- **`apollo-client.ts`** - Apollo Client configuration
- **`queries.ts`** - GraphQL queries for atoms, triples, deposits, and positions
- **`types.ts`** - TypeScript types for GraphQL schema

## Setup

The Apollo Client is already configured and wrapped around the app in [main.tsx](../../main.tsx:10-12).

```typescript
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo-client';

<ApolloProvider client={apolloClient}>
  <App />
</ApolloProvider>
```

## Available Queries

### 1. Get Founder Proposals

Fetches all totem proposals for a specific founder.

```graphql
query GetFounderProposals($founderName: String!) {
  triples(
    where: {
      subject: { label: { _eq: $founderName } }
      predicate: { label: { _eq: "represented_by" } }
    }
    order_by: { created_at: desc }
  ) {
    id
    subject { label image }
    object { label image emoji }
    positiveVault { totalShares totalAssets }
    negativeVault { totalShares totalAssets }
  }
}
```

### 2. Get User Proposals

Fetches all proposals created by a specific wallet address.

```graphql
query GetUserProposals($walletAddress: String!) {
  triples(
    where: {
      creator_id: { _eq: $walletAddress }
      predicate: { label: { _eq: "represented_by" } }
    }
    order_by: { created_at: desc }
  ) {
    # Same fields as above
  }
}
```

### 3. Count User Proposals for Founder

Checks how many proposals a user has created for a specific founder (to enforce 3 per founder limit).

```graphql
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
```

### 4. Get User Votes

Fetches all votes (deposits) made by a user.

```graphql
query GetUserVotes($walletAddress: String!) {
  deposits(
    where: { sender_id: { _eq: $walletAddress } }
    order_by: { created_at: desc }
  ) {
    id
    term_id
    vault_type
    shares
    assets_after_fees
    created_at
  }
}
```

## React Hooks

Custom React hooks are provided in [`/hooks`](../../hooks/):

### useFounderProposals

Fetch all proposals for a founder with computed vote counts.

```typescript
import { useFounderProposals } from '@/hooks';

function FounderPage() {
  const { proposals, loading, error, refetch } =
    useFounderProposals('Joseph Lubin');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {proposals.map((proposal) => (
        <div key={proposal.id}>
          <h3>{proposal.object.label}</h3>
          <p>FOR votes: {formatVoteAmount(proposal.votes.forVotes)}</p>
          <p>AGAINST votes: {formatVoteAmount(proposal.votes.againstVotes)}</p>
          <p>Percentage: {proposal.percentage}%</p>
        </div>
      ))}
    </div>
  );
}
```

### useUserProposals

Fetch all proposals created by a user.

```typescript
import { useUserProposals } from '@/hooks';
import { useAccount } from 'wagmi';

function MyProposals() {
  const { address } = useAccount();
  const { proposals, loading, error } = useUserProposals(address);

  // Same rendering as above
}
```

### useProposalLimit

Check if a user can create more proposals for a founder.

```typescript
import { useProposalLimit } from '@/hooks';

function ProposeButton({ founderName }: { founderName: string }) {
  const { address } = useAccount();
  const { count, canPropose, remaining, maxProposals } = useProposalLimit(
    address,
    founderName
  );

  if (!canPropose) {
    return (
      <div>
        You've reached the limit of {maxProposals} proposals for {founderName}
      </div>
    );
  }

  return (
    <button onClick={handlePropose}>
      Propose Totem ({remaining} remaining)
    </button>
  );
}
```

### useUserVotes

Fetch all votes made by a user.

```typescript
import { useUserVotes, formatTotalVotes, getTotalVotedAmount } from '@/hooks';

function MyVotes() {
  const { address } = useAccount();
  const { votes, loading, error } = useUserVotes(address);

  const totalVoted = getTotalVotedAmount(votes);

  return (
    <div>
      <p>Total voted: {formatTotalVotes(totalVoted)}</p>
      {votes.map((vote) => (
        <div key={vote.id}>
          <p>
            {vote.isPositive ? 'FOR' : 'AGAINST'} - {vote.formattedAmount} TRUST
          </p>
        </div>
      ))}
    </div>
  );
}
```

### useUserPosition

Get a user's position on a specific triple.

```typescript
import { useUserPosition } from '@/hooks';

function VoteButton({ tripleId }: { tripleId: string }) {
  const { address } = useAccount();
  const { hasPosition, shares, totalDeposited } = useUserPosition(
    address,
    tripleId
  );

  if (hasPosition) {
    return (
      <div>
        You have {shares} shares (deposited {totalDeposited} wei)
      </div>
    );
  }

  return <button>Vote on this proposal</button>;
}
```

## Helper Functions

### Vote Calculations

```typescript
import {
  sortProposalsByVotes,
  getWinningProposal,
  formatVoteAmount,
} from '@/hooks';

const sortedProposals = sortProposalsByVotes(proposals);
const winner = getWinningProposal(proposals);
const formattedAmount = formatVoteAmount('1000000000000000000', 2); // "1.00"
```

### Vote Filtering

```typescript
import {
  filterVotesByType,
  groupVotesByTerm,
  hasVotedOnTerm,
  getUserVoteDirection,
} from '@/hooks';

const forVotes = filterVotesByType(votes, 'triple_positive');
const groupedVotes = groupVotesByTerm(votes);
const hasVoted = hasVotedOnTerm(votes, tripleId);
const direction = getUserVoteDirection(votes, tripleId); // 'for' | 'against' | null
```

## TypeScript Types

All GraphQL types are exported from `types.ts`:

```typescript
import type {
  Atom,
  Triple,
  Deposit,
  Position,
  Vault,
  ProposalWithVotes,
  TripleVoteCounts,
} from '@/utils';

// Or import directly from lib/graphql/types
import type { Atom } from '@/lib/graphql/types';
```

## Testing

Mock data can be found in:

- [`/utils/mockData.ts`](../../utils/mockData.ts) - Mock founders and proposals
- Tests use these mocks to avoid real GraphQL queries

## Environment

- **Testnet URL**: `https://testnet.intuition.sh/v1/graphql`
- **Network**: Base Sepolia (Chain ID: 84532)
- **Schema**: [INTUITION GraphQL Schema](https://raw.githubusercontent.com/0xIntuition/intuition-ts/main/packages/graphql/schema.graphql)

## Next Steps

Replace mock data in the following files with real GraphQL queries:

- [ ] [`pages/ResultsPage.tsx`](../../pages/ResultsPage.tsx) - Use `GET_ALL_PROPOSALS`
- [ ] [`pages/FounderDetailsPage.tsx`](../../pages/FounderDetailsPage.tsx) - Use `useFounderProposals`
- [ ] [`pages/TotemDetailsPage.tsx`](../../pages/TotemDetailsPage.tsx) - Fetch triple by ID
- [ ] [`pages/MyVotesPage.tsx`](../../pages/MyVotesPage.tsx) - Use `useUserVotes`

See [Issue #34](https://github.com/Dev-Moulin/overmind-founders-collection/issues/34) for more details.

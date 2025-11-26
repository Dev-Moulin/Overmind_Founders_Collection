# useVoteStats

> Fichier: `apps/web/src/hooks/useVoteStats.ts`
> Lignes: 466

## Description

Ce fichier contient **7 hooks** pour les statistiques de votes : votes sur un triple, votes récents, stats globales, leaderboard, timeline, distribution, et stats par fondateur.

---

## Hooks

### 1. `useTripleVotes`

Récupère tous les votes sur un triple spécifique.

```typescript
export function useTripleVotes(termId: string | undefined): {
  votes: Deposit[];
  forVotes: Deposit[];
  againstVotes: Deposit[];
  totalFor: string;
  totalAgainst: string;
  formattedFor: string;
  formattedAgainst: string;
  uniqueVoters: number;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Exemple :**

```tsx
function ProposalStats({ termId }: Props) {
  const { formattedFor, formattedAgainst, uniqueVoters } = useTripleVotes(termId);

  return (
    <div className="stats-bar">
      <span className="for">FOR: {formattedFor} TRUST</span>
      <span className="against">AGAINST: {formattedAgainst} TRUST</span>
      <span className="voters">{uniqueVoters} voteurs</span>
    </div>
  );
}
```

---

### 2. `useRecentVotes`

Récupère les votes récents avec polling automatique (30s).

```typescript
export function useRecentVotes(limit: number = 20): {
  recentVotes: Array<{
    ...Deposit,
    isPositive: boolean,
    formattedAmount: string
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Exemple :**

```tsx
function ActivityFeed() {
  const { recentVotes } = useRecentVotes(10);

  return (
    <div className="activity-feed">
      <h3>Activité récente</h3>
      {recentVotes.map(vote => (
        <div key={vote.id} className="activity-item">
          <span>{vote.sender_id.slice(0,8)}...</span>
          <span>{vote.isPositive ? 'FOR' : 'AGAINST'}</span>
          <span>{vote.formattedAmount} TRUST</span>
        </div>
      ))}
    </div>
  );
}
```

**Polling :** Les données sont rafraîchies automatiquement toutes les 30 secondes.

---

### 3. `useGlobalVoteStats`

Statistiques globales de la plateforme.

```typescript
export function useGlobalVoteStats(): {
  stats: VoteStats;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Type `VoteStats` :**

```typescript
interface VoteStats {
  totalVotes: number;
  totalTrustDeposited: string;  // Wei
  uniqueVoters: number;
  averageVoteAmount: string;    // Wei
  formattedTotal: string;
  formattedAverage: string;
}
```

**Exemple :**

```tsx
function GlobalStats() {
  const { stats, loading } = useGlobalVoteStats();

  return (
    <div className="global-stats">
      <div>Total votes: {stats.totalVotes}</div>
      <div>TRUST déposé: {stats.formattedTotal}</div>
      <div>Voteurs uniques: {stats.uniqueVoters}</div>
      <div>Vote moyen: {stats.formattedAverage}</div>
    </div>
  );
}
```

---

### 4. `useTopVoters`

Leaderboard des meilleurs voteurs.

```typescript
export function useTopVoters(limit: number = 10): {
  topVoters: AggregatedVoter[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Type `AggregatedVoter` :**

```typescript
interface AggregatedVoter {
  address: string;
  totalVoted: string;      // Wei
  voteCount: number;
  formattedTotal: string;
}
```

**Exemple :**

```tsx
function Leaderboard() {
  const { topVoters } = useTopVoters(5);

  return (
    <div className="leaderboard">
      <h3>🏆 Top Voteurs</h3>
      {topVoters.map((voter, i) => (
        <div key={voter.address} className="rank">
          <span>#{i + 1}</span>
          <span>{voter.address.slice(0,8)}...</span>
          <span>{voter.formattedTotal} TRUST</span>
          <span>({voter.voteCount} votes)</span>
        </div>
      ))}
    </div>
  );
}
```

---

### 5. `useVotesTimeline`

Timeline des votes pour un triple (données pour graphiques).

```typescript
export function useVotesTimeline(termId: string | undefined): {
  timeline: TimelineDataPoint[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Type `TimelineDataPoint` :**

```typescript
interface TimelineDataPoint {
  timestamp: string;
  date: Date;
  cumulativeFor: bigint;
  cumulativeAgainst: bigint;
  cumulativeNet: bigint;
  formattedFor: string;
  formattedAgainst: string;
  formattedNet: string;
}
```

**Exemple avec Recharts :**

```tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

function VoteTimelineChart({ termId }: Props) {
  const { timeline } = useVotesTimeline(termId);

  // Transformer pour Recharts
  const chartData = timeline.map(point => ({
    time: point.date.toLocaleDateString(),
    for: parseFloat(point.formattedFor),
    against: parseFloat(point.formattedAgainst),
    net: parseFloat(point.formattedNet),
  }));

  return (
    <LineChart data={chartData} width={600} height={300}>
      <XAxis dataKey="time" />
      <YAxis />
      <Line type="monotone" dataKey="for" stroke="#22c55e" name="FOR" />
      <Line type="monotone" dataKey="against" stroke="#ef4444" name="AGAINST" />
      <Line type="monotone" dataKey="net" stroke="#8b5cf6" name="NET" />
    </LineChart>
  );
}
```

---

### 6. `useVotesDistribution`

Distribution des votes par tranches de montant (pour histogrammes).

```typescript
export function useVotesDistribution(termId: string | undefined): {
  buckets: DistributionBucket[];
  topVoters: Array<{
    address: string;
    amount: string;
    formattedAmount: string;
    isPositive: boolean;
  }>;
  totalVotes: number;
  top10Percentage: number;
  othersTotal: string;
  formattedOthersTotal: string;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Type `DistributionBucket` :**

```typescript
interface DistributionBucket {
  range: string;         // "0-0.1", "0.1-1", "1-5", etc.
  minAmount: bigint;
  maxAmount: bigint;
  count: number;
  totalAmount: bigint;
  formattedTotal: string;
}
```

**Tranches prédéfinies :**

| Range | Min (ETH) | Max (ETH) |
|-------|-----------|-----------|
| 0-0.1 | 0 | 0.1 |
| 0.1-1 | 0.1 | 1 |
| 1-5 | 1 | 5 |
| 5-10 | 5 | 10 |
| 10-50 | 10 | 50 |
| 50+ | 50 | ∞ |

**Exemple :**

```tsx
function VoteDistribution({ termId }: Props) {
  const { buckets, top10Percentage } = useVotesDistribution(termId);

  return (
    <div>
      <h3>Distribution des votes</h3>
      {buckets.map(bucket => (
        <div key={bucket.range} className="bucket">
          <span>{bucket.range} ETH</span>
          <span>{bucket.count} votes</span>
          <span>{bucket.formattedTotal} total</span>
        </div>
      ))}
      <p>Top 10 voteurs: {top10Percentage}% du total</p>
    </div>
  );
}
```

---

### 7. `useFounderStats`

Statistiques détaillées pour un fondateur spécifique.

```typescript
export function useFounderStats(founderName: string | undefined): {
  stats: FounderStats | null;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Type `FounderStats` :**

```typescript
interface FounderStats {
  founderName: string;
  totalTrust: string;        // Wei
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
```

**Exemple :**

```tsx
function FounderStatsCard({ name }: { name: string }) {
  const { stats, loading } = useFounderStats(name);

  if (!stats) return null;

  return (
    <div className="founder-stats">
      <h3>{stats.founderName}</h3>
      <p>Total TRUST: {stats.formattedTrust}</p>
      <p>Propositions: {stats.proposalCount}</p>

      <h4>Distribution des totems</h4>
      {stats.totemDistribution.map(t => (
        <div key={t.totemId}>
          {t.totemLabel}: {formatEther(BigInt(t.netScore))} NET
        </div>
      ))}
    </div>
  );
}
```

---

## Résumé des Hooks

| Hook | Paramètre | Cas d'usage |
|------|-----------|-------------|
| `useTripleVotes` | termId | Stats d'un triple spécifique |
| `useRecentVotes` | limit | Feed d'activité en temps réel |
| `useGlobalVoteStats` | - | Dashboard global |
| `useTopVoters` | limit | Leaderboard |
| `useVotesTimeline` | termId | Graphique évolution votes |
| `useVotesDistribution` | termId | Histogramme distribution |
| `useFounderStats` | founderName | Page détail fondateur |

---

## Dépendances

- `@apollo/client` : `useQuery`
- `viem` : `formatEther`, `parseEther`
- Queries depuis `../lib/graphql/queries`
- Types depuis `../lib/graphql/types`

---

**Dernière mise à jour** : 25 novembre 2025

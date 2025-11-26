# usePlatformStats

> Fichier: `apps/web/src/hooks/usePlatformStats.ts`
> Lignes: 167

## Description

Hook pour récupérer les statistiques globales de la plateforme, incluant le totem le plus voté globalement.

---

## Interface

```typescript
export function usePlatformStats(): {
  stats: PlatformStats;
  loading: boolean;
  error: ApolloError | undefined;
};
```

---

## Types

### `PlatformStats`

```typescript
interface PlatformStats {
  totalVotes: number;           // Nombre total de votes
  totalTrustDeposited: string;  // Wei string
  formattedTotalTrust: string;  // Formaté (ex: "1234.56")
  uniqueVoters: number;         // Voteurs uniques
  totalFounders: number;        // Fondateurs uniques
  totalTotems: number;          // Totems uniques
  foundersWithWinners: number;  // Fondateurs avec totem gagnant (netScore > 0)
  topTotem: TopTotem | null;    // Totem #1 global
}
```

### `TopTotem`

```typescript
interface TopTotem {
  totemId: string;
  totemLabel: string;
  totemImage?: string;
  founderName: string;        // Fondateur associé
  netScore: bigint;
  formattedNetScore: string;
  totalFor: bigint;
  totalAgainst: bigint;
  claimCount: number;
}
```

---

## Exemple d'Utilisation

```tsx
function StatsPage() {
  const { stats, loading, error } = usePlatformStats();

  if (loading) return <div>Chargement des statistiques...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="stats-dashboard">
      {/* Stats générales */}
      <div className="stats-grid">
        <StatCard
          label="Total Votes"
          value={stats.totalVotes}
          icon="🗳️"
        />
        <StatCard
          label="TRUST Déposé"
          value={`${stats.formattedTotalTrust} TRUST`}
          icon="💎"
        />
        <StatCard
          label="Voteurs Uniques"
          value={stats.uniqueVoters}
          icon="👥"
        />
        <StatCard
          label="Fondateurs"
          value={stats.totalFounders}
          icon="🎓"
        />
        <StatCard
          label="Totems"
          value={stats.totalTotems}
          icon="🦁"
        />
        <StatCard
          label="Avec Gagnant"
          value={`${stats.foundersWithWinners}/${stats.totalFounders}`}
          icon="🏆"
        />
      </div>

      {/* Totem #1 Global */}
      {stats.topTotem && (
        <div className="top-totem-card">
          <h2>🥇 Totem le Plus Voté</h2>
          {stats.topTotem.totemImage && (
            <img src={stats.topTotem.totemImage} alt={stats.topTotem.totemLabel} />
          )}
          <h3>{stats.topTotem.totemLabel}</h3>
          <p>Pour: {stats.topTotem.founderName}</p>
          <p className="net-score">{stats.topTotem.formattedNetScore} TRUST NET</p>
          <p className="details">
            FOR: {formatEther(stats.topTotem.totalFor)} |
            AGAINST: {formatEther(stats.topTotem.totalAgainst)}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Logique Interne

### Requêtes Combinées

Le hook combine deux requêtes GraphQL :

```typescript
// 1. Stats globales des votes
const { data: voteStatsData } = useQuery<GetVoteStatsResult>(GET_VOTE_STATS);

// 2. Tous les triples pour agrégation
const { data: proposalsData } = useQuery(GET_ALL_PROPOSALS, {
  fetchPolicy: 'cache-and-network',
});
```

### Calcul du Top Totem

```typescript
// Agrège tous les totems globalement
const allAggregatedTotems = aggregateTriplesByObject(proposalsData.triples);

// Le premier = celui avec le plus haut netScore
const topTotem = allAggregatedTotems[0];

// Trouve le fondateur associé
const founderTriple = proposalsData.triples.find(
  (t: Triple) => t.object.term_id === top.objectId
);
```

### Comptage des Fondateurs avec Gagnant

```typescript
// Un fondateur a un "gagnant" si son totem #1 a un netScore > 0
founderMap.forEach((triples) => {
  const founderTotems = aggregateTriplesByObject(triples);
  if (founderTotems.length > 0 && founderTotems[0].netScore > 0n) {
    foundersWithWinners++;
  }
});
```

---

## Requêtes GraphQL Utilisées

| Query | Description |
|-------|-------------|
| `GET_VOTE_STATS` | Agrégation des deposits (count, sum) |
| `GET_ALL_PROPOSALS` | Tous les triples pour agrégation |

---

## Différence avec useGlobalVoteStats

| Aspect | usePlatformStats | useGlobalVoteStats |
|--------|------------------|---------------------|
| Focus | Plateforme complète | Votes uniquement |
| Top Totem | ✅ Inclus | ❌ Non inclus |
| Comptages | Fondateurs, totems | Votes, voteurs |
| Requêtes | 2 (votes + proposals) | 1 (votes) |

---

## Valeurs par Défaut

Si les données ne sont pas chargées :

```typescript
const defaultStats: PlatformStats = {
  totalVotes: 0,
  totalTrustDeposited: '0',
  formattedTotalTrust: '0',
  uniqueVoters: 0,
  totalFounders: 0,
  totalTotems: 0,
  foundersWithWinners: 0,
  topTotem: null,
};
```

---

## Dépendances

- `@apollo/client` : `useQuery`
- `viem` : `formatEther`
- `aggregateTriplesByObject` depuis `../utils/aggregateVotes`
- Queries et types depuis `../lib/graphql/*`

---

## Cas d'Usage

| Page | Utilisation |
|------|-------------|
| HomePage | Stats en bref dans le hero |
| StatsPage | Dashboard complet |
| AdminPage | Monitoring de la plateforme |
| Footer | Compteurs rapides |

---

**Dernière mise à jour** : 25 novembre 2025

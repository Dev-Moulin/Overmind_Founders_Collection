# useAllTotems

> Fichier: `apps/web/src/hooks/useAllTotems.ts`
> Lignes: 142

## Description

Hook pour récupérer tous les totems agrégés par objet (totem). Utilisé principalement par la VotePage pour afficher les totems avec leurs multiples claims.

---

## Interface

```typescript
export function useAllTotems(): {
  totems: AggregatedTotem[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

---

## Types

### `AggregatedTotem`

```typescript
interface AggregatedTotem {
  totemId: string;       // Object term_id
  totemLabel: string;    // Label du totem (ex: "Lion")
  totemImage?: string;   // URL de l'image
  founder: {
    id: string;
    name: string;
    image?: string;
  };
  claims: ExtendedClaim[];
  totalFor: bigint;
  totalAgainst: bigint;
  netScore: bigint;      // totalFor - totalAgainst
  claimCount: number;
  topPredicate: string;  // Prédicat le plus utilisé
}
```

### `ExtendedClaim`

```typescript
interface ExtendedClaim extends BaseClaim {
  forVotes: bigint;      // Alias pour trustFor
  againstVotes: bigint;  // Alias pour trustAgainst
}
```

### `BaseClaim`

```typescript
interface BaseClaim {
  termId: string;
  predicate: string;
  trustFor: bigint;
  trustAgainst: bigint;
}
```

---

## Exemple d'Utilisation

```tsx
function VotePage() {
  const { totems, loading, error, refetch } = useAllTotems();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="totems-grid">
      {totems.map(totem => (
        <TotemCard key={totem.totemId} totem={totem} />
      ))}
    </div>
  );
}

function TotemCard({ totem }: { totem: AggregatedTotem }) {
  return (
    <div className="totem-card">
      {totem.totemImage && (
        <img src={totem.totemImage} alt={totem.totemLabel} />
      )}

      <h3>{totem.totemLabel}</h3>
      <p>Fondateur: {totem.founder.name}</p>
      <p>Prédicat principal: {totem.topPredicate}</p>

      <div className="votes">
        <span className="for">FOR: {formatEther(totem.totalFor)}</span>
        <span className="against">AGAINST: {formatEther(totem.totalAgainst)}</span>
        <span className="net">NET: {formatEther(totem.netScore)}</span>
      </div>

      <p>{totem.claimCount} claims</p>
    </div>
  );
}
```

---

## Logique Interne

### 1. Récupération des Données

```typescript
const { data, loading, error, refetch } = useQuery(GET_ALL_PROPOSALS, {
  fetchPolicy: 'cache-and-network',
});
```

### 2. Agrégation par Totem

```typescript
// Utilise la fonction utilitaire d'agrégation
const baseAggregated = aggregateTriplesByObject(data.triples);

// Groupe les triples originaux par totem pour info supplémentaire
const totemMap = new Map<string, Triple[]>();
data.triples.forEach((triple: Triple) => {
  const totemId = triple.object.term_id;
  if (!totemMap.has(totemId)) {
    totemMap.set(totemId, []);
  }
  totemMap.get(totemId)!.push(triple);
});
```

### 3. Calcul du Top Prédicat

```typescript
// Trouve le prédicat le plus utilisé pour ce totem
const predicateCounts = new Map<string, number>();
base.claims.forEach((c) => {
  predicateCounts.set(
    c.predicate,
    (predicateCounts.get(c.predicate) || 0) + 1
  );
});

let topPredicate = base.claims[0]?.predicate || 'represented_by';
let maxCount = 0;
predicateCounts.forEach((count, pred) => {
  if (count > maxCount) {
    maxCount = count;
    topPredicate = pred;
  }
});
```

### 4. Extension des Claims

```typescript
// Ajoute des alias pour la rétrocompatibilité
const extendedClaims: ExtendedClaim[] = base.claims.map((claim) => ({
  ...claim,
  forVotes: claim.trustFor,
  againstVotes: claim.trustAgainst,
}));
```

---

## Différence avec useAllProposals

| Aspect | useAllTotems | useAllProposals |
|--------|--------------|-----------------|
| Groupement | Par objet (totem) | Par sujet (fondateur) |
| Focus | Totems et leurs claims | Fondateurs et leurs totems gagnants |
| Cas d'usage | VotePage, liste des totems | ResultsPage, classement des fondateurs |

---

## Query GraphQL

Utilise la même query que `useAllProposals`:

```graphql
query GetAllProposals {
  triples(
    where: { subject: { type: { _eq: "Person" } } }
    order_by: { created_at: desc }
  ) {
    term_id
    subject { term_id, label, image }
    predicate { term_id, label }
    object { term_id, label, image, description }
    triple_vault { total_assets, total_shares }
    counter_term { id, total_assets }
    created_at
  }
}
```

---

## Dépendances

- `@apollo/client` : `useQuery`
- `aggregateTriplesByObject` depuis `../utils/aggregateVotes`
- `GET_ALL_PROPOSALS` depuis `../lib/graphql/queries`

---

## Tri

Les totems sont retournés **triés par netScore décroissant** grâce à la fonction `aggregateTriplesByObject`.

---

**Dernière mise à jour** : 25 novembre 2025

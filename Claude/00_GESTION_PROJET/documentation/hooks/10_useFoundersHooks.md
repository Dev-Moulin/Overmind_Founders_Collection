# Hooks Fondateurs

> Fichiers:
> - `apps/web/src/hooks/useFoundersWithAtomIds.ts` (55 lignes)
> - `apps/web/src/hooks/useFoundersForHomePage.ts` (178 lignes)

## Description

Ces deux hooks permettent de récupérer les données des 42 fondateurs enrichies avec leurs informations blockchain.

---

## 1. useFoundersWithAtomIds

Hook de base pour récupérer les fondateurs avec leurs atom IDs INTUITION.

### Interface

```typescript
export function useFoundersWithAtomIds(): {
  founders: FounderData[];
  loading: boolean;
  error: ApolloError | undefined;
  totalFounders: number;      // 42
  foundersWithAtoms: number;  // Nombre avec atomId résolu
};
```

### Logique

1. Charge les 42 fondateurs depuis `packages/shared/src/data/founders.json`
2. Requête GraphQL pour obtenir les atom IDs par label (nom)
3. Enrichit chaque fondateur avec son `atomId`

### Exemple

```tsx
function FoundersList() {
  const { founders, loading, foundersWithAtoms } = useFoundersWithAtomIds();

  return (
    <div>
      <p>{foundersWithAtoms}/42 fondateurs avec atoms</p>
      {founders.map(f => (
        <div key={f.id}>
          {f.name} - {f.atomId ? `Atom: ${f.atomId}` : 'Pas d\'atom'}
        </div>
      ))}
    </div>
  );
}
```

---

## 2. useFoundersForHomePage

Hook complet pour la HomePage : fondateurs + atom IDs + totem gagnant.

### Interface

```typescript
export function useFoundersForHomePage(): {
  founders: FounderForHomePage[];
  loading: boolean;
  error: ApolloError | undefined;
  stats: {
    totalFounders: number;
    foundersWithAtoms: number;
    foundersWithTotems: number;
    totalProposals: number;
  };
};
```

### Types

```typescript
interface FounderForHomePage extends FounderData {
  winningTotem: WinningTotem | null;
  proposalCount: number;
}

interface WinningTotem {
  objectId: string;
  label: string;
  image?: string;
  netScore: bigint;
  totalFor: bigint;
  totalAgainst: bigint;
  claimCount: number;
}
```

### Logique

1. Charge les 42 fondateurs depuis le JSON
2. Requête 1: Obtient les atom IDs (`GET_ATOMS_BY_LABELS`)
3. Requête 2: Obtient tous les triples (`GET_ALL_PROPOSALS`)
4. Groupe les triples par fondateur
5. Pour chaque fondateur, agrège ses totems et trouve le gagnant
6. Retourne les fondateurs enrichis avec stats

### Exemple Complet

```tsx
function HomePage() {
  const { founders, loading, error, stats } = useFoundersForHomePage();

  if (loading) return <LoadingGrid count={42} />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* Stats */}
      <div className="stats-bar">
        <span>{stats.totalFounders} fondateurs</span>
        <span>{stats.foundersWithTotems} avec totem</span>
        <span>{stats.totalProposals} propositions</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 gap-4">
        {founders.map(founder => (
          <FounderHomeCard
            key={founder.id}
            founder={founder}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

function FounderHomeCard({ founder }: { founder: FounderForHomePage }) {
  return (
    <div className="founder-card">
      <img src={founder.imageUrl} alt={founder.name} />
      <h3>{founder.name}</h3>

      {founder.winningTotem ? (
        <div className="winning-totem">
          <span className="label">{founder.winningTotem.label}</span>
          <span className="score">
            {formatEther(founder.winningTotem.netScore)} TRUST
          </span>
        </div>
      ) : (
        <p className="no-totem">Pas encore de totem</p>
      )}

      <p>{founder.proposalCount} propositions</p>
    </div>
  );
}
```

---

## Comparaison

| Aspect | useFoundersWithAtomIds | useFoundersForHomePage |
|--------|------------------------|------------------------|
| Atom IDs | ✅ | ✅ |
| Winning Totem | ❌ | ✅ |
| Proposal Count | ❌ | ✅ |
| Requêtes GraphQL | 1 | 2 |
| Cas d'usage | Liste simple | HomePage complète |

---

## Source de Données

### founders.json

```json
[
  {
    "id": "1",
    "name": "Vitalik Buterin",
    "shortBio": "Co-fondateur d'Ethereum...",
    "imageUrl": "https://...",
    "externalLinks": {
      "twitter": "...",
      "website": "..."
    }
  },
  // ... 41 autres fondateurs
]
```

### Requêtes GraphQL

```graphql
# GET_ATOMS_BY_LABELS
query GetAtomsByLabels($labels: [String!]!) {
  atoms(where: { label: { _in: $labels } }) {
    term_id
    label
  }
}

# GET_ALL_PROPOSALS
query GetAllProposals {
  triples(where: { subject: { type: { _eq: "Person" } } }) {
    term_id
    subject { label }
    object { term_id, label, image }
    triple_vault { total_assets }
    counter_term { total_assets }
  }
}
```

---

## Performance

### useFoundersForHomePage

- Utilise `useMemo` pour éviter les recalculs inutiles
- `fetchPolicy: 'cache-first'` pour les atoms (données stables)
- `fetchPolicy: 'cache-and-network'` pour les proposals (données dynamiques)

```typescript
const result = useMemo(() => {
  // Traitement lourd uniquement si les données changent
  // ...
}, [founders, atomsData, proposalsData]);
```

---

## Dépendances

- `@apollo/client` : `useQuery`
- `react` : `useMemo`
- `aggregateTriplesByObject` depuis `../utils/aggregateVotes`
- Queries depuis `../lib/graphql/queries`
- Types depuis `../lib/graphql/types`

---

**Dernière mise à jour** : 25 novembre 2025

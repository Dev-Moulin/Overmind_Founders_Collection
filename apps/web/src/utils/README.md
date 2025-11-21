# Utils - Aggregation des Votes

Fonctions utilitaires pour agréger les votes INTUITION par totem.

## Vue d'ensemble

Le protocole INTUITION traite chaque triple comme une entité unique avec ses propres vaults. Pour déterminer le totem gagnant, nous devons agréger tous les claims (triples) qui pointent vers le même objet (totem).

## Installation

```typescript
import {
  aggregateTriplesByObject,
  getWinningTotem,
  formatTrustAmount,
  type Triple,
  type AggregatedTotem,
} from '@/utils';
```

## Fonctions

### `aggregateTriplesByObject(triples: Triple[]): AggregatedTotem[]`

Agrège les triples par leur objet (totem) et calcule les scores totaux.

**Exemple:**

```typescript
const triples = [
  {
    id: '0x1',
    predicate: { id: 'pred1', label: 'is represented by' },
    object: { id: 'lion', label: 'Lion' },
    positiveVault: { totalAssets: '50000000000000000000' }, // 50 TRUST
    negativeVault: { totalAssets: '5000000000000000000' }, // 5 TRUST
  },
  {
    id: '0x2',
    predicate: { id: 'pred2', label: 'embodies' },
    object: { id: 'lion', label: 'Lion' },
    positiveVault: { totalAssets: '30000000000000000000' }, // 30 TRUST
    negativeVault: { totalAssets: '2000000000000000000' }, // 2 TRUST
  },
];

const aggregated = aggregateTriplesByObject(triples);
// Résultat: Lion a un NET score de 73 (45 + 28)
```

**Retourne:**

```typescript
[
  {
    objectId: 'lion',
    object: { id: 'lion', label: 'Lion', ... },
    claims: [
      {
        tripleId: '0x1',
        predicate: 'is represented by',
        netScore: 45000000000000000000n,
        trustFor: 50000000000000000000n,
        trustAgainst: 5000000000000000000n,
      },
      {
        tripleId: '0x2',
        predicate: 'embodies',
        netScore: 28000000000000000000n,
        trustFor: 30000000000000000000n,
        trustAgainst: 2000000000000000000n,
      },
    ],
    netScore: 73000000000000000000n, // Somme des NET scores
    totalFor: 80000000000000000000n, // Somme des FOR
    totalAgainst: 7000000000000000000n, // Somme des AGAINST
    claimCount: 2,
  },
];
```

### `getWinningTotem(totems: AggregatedTotem[]): AggregatedTotem | null`

Retourne le totem avec le NET score le plus élevé.

**Exemple:**

```typescript
const aggregated = aggregateTriplesByObject(triples);
const winner = getWinningTotem(aggregated);

console.log(winner?.object.label); // "Lion"
console.log(formatTrustAmount(winner?.netScore)); // "73.00"
```

### `formatTrustAmount(amount: bigint, decimals?: number): string`

Formate un montant TRUST (18 decimals) en string lisible.

**Exemples:**

```typescript
formatTrustAmount(1000000000000000000n); // "1.00"
formatTrustAmount(1500000000000000000n); // "1.50"
formatTrustAmount(50000000000000000000n); // "50.00"
formatTrustAmount(1234567890000000000n, 4); // "1.2345"
```

## Utilisation dans les composants

### Page Results (tous les fondateurs)

```typescript
import { aggregateTriplesByObject, getWinningTotem } from '@/utils';

function ResultsPage() {
  const { data: founders } = useQuery({
    queryKey: ['founders'],
    queryFn: async () => {
      // Query GraphQL pour récupérer tous les triples de tous les fondateurs
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          query: `
            query GetAllFounders {
              founders: atoms(where: { label: { _in: [...] } }) {
                id
                label
                outgoing_triples {
                  id
                  predicate { id, label }
                  object { id, label, image }
                  positiveVault { totalAssets }
                  negativeVault { totalAssets }
                }
              }
            }
          `,
        }),
      });

      const { data } = await response.json();

      // Agréger les totems pour chaque fondateur
      return data.founders.map((founder) => {
        const aggregated = aggregateTriplesByObject(founder.outgoing_triples);
        const winner = getWinningTotem(aggregated);

        return {
          ...founder,
          winningTotem: winner,
        };
      });
    },
  });

  return (
    <div>
      {founders?.map((founder) => (
        <FounderCard
          key={founder.id}
          founder={founder}
          totem={founder.winningTotem}
        />
      ))}
    </div>
  );
}
```

### Page FounderDetails (détails d'un fondateur)

```typescript
import { aggregateTriplesByObject, formatTrustAmount } from '@/utils';

function FounderDetailsPage({ founderId }: { founderId: string }) {
  const { data } = useQuery({
    queryKey: ['founder', founderId],
    queryFn: async () => {
      // Query GraphQL pour un fondateur spécifique
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          query: `
            query GetFounder($id: String!) {
              founder: atoms_by_pk(id: $id) {
                id
                label
                outgoing_triples {
                  id
                  predicate { id, label }
                  object { id, label, image, description }
                  positiveVault { totalAssets }
                  negativeVault { totalAssets }
                }
              }
            }
          `,
          variables: { id: founderId },
        }),
      });

      const { data } = await response.json();
      const aggregated = aggregateTriplesByObject(data.founder.outgoing_triples);

      return {
        founder: data.founder,
        totems: aggregated.sort((a, b) => {
          if (a.netScore > b.netScore) return -1;
          if (a.netScore < b.netScore) return 1;
          return 0;
        }),
      };
    },
  });

  return (
    <div>
      <h1>{data?.founder.label}</h1>
      <h2>Propositions de totems</h2>
      {data?.totems.map((totem) => (
        <div key={totem.objectId}>
          <h3>{totem.object.label}</h3>
          <p>NET Score: {formatTrustAmount(totem.netScore)} TRUST</p>
          <p>Nombre de claims: {totem.claimCount}</p>

          <h4>Détail des claims:</h4>
          <ul>
            {totem.claims.map((claim) => (
              <li key={claim.tripleId}>
                {claim.predicate}: {formatTrustAmount(claim.netScore)} NET
                ({formatTrustAmount(claim.trustFor)} FOR -{' '}
                {formatTrustAmount(claim.trustAgainst)} AGAINST)
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## Tests

Les tests sont dans `aggregateVotes.test.ts`.

Pour lancer les tests:

```bash
pnpm test aggregateVotes.test.ts
```

## Notes techniques

- **Tri automatique**: `aggregateTriplesByObject` retourne déjà les totems triés par NET score décroissant
- **BigInt**: Tous les montants sont en `bigint` pour préserver la précision
- **Troncage**: `formatTrustAmount` tronque sans arrondir (0.999 → "0.99")
- **Performance**: O(n) pour l'agrégation, O(n log n) pour le tri

## Voir aussi

- [Vote_Aggregation_Research.md](/Claude/03_TECHNOLOGIES/Vote_Aggregation_Research.md) - Recherche complète sur l'agrégation
- [CORRECTION_ISSUES_AGGREGATION.md](/Claude/00_GESTION_PROJET/corrections/CORRECTION_ISSUES_AGGREGATION.md) - Correction détaillée
- Issue #98 - Implémentation de ces fonctions

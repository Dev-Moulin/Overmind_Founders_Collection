# 08 - Extraire fonctions de calcul de votes vers utils/

## Objectif

Centraliser les fonctions de calcul de votes dupliquées :
- `calculateVoteCounts` - Calcule FOR/AGAINST/NET
- `calculatePercentage` - Calcule % FOR
- `enrichTripleWithVotes` - Enrichit un triple avec les données de vote

**Duplication actuelle** :
- `hooks/useFounderProposals.ts` (lignes 20-66)
- `hooks/useFounderSubscription.ts` (lignes 16-58)

---

## 1. Nouveau fichier à créer

**Chemin** : `apps/web/src/utils/voteCalculations.ts`

```typescript
import type { Triple, TripleVoteCounts, ProposalWithVotes } from '../lib/graphql/types';

/**
 * Calculate vote counts and statistics for a triple
 */
export function calculateVoteCounts(triple: Triple): TripleVoteCounts {
  const forVotes = triple.triple_vault?.total_assets || '0';
  const againstVotes = triple.counter_term?.total_assets || '0';
  const forShares = triple.triple_vault?.total_shares || '0';
  const againstShares = '0'; // counter_term doesn't have shares in V2 schema

  // Calculate net votes (FOR - AGAINST)
  const forBigInt = BigInt(forVotes);
  const againstBigInt = BigInt(againstVotes);
  const netVotes = (forBigInt - againstBigInt).toString();

  return {
    forVotes,
    againstVotes,
    netVotes,
    forShares,
    againstShares,
  };
}

/**
 * Calculate percentage of FOR votes vs total votes
 */
export function calculatePercentage(votes: TripleVoteCounts): number {
  const forBigInt = BigInt(votes.forVotes);
  const againstBigInt = BigInt(votes.againstVotes);
  const total = forBigInt + againstBigInt;

  if (total === 0n) return 0;

  // Calculate percentage: (FOR / TOTAL) * 100
  return Number((forBigInt * 100n) / total);
}

/**
 * Enrich triple with vote data
 */
export function enrichTripleWithVotes(triple: Triple): ProposalWithVotes {
  const votes = calculateVoteCounts(triple);
  const percentage = calculatePercentage(votes);

  return {
    ...triple,
    votes,
    percentage,
  };
}
```

---

## 2. Fichiers sources à modifier

### A. hooks/useFounderProposals.ts

**Lignes 20-66 - À supprimer** (les 3 fonctions).

**Import à ajouter** :
```typescript
import { enrichTripleWithVotes } from '../utils/voteCalculations';
```

### B. hooks/useFounderSubscription.ts

**Lignes 16-58 - À supprimer** (les 3 fonctions).

**Import à ajouter** :
```typescript
import { enrichTripleWithVotes } from '../utils/voteCalculations';
```

### C. utils/index.ts

**Export à ajouter** :
```typescript
export {
  calculateVoteCounts,
  calculatePercentage,
  enrichTripleWithVotes,
} from './voteCalculations';
```

---

## 3. Étapes d'exécution

1. [ ] Créer `utils/voteCalculations.ts`
2. [ ] Modifier `useFounderProposals.ts` : import + COMMENTER ancien code
3. [ ] Modifier `useFounderSubscription.ts` : import + COMMENTER ancien code
4. [ ] Mettre à jour `utils/index.ts`
5. [ ] Build + Test
6. [ ] Paul contrôle
7. [ ] Supprimer les commentaires
8. [ ] Build + Test final
9. [ ] Commit

---

## Validation Paul

- [ ] Plan validé
- [ ] Exécution autorisée

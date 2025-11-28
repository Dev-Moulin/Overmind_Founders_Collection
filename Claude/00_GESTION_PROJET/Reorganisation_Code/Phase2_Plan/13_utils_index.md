# 13 - Nettoyer utils/index.ts

## Problème actuel

`utils/index.ts` réexporte des types GraphQL :
```typescript
// GraphQL types
export type {
  Atom,
  Triple as GraphQLTriple,
  Deposit,
  Position,
  Vault,
  Account,
  VaultType,
  AtomType,
  ProposalWithVotes,
  TripleVoteCounts,
} from '../lib/graphql/types';
```

C'est confus car :
- `utils/` = fonctions utilitaires
- Types GraphQL = devraient venir de `lib/graphql/types`

---

## Solution

Supprimer les re-exports de types GraphQL de `utils/index.ts`.

**Avant** :
```typescript
// ... exports de fonctions ...

// GraphQL types
export type {
  Atom,
  Triple as GraphQLTriple,
  ...
} from '../lib/graphql/types';
```

**Après** :
```typescript
// ... exports de fonctions uniquement ...
```

---

## Vérification avant suppression

Vérifier si ces types sont importés depuis `utils/` quelque part :
- Si oui → modifier les imports pour pointer vers `lib/graphql/types`
- Si non → supprimer directement

---

## Étapes d'exécution

1. [ ] Rechercher les imports de ces types depuis `utils/`
2. [ ] Modifier les imports si nécessaire
3. [ ] Supprimer les re-exports de `utils/index.ts`
4. [ ] Build + Test
5. [ ] Paul contrôle
6. [ ] Commit

---

## Validation Paul

- [ ] Plan validé
- [ ] Exécution autorisée

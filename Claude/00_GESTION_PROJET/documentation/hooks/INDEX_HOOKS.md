# Documentation des Hooks

> Version: 1.0
> Date: 2025-11-25
> Localisation: `apps/web/src/hooks/`

## Vue d'ensemble

Ce dossier contient tous les hooks React personnalisés du projet Founders Totem. Les hooks sont organisés par fonctionnalité.

---

## Catégories de Hooks

### 1. Hooks INTUITION SDK (Blockchain)

| Hook | Fichier | Description |
|------|---------|-------------|
| `useIntuition` | `useIntuition.ts` | Création d'atoms, triples, claims via INTUITION SDK |
| `useVote` | `useVote.ts` | Vote FOR/AGAINST sur un claim (approve + deposit) |
| `useWithdraw` | `useWithdraw.ts` | Retrait de TRUST des vaults |
| `useProtocolConfig` | `useProtocolConfig.ts` | Configuration protocole (coûts, frais) |

### 2. Hooks GraphQL - Propositions & Totems

| Hook | Fichier | Description |
|------|---------|-------------|
| `useFounderProposals` | `useFounderProposals.ts` | Propositions d'un fondateur |
| `useAllProposals` | `useAllProposals.ts` | Toutes les propositions groupées par fondateur |
| `useAllTotems` | `useAllTotems.ts` | Tous les totems agrégés par objet |
| `useTotemDetails` | `useTotemDetails.ts` | Détails d'un totem spécifique |
| `useTotemVoters` | `useTotemVoters.ts` | Derniers votants d'un totem |

### 3. Hooks GraphQL - Votes & Statistiques

| Hook | Fichier | Description |
|------|---------|-------------|
| `useUserVotes` | `useUserVotes.ts` | Votes d'un utilisateur |
| `useVoteStats` | `useVoteStats.ts` | Statistiques de votes (timeline, distribution, leaderboard) |
| `usePlatformStats` | `usePlatformStats.ts` | Statistiques globales de la plateforme |

### 4. Hooks Fondateurs

| Hook | Fichier | Description |
|------|---------|-------------|
| `useFoundersWithAtomIds` | `useFoundersWithAtomIds.ts` | Fondateurs enrichis avec atomIds |
| `useFoundersForHomePage` | `useFoundersForHomePage.ts` | Fondateurs avec totems gagnants pour HomePage |

### 5. Hooks Authentification & Eligibilité

| Hook | Fichier | Description |
|------|---------|-------------|
| `useWalletAuth` | `useWalletAuth.ts` | Authentification par signature wallet |
| `useWhitelist` | `useWhitelist.ts` | Vérification NFT pour éligibilité |

---

## Fichiers Détaillés

- [01_useIntuition.md](./01_useIntuition.md) - Hook principal SDK INTUITION
- [02_useVote.md](./02_useVote.md) - Hook de vote
- [03_useWithdraw.md](./03_useWithdraw.md) - Hook de retrait
- [04_useFounderProposals.md](./04_useFounderProposals.md) - Hook propositions fondateur
- [05_useAllProposals.md](./05_useAllProposals.md) - Hook toutes propositions
- [06_useAllTotems.md](./06_useAllTotems.md) - Hook tous totems
- [07_useProtocolConfig.md](./07_useProtocolConfig.md) - Hook configuration protocole (coûts, frais)
- [08_useUserVotes.md](./08_useUserVotes.md) - Hook votes utilisateur
- [09_useVoteStats.md](./09_useVoteStats.md) - Hook statistiques votes
- [10_usePlatformStats.md](./10_usePlatformStats.md) - Hook stats plateforme
- [11_useFoundersHooks.md](./11_useFoundersHooks.md) - Hooks fondateurs
- [12_useAuth.md](./12_useAuth.md) - Hooks authentification

---

## Architecture des Dépendances

```
                    ┌─────────────────┐
                    │   wagmi/viem    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┬──────────────────┐
         │                   │                   │                  │
         ▼                   ▼                   ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐
│  useIntuition   │ │    useVote      │ │   useWithdraw   │ │useProtocolConf │
│  (SDK calls)    │ │ (approve+dep)   │ │   (redeem)      │ │ (costs/fees)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────────┘
                             │
                             │
                    ┌────────┴────────┐
                    │  Apollo Client  │
                    └────────┬────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
┌──────────────┐     ┌──────────────┐      ┌──────────────┐
│ useFounder   │     │ useAllTotems │      │ useUserVotes │
│ Proposals    │     │              │      │              │
└──────────────┘     └──────────────┘      └──────────────┘
    │                        │
    ▼                        ▼
┌──────────────────────────────────────────────────────┐
│                 aggregateVotes utility               │
│     (aggregateTriplesByObject, calcNetScore)         │
└──────────────────────────────────────────────────────┘
```

---

## Patterns Communs

### 1. Structure de Retour

Tous les hooks GraphQL retournent :
```typescript
{
  data,           // Données typées
  loading,        // boolean
  error,          // ApolloError | undefined
  refetch,        // () => Promise
}
```

### 2. Variables Skip

```typescript
const { data } = useQuery(QUERY, {
  variables: { id },
  skip: !id,  // Skip si pas d'ID
});
```

### 3. Formatage

```typescript
import { formatEther } from 'viem';

const formatted = formatEther(BigInt(weiAmount)); // "150.50"
```

### 4. Agrégation des Votes

```typescript
import { aggregateTriplesByObject } from '../utils/aggregateVotes';

const aggregated = aggregateTriplesByObject(triples);
// Retourne: { objectId, netScore, totalFor, totalAgainst, claims[] }
```

---

## Tests

Chaque hook a un fichier de test correspondant :
- `useVote.test.ts`
- `useAllTotems.test.ts`
- `useFounderProposals.test.ts`
- `useWhitelist.test.ts`

Lancer les tests :
```bash
pnpm --filter web test
```

---

**Dernière mise à jour** : 25 novembre 2025

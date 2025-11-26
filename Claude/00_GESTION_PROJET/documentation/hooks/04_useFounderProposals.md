# useFounderProposals

> Fichier: `apps/web/src/hooks/useFounderProposals.ts`
> Lignes: 228

## Description

Ce fichier contient 3 hooks et 5 fonctions utilitaires pour gérer les propositions de totems par fondateur.

---

## Hooks

### 1. `useFounderProposals`

Récupère toutes les propositions de totems pour un fondateur spécifique.

```typescript
export function useFounderProposals(founderName: string): {
  proposals: ProposalWithVotes[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Paramètres :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `founderName` | `string` | Nom du fondateur (ex: "Joseph Lubin") |

**Exemple :**

```tsx
function FounderPage({ name }: { name: string }) {
  const { proposals, loading, error } = useFounderProposals(name);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <h1>{name}</h1>
      {proposals.map(p => (
        <ProposalCard key={p.term_id} proposal={p} />
      ))}
    </div>
  );
}
```

---

### 2. `useUserProposals`

Récupère toutes les propositions créées par un utilisateur.

```typescript
export function useUserProposals(walletAddress: string | undefined): {
  proposals: ProposalWithVotes[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Paramètres :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `walletAddress` | `string \| undefined` | Adresse wallet de l'utilisateur |

**Exemple :**

```tsx
function MyProposals() {
  const { address } = useAccount();
  const { proposals, loading } = useUserProposals(address);

  return (
    <div>
      <h2>Mes Propositions ({proposals.length})</h2>
      {proposals.map(p => (
        <div key={p.term_id}>
          {p.object.label} - {p.votes.forVotes} FOR
        </div>
      ))}
    </div>
  );
}
```

---

### 3. `useProposalLimit`

Vérifie si un utilisateur peut créer une nouvelle proposition (limite: 3 par fondateur).

```typescript
export function useProposalLimit(
  walletAddress: string | undefined,
  founderName: string
): {
  count: number;
  canPropose: boolean;
  remaining: number;
  loading: boolean;
  error: ApolloError | undefined;
  maxProposals: number; // = 3
};
```

**Paramètres :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `walletAddress` | `string \| undefined` | Adresse wallet de l'utilisateur |
| `founderName` | `string` | Nom du fondateur |

**Exemple :**

```tsx
function ProposeButton({ founderName }: Props) {
  const { address } = useAccount();
  const { canPropose, remaining } = useProposalLimit(address, founderName);

  if (!canPropose) {
    return <p>Limite atteinte (3/3 propositions)</p>;
  }

  return (
    <button>
      Proposer un totem ({remaining} restantes)
    </button>
  );
}
```

---

## Types

### `ProposalWithVotes`

```typescript
interface ProposalWithVotes extends Triple {
  votes: TripleVoteCounts;
  percentage: number; // % de votes FOR
}
```

### `TripleVoteCounts`

```typescript
interface TripleVoteCounts {
  forVotes: string;      // Wei string
  againstVotes: string;  // Wei string
  netVotes: string;      // forVotes - againstVotes
  forShares: string;
  againstShares: string;
}
```

---

## Fonctions Utilitaires

### `calculateVoteCounts(triple: Triple): TripleVoteCounts`

Calcule les statistiques de votes pour un triple.

```typescript
const votes = calculateVoteCounts(triple);
// {
//   forVotes: "1500000000000000000",
//   againstVotes: "500000000000000000",
//   netVotes: "1000000000000000000",
//   forShares: "...",
//   againstShares: "0"
// }
```

---

### `calculatePercentage(votes: TripleVoteCounts): number`

Calcule le pourcentage de votes FOR.

```typescript
const percent = calculatePercentage(votes);
// 75 (75% de votes FOR)
```

---

### `sortProposalsByVotes(proposals): ProposalWithVotes[]`

Trie les propositions par nombre de votes FOR (décroissant).

```typescript
const sorted = sortProposalsByVotes(proposals);
// Première proposition = plus votée
```

---

### `getWinningProposal(proposals): ProposalWithVotes | undefined`

Retourne la proposition avec le plus de votes FOR.

```typescript
const winner = getWinningProposal(proposals);
if (winner) {
  console.log(`Totem gagnant: ${winner.object.label}`);
}
```

---

### `formatVoteAmount(voteAmountWei, decimals?): string`

Formate un montant en wei vers une chaîne lisible.

```typescript
const formatted = formatVoteAmount("1500000000000000000", 2);
// "1.50"
```

---

## Requêtes GraphQL Utilisées

| Query | Description |
|-------|-------------|
| `GET_FOUNDER_PROPOSALS` | Triples où subject.label = founderName |
| `GET_USER_PROPOSALS` | Triples créés par walletAddress |
| `COUNT_USER_PROPOSALS_FOR_FOUNDER` | Compte des propositions user/founder |

---

## Constantes

```typescript
const MAX_PROPOSALS = 3; // Limite par fondateur par utilisateur
```

---

## Dépendances

- `@apollo/client` : `useQuery`
- `viem` : `formatEther`
- GraphQL queries depuis `../lib/graphql/queries`
- Types depuis `../lib/graphql/types`

---

**Dernière mise à jour** : 25 novembre 2025

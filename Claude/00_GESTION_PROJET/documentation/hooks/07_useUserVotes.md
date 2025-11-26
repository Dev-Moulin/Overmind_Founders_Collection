# useUserVotes

> Fichier: `apps/web/src/hooks/useUserVotes.ts`
> Lignes: 246

## Description

Ce fichier contient 3 hooks et 6 fonctions utilitaires pour gérer les votes d'un utilisateur.

---

## Hooks

### 1. `useUserVotes`

Récupère tous les votes (dépôts) effectués par un utilisateur.

```typescript
export function useUserVotes(walletAddress: string | undefined): {
  votes: VoteWithDetails[];
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
function MyVotes() {
  const { address } = useAccount();
  const { votes, loading } = useUserVotes(address);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Mes votes ({votes.length})</h2>
      {votes.map(vote => (
        <div key={vote.id}>
          {vote.isPositive ? '✅ FOR' : '❌ AGAINST'}: {vote.formattedAmount} TRUST
        </div>
      ))}
    </div>
  );
}
```

---

### 2. `useUserVotesDetailed`

Version détaillée qui sépare les votes FOR et AGAINST. Ne retourne que les votes sur les triples (pas les atoms).

```typescript
export function useUserVotesDetailed(walletAddress: string | undefined): {
  votes: VoteWithDetails[];
  forVotes: VoteWithDetails[];
  againstVotes: VoteWithDetails[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Exemple :**

```tsx
function VoteSummary() {
  const { address } = useAccount();
  const { forVotes, againstVotes, loading } = useUserVotesDetailed(address);

  return (
    <div className="vote-summary">
      <div className="for-section">
        <h3>Votes FOR ({forVotes.length})</h3>
        {forVotes.map(v => <VoteItem key={v.id} vote={v} />)}
      </div>

      <div className="against-section">
        <h3>Votes AGAINST ({againstVotes.length})</h3>
        {againstVotes.map(v => <VoteItem key={v.id} vote={v} />)}
      </div>
    </div>
  );
}
```

---

### 3. `useUserPosition`

Récupère la position d'un utilisateur sur un triple/atom spécifique.

```typescript
export function useUserPosition(
  walletAddress: string | undefined,
  termId: string | undefined
): {
  position: Position | null;
  hasPosition: boolean;
  shares: string;
  totalDeposited: string;
  totalRedeemed: string;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<any>;
};
```

**Paramètres :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `walletAddress` | `string \| undefined` | Adresse wallet |
| `termId` | `string \| undefined` | term_id du triple ou atom |

**Exemple :**

```tsx
function PositionInfo({ termId }: { termId: string }) {
  const { address } = useAccount();
  const { hasPosition, shares, totalDeposited, totalRedeemed } = useUserPosition(address, termId);

  if (!hasPosition) {
    return <p>Vous n'avez pas de position sur ce claim</p>;
  }

  return (
    <div>
      <p>Shares: {shares}</p>
      <p>Total déposé: {formatEther(BigInt(totalDeposited))} TRUST</p>
      <p>Total retiré: {formatEther(BigInt(totalRedeemed))} TRUST</p>
    </div>
  );
}
```

---

## Type Principal

### `VoteWithDetails`

```typescript
interface VoteWithDetails extends Deposit {
  isPositive: boolean;      // true = FOR, false = AGAINST
  formattedAmount: string;  // Montant formaté (ex: "10.50")
}
```

### `Deposit` (de GraphQL)

```typescript
interface Deposit {
  id: string;
  sender_id: string;
  term_id: string;
  vault_type: VaultType;  // 'triple_positive' | 'triple_negative' | 'atom'
  assets_after_fees: string;
  shares: string;
  created_at: string;
}
```

---

## Fonctions Utilitaires

### `getTotalVotedAmount(votes): string`

Calcule le montant total voté par l'utilisateur.

```typescript
const total = getTotalVotedAmount(votes);
console.log(`Total voté: ${formatEther(BigInt(total))} TRUST`);
```

---

### `filterVotesByType(votes, vaultType): VoteWithDetails[]`

Filtre les votes par type de vault.

```typescript
const forVotes = filterVotesByType(votes, 'triple_positive');
const againstVotes = filterVotesByType(votes, 'triple_negative');
const atomVotes = filterVotesByType(votes, 'atom');
```

---

### `groupVotesByTerm(votes): Map<string, VoteWithDetails[]>`

Groupe les votes par term_id.

```typescript
const grouped = groupVotesByTerm(votes);
grouped.forEach((termVotes, termId) => {
  console.log(`Term ${termId}: ${termVotes.length} votes`);
});
```

---

### `formatTotalVotes(voteAmountWei, decimals?): string`

Formate un montant avec l'unité TRUST.

```typescript
const formatted = formatTotalVotes("1500000000000000000", 2);
// "1.50 TRUST"
```

---

### `hasVotedOnTerm(votes, termId): boolean`

Vérifie si l'utilisateur a voté sur un term spécifique.

```typescript
if (hasVotedOnTerm(userVotes, proposalTermId)) {
  showMessage('Vous avez déjà voté sur cette proposition');
}
```

---

### `getUserVoteDirection(votes, termId): 'for' | 'against' | null`

Récupère la direction du vote de l'utilisateur sur un term.

```typescript
const direction = getUserVoteDirection(userVotes, termId);
if (direction === 'for') {
  highlightForButton();
} else if (direction === 'against') {
  highlightAgainstButton();
}
```

---

## Requêtes GraphQL

| Query | Description |
|-------|-------------|
| `GET_USER_VOTES` | Tous les dépôts d'un utilisateur |
| `GET_USER_VOTES_DETAILED` | Dépôts triés par montant |
| `GET_USER_POSITION` | Position sur un term spécifique |

---

## Cas d'Usage

| Cas | Hook recommandé |
|-----|-----------------|
| Afficher tous les votes | `useUserVotes` |
| Séparer FOR/AGAINST | `useUserVotesDetailed` |
| Vérifier position existante | `useUserPosition` |
| Montant total voté | `getTotalVotedAmount()` |
| Vérifier si déjà voté | `hasVotedOnTerm()` |

---

## Dépendances

- `@apollo/client` : `useQuery`
- `viem` : `formatEther`
- Types depuis `../lib/graphql/types`

---

**Dernière mise à jour** : 25 novembre 2025

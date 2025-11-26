# Recherches Approfondies - VotePanel V2

> **Date** : 27 novembre 2025
> **Statut** : Complet

---

## 1. Vote sur Claim Existant (Bonding Curve)

### Découverte majeure : Hooks DÉJÀ IMPLÉMENTÉS !

Le projet contient déjà les hooks nécessaires pour voter sur un claim existant :

| Hook | Fichier | Status |
|------|---------|--------|
| `useVote` | [useVote.ts](../../../apps/web/src/hooks/useVote.ts) | **Implémenté** |
| `useWithdraw` | [useWithdraw.ts](../../../apps/web/src/hooks/useWithdraw.ts) | **Implémenté** |
| `VoteModal` | [VoteModal.tsx](../../../apps/web/src/components/VoteModal.tsx) | **Implémenté** |

### useVote.ts - Analyse détaillée

**Fonction SDK utilisée** : `batchDepositStatement` de `@0xintuition/sdk`

```typescript
import { batchDepositStatement, getMultiVaultAddressFromChainId } from '@0xintuition/sdk';

// Signature d'appel (ligne 183-186)
const depositResult = await batchDepositStatement(
  config,
  [[claimId], [amountWei], [isFor]]  // isFor: true=FOR, false=AGAINST
);
```

**Workflow complet** :
1. **Checking** - Vérifie l'allowance ERC20 du token TRUST
2. **Approving** - Si nécessaire, approuve le contrat MultiVault
3. **Depositing** - Dépose le TRUST dans le vault du claim

**Token TRUST** :
```typescript
const TRUST_TOKEN_ADDRESS = '0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3' as Hex;
```

**Interface du hook** :
```typescript
interface UseVoteResult {
  vote: (claimId: Hex, amount: string, isFor: boolean) => Promise<void>;
  status: VoteStatus;  // 'idle' | 'checking' | 'approving' | 'depositing' | 'success' | 'error'
  error: VoteError | null;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  reset: () => void;
}
```

### useWithdraw.ts - Analyse détaillée

**Fonction SDK utilisée** : `redeem` de `@0xintuition/protocol`

```typescript
import { redeem, getMultiVaultAddressFromChainId } from '@0xintuition/protocol';

// Signature d'appel (ligne 160-162)
const txHash = await redeem(config, {
  args: [address, termId, curveId, shares, minAssets],
});
```

**Paramètres** :
- `address` : Adresse du wallet qui reçoit les TRUST
- `termId` : ID du claim (triple)
- `curveId` : `0n` = FOR (positive), `1n` = AGAINST (negative)
- `shares` : Nombre de shares à convertir en TRUST
- `minAssets` : Protection slippage (minimum TRUST à recevoir)

**Fonction utilitaire incluse** :
```typescript
// Estime le montant de retrait (avec frais de sortie ~7%)
export function estimateWithdrawAmount(
  shares: bigint,
  totalShares: bigint,
  totalAssets: bigint,
  exitFeePercent: number = 7
): WithdrawPreview
```

### VoteModal.tsx - Composant UI existant

Le composant `VoteModal` est déjà implémenté et utilise `useVote` :

```typescript
const { vote, status, error, isLoading, currentStep, totalSteps, reset } = useVote();

// Appel du vote
await vote(selectedClaimId as Hex, amount, direction === 'for');
```

**Fonctionnalités** :
- Sélection du claim si plusieurs pour un même totem
- Input montant TRUST
- Progress indicator (étapes)
- Gestion succès/erreur
- Vote FOR ou AGAINST

---

## 2. Différence entre createTriple et deposit

| Aspect | `createTriple` (useIntuition) | `deposit` (useVote) |
|--------|-------------------------------|---------------------|
| **Usage** | Créer un NOUVEAU claim | Voter sur claim EXISTANT |
| **Coût** | triple_cost + dépôt | Dépôt seulement |
| **Vault** | Crée un nouveau vault | Ajoute au vault existant |
| **SDK** | `@0xintuition/protocol` | `@0xintuition/sdk` |
| **Fonction** | `createTriples()` | `batchDepositStatement()` |

### Flow complet

```
CRÉER UN CLAIM (nouveau triple)
├── useIntuition.createClaim()
│   ├── Vérifier si triple existe (findTriple)
│   ├── Créer atoms si nécessaires (getOrCreateAtom)
│   └── createTriples() → nouveau vault

VOTER SUR CLAIM EXISTANT
├── useVote.vote()
│   ├── Vérifier allowance TRUST
│   ├── Approuver si nécessaire
│   └── batchDepositStatement() → dépôt dans vault existant

RETIRER SES TRUST
├── useWithdraw.withdraw()
│   └── redeem() → convertit shares en TRUST
```

---

## 3. WebSocket et Authentification

### Endpoint GraphQL

```
HTTP  : https://testnet.intuition.sh/v1/graphql
WS    : wss://testnet.intuition.sh/v1/graphql
```

### Authentification requise ?

**NON** - L'endpoint testnet public ne nécessite pas d'authentification.

**Preuve** : Le fichier `apollo-client.ts` actuel n'utilise aucun header d'auth :

```typescript
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  // Aucun header d'authentification
});
```

### Configuration WebSocket recommandée

```typescript
import { createClient } from 'graphql-ws';

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://testnet.intuition.sh/v1/graphql',
    // Pas de connectionParams nécessaire sur testnet
    retryAttempts: 5,
    shouldRetry: () => true,
    lazy: true,
  })
);
```

### Package à installer

```bash
pnpm add graphql-ws
```

---

## 4. Apollo Client - Configuration actuelle

**Fichier** : [apollo-client.ts](../../../apps/web/src/lib/apollo-client.ts)

### Stratégies de cache actuelles

```typescript
defaultOptions: {
  watchQuery: {
    fetchPolicy: 'cache-and-network',  // ✅ Recommandé
    errorPolicy: 'all',
  },
  query: {
    fetchPolicy: 'network-only',  // ⚠️ À changer pour cache-and-network
    errorPolicy: 'all',
  },
}
```

### Type Policies

Le cache gère déjà correctement les merges pour :
- `triples`
- `atoms`
- `deposits`
- `positions`

---

## 5. Implications pour VotePanel V2

### Ce qui existe déjà

| Fonctionnalité | Hook/Composant | Utilisé dans VotePanel ? |
|----------------|----------------|--------------------------|
| Créer claim | `useIntuition.createClaim` | **OUI** |
| Voter existant | `useVote.vote` | **NON** (à intégrer) |
| Retirer TRUST | `useWithdraw.withdraw` | **NON** (Phase 3) |
| Modal vote | `VoteModal` | **NON** (utilise son propre flow) |

### Ce qu'il faut faire

1. **Intégrer `useVote`** dans le flow VotePanel quand claim existe
2. **Créer `ClaimExistsModal`** qui utilise `useVote` pour voter
3. **Réutiliser `VoteModal`** comme inspiration pour l'UI

### Architecture proposée

```
VotePanel
├── Mode "Créer" (claim n'existe pas)
│   └── useIntuition.createClaimWithDescription()
│
└── Mode "Voter" (claim existe déjà)
    ├── ClaimExistsModal (popup)
    └── useVote.vote(claimId, amount, isFor)
```

---

## 6. Récapitulatif des fonctions SDK

### @0xintuition/sdk

| Fonction | Usage |
|----------|-------|
| `batchDepositStatement` | Déposer TRUST dans vault existant |
| `getMultiVaultAddressFromChainId` | Obtenir adresse contrat MultiVault |

### @0xintuition/protocol

| Fonction | Usage |
|----------|-------|
| `createAtomFromString` | Créer atom simple |
| `createAtomFromThing` | Créer atom avec métadonnées |
| `redeem` | Retirer TRUST d'un vault |
| `multiCallIntuitionConfigs` | Récupérer config protocole |
| `MultiVaultAbi` | ABI du contrat |
| `intuitionTestnet` | Config chain testnet |

---

## 7. Questions résolues

| Question | Réponse |
|----------|---------|
| Comment voter sur claim existant ? | `useVote` hook avec `batchDepositStatement` |
| Comment retirer ses TRUST ? | `useWithdraw` hook avec `redeem` |
| Auth WebSocket nécessaire ? | NON sur testnet public |
| Hooks déjà implémentés ? | OUI - `useVote`, `useWithdraw`, `VoteModal` |
| Différence create vs deposit ? | create = nouveau vault, deposit = vault existant |

---

## 8. Fichiers clés découverts

| Fichier | Description | Lignes clés |
|---------|-------------|-------------|
| `useVote.ts` | Hook vote existant | L4, L183-186 |
| `useWithdraw.ts` | Hook retrait | L4, L160-162 |
| `VoteModal.tsx` | UI vote existant | L22, L68 |
| `apollo-client.ts` | Config Apollo | L10, L53-65 |
| `hooks/index.ts` | Exports hooks | L39, L59-66 |

---

**Voir aussi** :
- [01_ARCHITECTURE.md](./01_ARCHITECTURE.md) - Architecture complète
- [02_ETAT_IMPLEMENTATION.md](./02_ETAT_IMPLEMENTATION.md) - État du code
- [03_RECHERCHES.md](./03_RECHERCHES.md) - Recherches initiales

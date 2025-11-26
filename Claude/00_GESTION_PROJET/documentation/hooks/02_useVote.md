# useVote

> Fichier: `apps/web/src/hooks/useVote.ts`
> Lignes: 266

## Description

Hook pour gérer le processus complet de vote sur un claim. Gère automatiquement l'approbation des tokens TRUST puis le dépôt dans le vault.

---

## Interface

```typescript
export function useVote(): UseVoteResult;
```

### Retour

```typescript
interface UseVoteResult {
  vote: (claimId: Hex, amount: string, isFor: boolean) => Promise<void>;
  status: VoteStatus;
  error: VoteError | null;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  reset: () => void;
}
```

---

## Types

### `VoteStatus`

```typescript
type VoteStatus =
  | 'idle'        // Initial
  | 'checking'    // Vérification allowance
  | 'approving'   // Approbation en cours
  | 'depositing'  // Dépôt en cours
  | 'success'     // Vote réussi
  | 'error';      // Erreur
```

### `VoteError`

```typescript
interface VoteError {
  code: string;     // 'USER_REJECTED', 'INSUFFICIENT_GAS', etc.
  message: string;  // Message lisible
  step: 'checking' | 'approving' | 'depositing';
}
```

---

## Flow de Vote

```
1. Vérifier allowance TRUST
        │
        ├─── Si allowance < montant
        │         │
        │         ▼
        │    2. Approve TRUST
        │         │
        │         ▼
        │    (attendre confirmation)
        │
        ▼
3. Deposit dans le vault
        │
        ▼
(attendre confirmation)
        │
        ▼
4. Success !
```

---

## Exemple d'Utilisation

```tsx
function VoteModal({ claimId }: { claimId: Hex }) {
  const { vote, status, error, isLoading, currentStep, totalSteps, reset } = useVote();
  const [amount, setAmount] = useState('10');
  const [isFor, setIsFor] = useState(true);

  const handleVote = async () => {
    await vote(claimId, amount, isFor);
  };

  return (
    <div>
      {/* Affichage du step actuel */}
      {isLoading && (
        <div className="progress-bar">
          Step {currentStep}/{totalSteps}
          <span>
            {status === 'checking' && 'Vérification...'}
            {status === 'approving' && 'Approbation TRUST...'}
            {status === 'depositing' && 'Dépôt en cours...'}
          </span>
        </div>
      )}

      {/* Affichage erreur */}
      {error && (
        <div className="error">
          <p>Erreur ({error.step}): {error.message}</p>
          <button onClick={reset}>Réessayer</button>
        </div>
      )}

      {/* Formulaire */}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Montant TRUST"
      />

      <div>
        <label>
          <input
            type="radio"
            checked={isFor}
            onChange={() => setIsFor(true)}
          />
          FOR
        </label>
        <label>
          <input
            type="radio"
            checked={!isFor}
            onChange={() => setIsFor(false)}
          />
          AGAINST
        </label>
      </div>

      <button onClick={handleVote} disabled={isLoading}>
        {isLoading ? 'Vote en cours...' : 'Voter'}
      </button>

      {/* Success */}
      {status === 'success' && (
        <div className="success">Vote enregistré !</div>
      )}
    </div>
  );
}
```

---

## Configuration

### Adresse Token TRUST

```typescript
const TRUST_TOKEN_ADDRESS = '0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3' as Hex;
```

### MultiVault Address

Obtenu dynamiquement via SDK :

```typescript
const multiVaultAddress = getMultiVaultAddressFromChainId(intuitionTestnet.id);
```

---

## Gestion des Erreurs

| Code | Message | Cause |
|------|---------|-------|
| `WALLET_NOT_CONNECTED` | Please connect your wallet | Wallet non connecté |
| `CLIENT_NOT_READY` | Wallet client not ready | Client wagmi pas prêt |
| `USER_REJECTED` | Transaction rejected by user | L'utilisateur a refusé |
| `INSUFFICIENT_GAS` | Insufficient ETH for gas fees | Pas assez d'ETH |
| `INSUFFICIENT_BALANCE` | Insufficient TRUST balance | Pas assez de TRUST |

---

## Toasts Automatiques

Le hook affiche des toasts via `sonner` :

```typescript
toast.info('Checking TRUST allowance...');
toast.info('Approval required. Please sign the transaction...');
toast.loading('Approving TRUST tokens...', { id: 'approve' });
toast.success('TRUST tokens approved!', { id: 'approve' });
toast.info('Please sign the deposit transaction...');
toast.loading('Depositing TRUST...', { id: 'deposit' });
toast.success(`Vote ${isFor ? 'FOR' : 'AGAINST'} successfully recorded!`, { id: 'deposit' });
toast.error(errorMessage);
```

---

## Fonction SDK Utilisée

```typescript
import { batchDepositStatement } from '@0xintuition/sdk';

const depositResult = await batchDepositStatement(
  config,
  [[claimId], [amountWei], [isFor]]
);
```

**Note** : La signature du SDK peut varier, d'où le `as any` temporaire.

---

## Dépendances

- `wagmi` : `useAccount`, `usePublicClient`, `useWalletClient`, `useReadContract`
- `@0xintuition/sdk` : `batchDepositStatement`, `getMultiVaultAddressFromChainId`
- `@0xintuition/protocol` : `intuitionTestnet`
- `viem` : `parseEther`, `Hex`, `erc20Abi`
- `sonner` : `toast`

---

## Tests

Fichier: `useVote.test.ts`

Tests couverts :
- Vote sans wallet connecté
- Vote avec allowance insuffisante
- Vote avec allowance suffisante
- Gestion des erreurs utilisateur
- Gestion des erreurs réseau

---

**Dernière mise à jour** : 25 novembre 2025

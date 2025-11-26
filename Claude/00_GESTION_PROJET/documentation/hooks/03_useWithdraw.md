# useWithdraw

> Fichier: `apps/web/src/hooks/useWithdraw.ts`
> Lignes: 275

## Description

Hook pour retirer du TRUST d'un vault après avoir voté. Utilise la fonction `redeem` du contrat MultiVault.

---

## Interface

```typescript
export function useWithdraw(): UseWithdrawResult;
```

### Retour

```typescript
interface UseWithdrawResult {
  withdraw: (
    termId: Hex,
    shares: bigint,
    isPositive: boolean,
    minAssets?: bigint
  ) => Promise<Hex | null>;
  status: WithdrawStatus;
  error: WithdrawError | null;
  isLoading: boolean;
  reset: () => void;
}
```

---

## Types

### `WithdrawStatus`

```typescript
type WithdrawStatus =
  | 'idle'
  | 'calculating'
  | 'withdrawing'
  | 'success'
  | 'error';
```

### `WithdrawError`

```typescript
interface WithdrawError {
  code: string;
  message: string;
}
```

### `WithdrawPreview`

```typescript
interface WithdrawPreview {
  shares: bigint;
  estimatedAssets: bigint;
  formattedAssets: string;
  exitFeePercent: number;
}
```

---

## Paramètres de `withdraw()`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `termId` | `Hex` | ID du triple/atom |
| `shares` | `bigint` | Nombre de shares à retirer |
| `isPositive` | `boolean` | `true` = vault FOR, `false` = vault AGAINST |
| `minAssets` | `bigint?` | Protection slippage (default: 0) |

---

## Curve IDs

```typescript
const POSITIVE_CURVE_ID = 0n;  // Vault FOR
const NEGATIVE_CURVE_ID = 1n;  // Vault AGAINST
```

---

## Exemple d'Utilisation

```tsx
function WithdrawButton({ termId, shares, isFor }: Props) {
  const { withdraw, status, error, isLoading, reset } = useWithdraw();

  const handleWithdraw = async () => {
    const txHash = await withdraw(termId, shares, isFor);
    if (txHash) {
      console.log('Retrait réussi:', txHash);
    }
  };

  return (
    <div>
      {error && (
        <div className="error">
          {error.message}
          <button onClick={reset}>Réessayer</button>
        </div>
      )}

      <button onClick={handleWithdraw} disabled={isLoading}>
        {isLoading ? 'Retrait en cours...' : 'Retirer TRUST'}
      </button>

      {status === 'success' && (
        <div className="success">Retrait effectué !</div>
      )}
    </div>
  );
}
```

---

## Codes d'Erreur

| Code | Message | Cause |
|------|---------|-------|
| `WALLET_NOT_CONNECTED` | Please connect your wallet | Pas de wallet |
| `CLIENT_NOT_READY` | Wallet client not ready | Client pas prêt |
| `NO_SHARES` | No shares to withdraw | shares = 0 |
| `USER_REJECTED` | Transaction rejected by user | Refus utilisateur |
| `INSUFFICIENT_GAS` | Insufficient ETH for gas fees | Pas assez de gas |
| `SLIPPAGE_ERROR` | Slippage too high | Augmenter minAssets |

---

## Fonction SDK Utilisée

```typescript
import { redeem, getMultiVaultAddressFromChainId } from '@0xintuition/protocol';

const txHash = await redeem(config, {
  args: [address, termId, curveId, shares, minAssets],
});
```

---

## Fonction Utilitaire

### `estimateWithdrawAmount()`

Calcule une estimation du montant à recevoir (approximation).

```typescript
export function estimateWithdrawAmount(
  shares: bigint,
  totalShares: bigint,
  totalAssets: bigint,
  exitFeePercent: number = 7
): WithdrawPreview;
```

**Formule :**
```
grossAssets = (shares * totalAssets) / totalShares
netAssets = grossAssets * (100 - exitFeePercent) / 100
```

**Exemple :**

```typescript
import { estimateWithdrawAmount } from '../hooks/useWithdraw';

const preview = estimateWithdrawAmount(
  BigInt('1000000000000000000'), // 1 share
  BigInt('10000000000000000000'), // 10 total shares
  BigInt('15000000000000000000'), // 15 total assets
  7 // 7% exit fee
);

console.log(preview);
// {
//   shares: 1000000000000000000n,
//   estimatedAssets: 1395000000000000000n,
//   formattedAssets: "1.395",
//   exitFeePercent: 7
// }
```

---

## Toasts Automatiques

```typescript
toast.info('Please sign the withdrawal transaction...');
toast.loading('Withdrawing TRUST...', { id: 'withdraw' });
toast.success(`Successfully withdrew ${formattedShares} TRUST!`, { id: 'withdraw' });
toast.error(errorMessage, { id: 'withdraw' });
```

---

## Dépendances

- `wagmi` : `useAccount`, `usePublicClient`, `useWalletClient`
- `@0xintuition/protocol` : `redeem`, `getMultiVaultAddressFromChainId`, `intuitionTestnet`
- `viem` : `formatEther`, `Hex`
- `sonner` : `toast`

---

## Notes Importantes

1. **Exit Fee** : Le contrat applique une exit fee (~7%) lors du retrait
2. **Slippage** : Pour les gros montants, spécifier `minAssets` pour éviter le slippage
3. **Timing** : Le retrait peut être fait à tout moment après un vote

---

**Dernière mise à jour** : 25 novembre 2025

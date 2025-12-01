# Confirmation de transaction (useWaitForTransactionReceipt)

Après l'envoi d'une transaction, il faut attendre que le bloc contenant la transaction soit miné pour considérer l'action effectivement réalisée on-chain. Pour cela, Wagmi propose le hook `useWaitForTransaction` / `useWaitForTransactionReceipt`.

---

## Hook useWaitForTransactionReceipt

Ce hook permet d'attendre de manière déclarative la confirmation d'une transaction donnée (identifiée par son hash).

### Utilisation

En pratique, on l'utilise en lui passant le hash de la transaction :

```typescript
import { useWaitForTransactionReceipt } from 'wagmi';

function TransactionStatus({ txHash }) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (isLoading) {
    return <p>En attente de confirmation sur le réseau...</p>;
  }

  if (isSuccess) {
    return <p>Transaction confirmée, totem créé.</p>;
  }

  if (isError) {
    return <p>La transaction a échoué.</p>;
  }

  return null;
}
```

---

## États exposés

Le hook expose plusieurs états :

| État | Description |
|------|-------------|
| `isLoading` | Transaction en cours de minage |
| `isSuccess` | Transaction minée avec succès |
| `isError` | Transaction échouée |
| `isConfirming` | Alias pour isLoading (selon version) |
| `isConfirmed` | Alias pour isSuccess (selon version) |

---

## Flux de confirmation

1. La transaction est envoyée (on obtient un `txHash`)
2. On passe le `txHash` à `useWaitForTransactionReceipt`
3. `isLoading = true` pendant le minage
4. Quand le bloc est miné :
   - `isSuccess = true` si la transaction a réussi
   - `isError = true` si la transaction a échoué (revert)

---

## Gestion UI de la confirmation

> « On peut ainsi afficher le statut de confirmation de la transaction à l'utilisateur en utilisant le hook `useWaitForTransactionReceipt` »

### Exemple complet avec création de totem

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

function CreateTotemForm() {
  const { data: txHash, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  function onSubmit(categorie: string) {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'createTotem',
      args: [categorie]
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="categorie" />
        <button disabled={isPending}>
          {isPending ? 'Confirming...' : 'Créer'}
        </button>
      </form>

      {txHash && <p>Transaction Hash: {txHash}</p>}
      {isConfirming && <p>En attente de confirmation...</p>}
      {isConfirmed && <p>Transaction confirmée.</p>}
    </div>
  );
}
```

---

## Messages UI recommandés

| Phase | État | Message suggéré |
|-------|------|-----------------|
| Signature wallet | `isPending = true` | "En attente de confirmation du wallet..." |
| Minage en cours | `isLoading = true` | "Transaction en cours de validation sur le réseau..." |
| Succès | `isSuccess = true` | "✅ Transaction confirmée, totem créé !" |
| Échec | `isError = true` | "❌ La transaction a échoué" |

---

## Récupération des données post-transaction

À ce stade, le totem est créé dans le smart contract. On pourrait éventuellement :
- Récupérer un **ID de totem** retourné par l'événement
- Lire les logs de la transaction pour obtenir des informations
- Rafraîchir la liste des totems via `useReadContract`

---

## Retour de useWaitForTransactionReceipt

| Propriété | Type | Description |
|-----------|------|-------------|
| `data` | `TransactionReceipt` | Reçu de la transaction (logs, status, etc.) |
| `isLoading` | `boolean` | En attente de minage |
| `isSuccess` | `boolean` | Transaction minée avec succès |
| `isError` | `boolean` | Transaction échouée |
| `error` | `Error` | Détails de l'erreur |

---

## Sources

- [useWaitForTransactionReceipt](https://wagmi.sh/react/hooks/useWaitForTransactionReceipt)
- [Wagmi 1.x useWaitForTransaction](https://1.x.wagmi.sh/react/hooks/useWaitForTransaction)

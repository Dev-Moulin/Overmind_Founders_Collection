# useProtocolConfig

Hook pour récupérer la configuration du protocole INTUITION (coûts et frais).

## Import

```typescript
import { useProtocolConfig } from '../hooks/useProtocolConfig';
// ou
import { useProtocolConfig } from '../hooks';
```

## Utilisation

```typescript
function VotePanel() {
  const {
    config,
    loading,
    error,
    isDepositValid,
    getTotalTripleCost
  } = useProtocolConfig();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <p>Minimum: {config?.formattedMinDeposit} TRUST</p>
      <p>Frais d'entrée: {config?.formattedEntryFee}</p>
    </div>
  );
}
```

---

## Retour

| Propriété | Type | Description |
|-----------|------|-------------|
| `config` | `ProtocolConfig \| null` | Configuration du protocole |
| `loading` | `boolean` | État de chargement |
| `error` | `Error \| null` | Erreur éventuelle |
| `isDepositValid` | `(amount: string) => boolean` | Valide si le montant >= minDeposit |
| `getTotalTripleCost` | `(amount: string) => { totalWei, formatted } \| null` | Calcule le coût total (base + dépôt) |

---

## Interface ProtocolConfig

```typescript
interface ProtocolConfig {
  // Coûts de base (wei)
  atomCost: string;      // Coût pour créer un Atom
  tripleCost: string;    // Coût pour créer un Triple/Claim
  minDeposit: string;    // Dépôt minimum obligatoire

  // Coûts formatés (TRUST lisible)
  formattedAtomCost: string;     // ex: "0.0003"
  formattedTripleCost: string;   // ex: "0.0003"
  formattedMinDeposit: string;   // ex: "0.0001"

  // Frais (basis points)
  entryFee: string;       // ex: "500" (5%)
  exitFee: string;        // ex: "500" (5%)
  protocolFee: string;    // ex: "100" (1%)
  feeDenominator: string; // ex: "10000" (100%)

  // Frais formatés (pourcentage)
  formattedEntryFee: string;    // ex: "5%"
  formattedExitFee: string;     // ex: "5%"
  formattedProtocolFee: string; // ex: "1%"
}
```

---

## Helpers

### `isDepositValid(amount: string)`

Valide si le montant est supérieur ou égal au minimum requis par le protocole.

```typescript
const { isDepositValid } = useProtocolConfig();

// Validation dans un formulaire
const isValid = isDepositValid(trustAmount);
if (!isValid) {
  showError('Montant inférieur au minimum requis');
}
```

### `getTotalTripleCost(depositAmount: string)`

Calcule le coût total pour créer un triple (coût de base + dépôt utilisateur).

```typescript
const { getTotalTripleCost } = useProtocolConfig();

const totalCost = getTotalTripleCost('10'); // 10 TRUST de dépôt
// Retourne: { totalWei: "10000300000000000000", formatted: "10.0003" }
```

---

## Source des données

Les données proviennent du contrat MultiVault via `multiCallIntuitionConfigs` du SDK INTUITION :

```typescript
import { multiCallIntuitionConfigs } from '@0xintuition/protocol';

const config = await multiCallIntuitionConfigs({
  publicClient,
  address: multiVaultAddress,
});
```

---

## Exemple complet

```tsx
function ProposalForm() {
  const [amount, setAmount] = useState('10');
  const {
    config,
    loading,
    isDepositValid,
    getTotalTripleCost
  } = useProtocolConfig();

  const totalCost = getTotalTripleCost(amount);
  const isValid = isDepositValid(amount);

  return (
    <form>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={config?.formattedMinDeposit}
      />

      {!isValid && (
        <p className="error">
          Minimum requis: {config?.formattedMinDeposit} TRUST
        </p>
      )}

      {totalCost && (
        <p>Coût total: {totalCost.formatted} TRUST</p>
      )}

      <p>Frais d'entrée: {config?.formattedEntryFee}</p>
    </form>
  );
}
```

---

## Dépendances

- `wagmi` : `usePublicClient`
- `viem` : `formatEther`
- `@0xintuition/protocol` : `multiCallIntuitionConfigs`, `getMultiVaultAddressFromChainId`, `intuitionTestnet`

---

## Notes

- La config est chargée une seule fois au montage du composant
- Les données proviennent directement du contrat on-chain
- Cache automatique via React state (pas de refetch à chaque render)
- Utilisé dans `VotePanel.tsx` pour afficher les coûts et valider les montants

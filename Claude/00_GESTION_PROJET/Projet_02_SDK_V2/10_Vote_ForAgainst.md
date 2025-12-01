# Vote FOR/AGAINST sur un totem existant

Le second volet du flux est le vote pour ou contre un totem. On suppose que chaque totem créé peut être identifié (par un ID) et qu'un utilisateur connecté peut émettre un vote positif ou négatif via une fonction du contrat du type `voteOnTotem(totemId, bool support)` ou deux fonctions distinctes (`voteFor` / `voteAgainst`).

---

## Interface utilisateur

L'interface pourrait présenter :
- La liste des totems (avec leurs catégories)
- Pour chaque totem, deux boutons :
  - **"Vote For"** 👍
  - **"Vote Against"** 👎

---

## Implémentation du vote

Lorsqu'un utilisateur clique sur l'un des boutons de vote, le mécanisme est très similaire à la création de totem décrite plus haut : on va appeler la fonction de vote du smart contract via Wagmi.

### Composant VoteButton

Cela peut être implémenté dans un composant `VoteButton` configuré avec l'ID du totem correspondant et le sens du vote.

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

interface VoteButtonProps {
  totemId: bigint;
  forOrAgainst: boolean; // true = FOR, false = AGAINST
}

function VoteButton({ totemId, forOrAgainst }: VoteButtonProps) {
  const { data: txHash, isPending, error, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  function onVote() {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'voteOnTotem',
      args: [totemId, forOrAgainst]
    });
  }

  return (
    <div>
      <button
        onClick={onVote}
        disabled={isPending || isConfirming}
      >
        {isPending ? 'Confirming...' : forOrAgainst ? 'Vote For 👍' : 'Vote Against 👎'}
      </button>

      {isConfirming && <span>Vote en cours...</span>}
      {isSuccess && <span>Vote enregistré !</span>}
      {error && <span>Erreur: {error.shortMessage}</span>}
    </div>
  );
}
```

### Paramètres de l'appel

| Paramètre | Description |
|-----------|-------------|
| `totemId` | Identifiant du totem en question |
| `forOrAgainst` | Booléen : `true` pour vote FOR, `false` pour AGAINST |

Cet appel ouvrira le wallet (MetaMask) pour confirmation de la transaction par l'utilisateur.

---

## Gestion UI du vote

### Pendant la demande de signature

- Désactiver les boutons de vote sur ce totem
- Indiquer à l'utilisateur de valider la transaction dans son wallet
- Même logique que le `isPending`

### Après l'envoi de la transaction

- On obtient un hash
- On utilise `useWaitForTransactionReceipt` pour suivre son inclusion dans un bloc

### Après confirmation

- Afficher un message "Vote enregistré !"
- Rafraîchir le nombre de votes pour/contre

---

## Mise à jour des données après vote

Selon l'application, on pourrait alors rafraîchir le nombre de votes pour/contre en :

### Option 1 : Lecture du contrat

```typescript
import { useReadContract } from 'wagmi';

const { data: voteCount, refetch } = useReadContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'getVoteCount',
  args: [totemId],
});

// Après succès du vote
useEffect(() => {
  if (isSuccess) {
    refetch();
  }
}, [isSuccess]);
```

### Option 2 : Surveillance d'événement

Surveiller un événement `VoteCast` émis par le contrat :

```typescript
import { useWatchContractEvent } from 'wagmi';

useWatchContractEvent({
  address: contractAddress,
  abi: contractAbi,
  eventName: 'VoteCast',
  onLogs(logs) {
    // Mettre à jour les compteurs de vote
  },
});
```

---

## Composant TotemCard complet

Exemple d'un composant affichant un totem avec ses boutons de vote :

```typescript
function TotemCard({ totem }) {
  return (
    <div className="totem-card">
      <h3>{totem.name}</h3>
      <p>Catégorie: {totem.category}</p>

      <div className="vote-counts">
        <span>👍 {totem.forVotes}</span>
        <span>👎 {totem.againstVotes}</span>
      </div>

      <div className="vote-buttons">
        <VoteButton totemId={totem.id} forOrAgainst={true} />
        <VoteButton totemId={totem.id} forOrAgainst={false} />
      </div>
    </div>
  );
}
```

---

## Gestion des votes multiples

Selon la logique du contrat :
- Un utilisateur peut-il voter plusieurs fois ?
- Peut-il changer son vote ?

L'UI doit refléter ces règles :
- Désactiver les boutons si l'utilisateur a déjà voté
- Afficher le vote actuel de l'utilisateur
- Permettre de modifier le vote si autorisé

---

## Récapitulatif du flux de vote

| Étape | Action |
|-------|--------|
| 1 | L'utilisateur clique sur "Vote For" ou "Vote Against" |
| 2 | `writeContract()` est appelé avec totemId et direction |
| 3 | MetaMask s'ouvre pour confirmation |
| 4 | L'utilisateur confirme la transaction |
| 5 | On attend le minage (`useWaitForTransactionReceipt`) |
| 6 | Message "Vote enregistré !" |
| 7 | Rafraîchissement des compteurs |

---

## Sources

- [useWriteContract](https://wagmi.sh/react/hooks/useWriteContract)
- [useReadContract](https://wagmi.sh/react/hooks/useReadContract)
- [useWatchContractEvent](https://wagmi.sh/react/hooks/useWatchContractEvent)

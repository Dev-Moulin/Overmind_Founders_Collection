# Création d'un totem avec catégorie (interaction "write")

Une fois le wallet connecté, l'utilisateur doit pouvoir créer un nouveau totem en spécifiant une catégorie (par exemple via un formulaire avec champs texte ou sélection de catégorie). Cette action correspond à un appel d'une fonction **write** sur le smart contract (par exemple `createTotem(categorie, ...)`).

---

## Hook useWriteContract

Pour effectuer cela depuis le front-end, nous utilisons le hook Wagmi `useWriteContract` (ou son équivalent) qui permet d'émettre une transaction vers une fonction payable/non-payable du contrat.

> « Le hook `useWriteContract` permet de modifier les données sur un smart contract en appelant une fonction d'écriture. Ce type de fonction nécessite du gas pour s'exécuter, une transaction est donc diffusée afin de changer l'état »

Concrètement, on va préparer l'appel avec :
- L'adresse du contrat
- Son ABI
- Le nom de la fonction
- Les arguments

Puis déclencher la transaction.

---

## Implémentation côté code

On peut créer un composant React `CreateTotemForm` qui contient un formulaire pour saisir les informations du totem (par ex. un champ pour la catégorie, et éventuellement d'autres attributs du totem).

### Utilisation de useWriteContract

```typescript
import { useWriteContract } from 'wagmi';

function CreateTotemForm() {
  const { data: txHash, isPending, error, writeContract } = useWriteContract();

  function onSubmit(categorie: string) {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'createTotem',
      args: [categorie]
    });
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      onSubmit(formData.get('categorie') as string);
    }}>
      <input name="categorie" placeholder="Catégorie" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Confirming...' : 'Créer'}
      </button>
      {error && <p>Erreur: {error.shortMessage}</p>}
      {txHash && <p>Transaction: {txHash}</p>}
    </form>
  );
}
```

### Paramètres de l'appel

| Paramètre | Description |
|-----------|-------------|
| `address` | Adresse du contrat MultiVault |
| `abi` | ABI du contrat (définition des fonctions) |
| `functionName` | Nom de la fonction à appeler (ex: 'createTotem') |
| `args` | Arguments de la fonction (ex: [categorie]) |

Ici, `categorie` est la valeur fournie par l'utilisateur (chaîne de caractères, éventuellement convertie en format approprié pour le contrat). Cet appel va **ouvrir le wallet pour signature**.

---

## Flux de la transaction

1. L'utilisateur remplit le formulaire et clique "Créer"
2. `writeContract()` est appelé avec les paramètres
3. Le wallet (MetaMask) s'ouvre et demande confirmation
4. Si l'utilisateur confirme, la transaction est envoyée au réseau
5. Le hook retourne un **hash de transaction** (`txHash`) que l'on peut conserver pour le suivi

---

## Gestion de l'état de chargement

Au niveau de l'UI, il est important de gérer l'état de chargement lors de cette création.

### Indicateur isPending

Wagmi fournit un indicateur `isPending` qui devient `true` dès que la transaction est initiée et que l'on attend la confirmation du wallet.

| État | isPending | Action UI |
|------|-----------|-----------|
| En attente de signature | `true` | Désactiver le bouton Submit |
| Signature refusée/confirmée | `false` | Réactiver le bouton |

On peut ainsi changer le label du bouton en **"Confirming..."** (ou "En attente...") pendant ce laps de temps.

### Affichage du hash de transaction

Une fois le hash de transaction obtenu, on peut l'afficher (p. ex. sous forme de lien Etherscan) pour plus de transparence :

```typescript
{txHash && (
  <p>
    Transaction:
    <a href={`https://etherscan.io/tx/${txHash}`} target="_blank">
      {txHash.slice(0, 10)}...
    </a>
  </p>
)}
```

---

## Retour de useWriteContract

| Propriété | Type | Description |
|-----------|------|-------------|
| `data` (txHash) | `string` | Hash de la transaction envoyée |
| `isPending` | `boolean` | Transaction en attente de signature |
| `error` | `Error` | Erreur survenue |
| `writeContract` | `function` | Fonction pour déclencher l'appel |

---

## Note sur useContractWrite (ancienne version)

Selon la version de Wagmi, il peut aussi s'agir de `useContractWrite` configuré avec la fonction cible. Le fonctionnement est similaire.

---

## Sources

- [useWriteContract](https://wagmi.sh/react/hooks/useWriteContract)
- [Contract Write Example](https://wagmi.sh/react/examples/contract-write)
- [Viem writeContract](https://viem.sh/docs/contract/writeContract.html)

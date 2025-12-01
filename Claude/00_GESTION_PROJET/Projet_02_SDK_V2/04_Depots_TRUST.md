# Signalement de confiance : Dépôt de $TRUST (staking) sur Atom/Triple

Dans le protocole Intuition, les **Signals** représentent le poids de confiance ou d'importance qu'accorde la communauté à un Atom ou un Triple donné. Ce signal se matérialise par des dépôts de tokens $TRUST dans le vault associé à l'Atom ou au Triple. Plus un utilisateur dépose de tokens sur un élément, plus il « soutient » la véracité ou la pertinence de cet élément.

Le SDK fournit des fonctions pour gérer ces dépôts (aussi appelés staking ou curation signals).

---

## deposit

Cette fonction réalise un dépôt de tokens $TRUST dans le vault d'un Atom ou d'un Triple, pour signaler du support.

Dans la SDK v2, `deposit` est exposée via le package `@0xintuition/protocol` (fonction bas niveau faisant un appel direct au contrat).

### Exemple d'utilisation

```typescript
import { deposit } from '@0xintuition/protocol';

const txHash = await deposit(
  { walletClient, publicClient, address },
  {
    args: [
      BigInt(vaultId),        // l'identifiant de l'Atom ou Triple cible
      BigInt(depositAmount),  // montant à déposer en wei
      walletClient.account.address // adresse recevant les parts (shares)
    ],
    value: BigInt(depositAmount)
  }
);
console.log('Deposited:', txHash);
```

### Paramètres

| Paramètre | Description |
|-----------|-------------|
| `vaultId` | Identifiant (termId) de l'Atom ou Triple cible |
| `depositAmount` | Montant à déposer en wei (ex: 100000000000000000 = 0.1 TRUST) |
| `receiverAddress` | Adresse qui recevra les parts de vault (généralement l'utilisateur) |
| `value` | Montant de TRUST envoyé avec la transaction |

### Mécanisme des Shares

Quand on dépose des tokens dans un vault, le protocole émet en retour des **shares** (parts) représentant votre proportion de ce vault, calculée en fonction du prix de part courant.

Ce mécanisme est analogue à des parts de LP dans une pool :
- Il permet de suivre votre contribution
- Il permet de calculer vos retraits futurs

### Note sur le réseau Intuition

Sur le réseau Intuition L3, $TRUST étant natif, `value` est utilisé directement. Sur un réseau externe où $TRUST serait un ERC20, l'appel serait sans `value` mais nécessiterait une approval préalable.

---

## Événement Deposited

Une fois la transaction minée, les tokens sont transférés au contrat vault et convertis en parts. Un événement **Deposited** est émis :

```
Deposited {
  sender,
  receiver,
  termId,
  assets (montant déposé),
  assetsAfterFees,
  shares (parts obtenues),
  totalShares
}
```

Le SDK retourne simplement le hash de transaction, ou possiblement un résultat avec des détails si on interroge l'événement.

---

## Frais et minimums

| Type | Valeur |
|------|--------|
| Frais d'entrée | 0.5% du montant |
| Frais protocole | 1.25% du montant |
| Redistribution triple → atoms | 0.9% |
| Dépôt minimum | 0.01 TRUST (10^16 wei) |
| Minimum shares | 1e6 wei |

### Exemple de calcul

Dépôt de **100 TRUST** :
- Frais entrée : 0.5 TRUST
- Frais protocole : 1.25 TRUST
- **Total frais** : 1.75 TRUST
- **Contribution réelle** : 98.25 TRUST

Ces paramètres sont gouvernables et susceptibles d'ajustement.

### Redistribution pour les Triples

Lorsque le dépôt vise un Triple, un fractionnement additionnel a lieu : une portion (**0,9% du dépôt**) est redirigée vers les vaults des Atoms sous-jacents au triple.

Ce mécanisme incite à créer des triples dont les Atoms sont de qualité, en redistribuant une partie de la mise aux Atoms liés. En somme, déposer sur un triple verse principalement dans le vault du triple, mais ~0,9% dans chacun des trois Atom vaults liés.

### Dépôt minimum

Le protocole impose un dépôt minimum de **0,01 TRUST**. Toute tentative de dépôt en dessous de ce minimum sera rejetée (revert).

En pratique : 0,01 TRUST = 10^16 wei. Cela évite d'inonder le système de micro-dépôts insignifiants.

---

## batchDepositStatement

Pour déposer sur **plusieurs vaults en une seule transaction**.

Cette fonction du SDK utilise en interne la méthode `depositBatch` du contrat MultiVault qui permet le multi-dépôt groupé.

### Exemple d'utilisation

```typescript
import { batchDepositStatement } from '@0xintuition/sdk';

const depositData = [
  [vaultId1, vaultId2, vaultId3],             // les Vault IDs cibles
  [amount1, amount2, amount3],               // montants à déposer (wei)
  [receiver1, receiver2, receiver3]          // adresses recevant les shares
];
const result = await batchDepositStatement(
  { walletClient, publicClient, address },
  depositData
);
console.log('Batch deposit tx:', result.transactionHash);
```

### Structure des données

`depositData` est structuré en trois sous-tableaux parallèles :
1. Les identifiants de vault cibles
2. Les montants correspondants
3. Les adresses bénéficiaires de chaque dépôt

On peut mettre la même adresse si un seul utilisateur dépose dans plusieurs vaults.

### Correspondance des valeurs

Le contrat s'assure que la **somme des montants** fournis correspond exactement à la valeur envoyée (`msg.value`) dans la transaction.

```
value = amount1 + amount2 + amount3
```

Si ce n'est pas le cas (incohérence), la transaction revert. Le SDK se charge normalement de sommer et d'envoyer correctement la valeur totale.

---

## Avantages du batch

Le batch deposit réduit les coûts globaux en évitant de répéter les étapes communes de plusieurs transactions.

| Aspect | Avantage |
|--------|----------|
| Gas de base | Payé 1 fois au lieu de N |
| Overhead | Mutualisé |
| UX | Action unique pour plusieurs dépôts |

Cela permet par exemple à un utilisateur de signaler son soutien à plusieurs Atoms/Triples d'un coup (par ex. dans une action "stake sur tous ces items") sans encourir des frais de transaction multiples.

---

## Atomicité du batch

Le batch deposit est **atomique sur l'ensemble** :
- Soit tous les dépôts réussissent
- Soit aucun n'est appliqué

Si une des opérations devait échouer, l'appel complet est reverté. Il faut s'assurer que chaque sous-dépôt est valide (montant ≥ min, vault existant, etc.) avant d'appeler.

---

## Limites du batch

Pas de limite stricte de nombre sinon la contrainte de gas :
- Le contrat `depositBatch` attend des tableaux en arguments qui pourraient théoriquement être grands
- En pratique, la taille de la transaction et le gas par dépôt ajouté limitent le nombre
- Chaque dépôt émettra un événement **Deposited** séparé on-chain, ce qui ajoute du coût

**Recommandation** : Batcher quelques dizaines de dépôts si besoin, mais pas des centaines d'un coup.

### Note sur la synchronisation

Tous les dépôts d'un batch partagent la même transaction et donc :
- La même block timestamp
- Les mêmes conditions de prix de part

Ceci peut être utile pour synchroniser un dépôt réparti, mais signifie aussi que tous subiront les frais en une fois.

---

## Résumé des fonctions de dépôt

| Fonction | Usage | Package |
|----------|-------|---------|
| `deposit` | Dépôt unique sur un vault | `@0xintuition/protocol` |
| `batchDepositStatement` | Dépôts multiples en une transaction | `@0xintuition/sdk` |

Après ces opérations, la « force » de l'Atom/Triple dans le système augmente (puisque son vault contient plus de TRUST staké). Les stakers, en échange, reçoivent des parts qui pourront leur permettre de retirer leurs tokens plus tard avec éventuellement des gains.

---

## Sources

- [Deposit and Return](https://docs.intuition.systems/docs/protocol/tokenomics/trust/deposit-and-return)
- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [@0xintuition/protocol (NPM)](https://www.npmjs.com/package/@0xintuition/protocol)

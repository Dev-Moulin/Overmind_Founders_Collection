# Retrait de $TRUST (Redeem) depuis un vault – suppression de signal

La fonction `redeem` permet de retirer ses tokens $TRUST stakés depuis un vault d'Atom ou de Triple. Cela correspond à récupérer son dépôt (plus éventuellement une part des frais accumulés ou émissions, si applicables).

---

## redeem

Dans le SDK V2, `redeem` est également exposée via `@0xintuition/protocol`.

### Paramètres requis

Son usage nécessite de spécifier :
- Le vault concerné
- Le nombre de parts (shares) à échanger contre des tokens
- L'adresse destinataire des tokens retirés
- L'adresse propriétaire des parts (souvent la même si vous retirez vos propres parts)

### Exemple d'utilisation

```typescript
import { redeem } from '@0xintuition/protocol';

// Retirer des tokens d'un vault
const txHash = await redeem(
  { walletClient, publicClient, address },
  {
    args: [
      BigInt(vaultId),      // ID du vault (Atom ou Triple) d'où retirer
      BigInt(sharesAmount), // Quantité de parts à brûler
      walletClient.account.address, // Adresse recevant les tokens en sortie
      walletClient.account.address  // Adresse propriétaire des parts à brûler
    ]
  }
);
console.log('Redeemed:', txHash);
```

### Fonctionnement

On retire depuis le vault `vaultId` en brûlant `sharesAmount` parts (exprimé en wei de parts, car les shares sont également exprimées avec 18 décimales comme les tokens).

Les tokens correspondants (après calcul) seront envoyés à `receiver` (ici l'adresse de l'utilisateur), et les parts seront débitées de son solde (`owner`).

### Retrait partiel ou total

- Pour retirer **tous** ses tokens d'un vault : demander à redeem la totalité de ses shares
- On peut aussi retirer **une partie** (ce qui équivaut à un unstake partiel)

---

## Calcul du montant retiré

Le contrat MultiVault va convertir les shares en montant d'actif selon le **prix de part courant** (qui dépend du total de tokens et de parts dans le vault).

### Frais de sortie

| Type | Valeur |
|------|--------|
| Exit fee | 0.75% |

### Exemple de calcul

Si en brûlant vos parts vous devriez recevoir 10 TRUST :
- Exit fee : ~0.075 TRUST
- **Montant net reçu** : 9.925 TRUST

Ces frais incitent à des dépôts longue durée et préviennent les allers-retours immédiats. Le reste (99,25% dans cet exemple) vous est rendu.

### Garantie du contrat

Le contrat garantit que vous ne pouvez pas retirer plus d'actifs qu'il n'y en a dans le vault (et de toute façon vos parts représentent un pourcentage du vault).

---

## Événement Redeemed

Si le retrait est réussi, un événement **Redeemed** est émis avec les détails :

```
Redeemed {
  sender,
  receiver,
  termId,
  shares (quantité brûlée),
  totalShares (restant),
  assets (montant retourné),
  fees (frais prélevés)
}
```

Le SDK retourne le hash de la transaction de rachat.

---

## Protection minAssets

Le contrat `redeem` prévoit un argument `minAssets` qui permet de spécifier un **minimum de tokens à recevoir**, en deçà duquel la transaction doit annuler.

### Utilité

Cela sert de protection contre les fluctuations du prix de part entre l'envoi de la transaction et son inclusion.

### Fonction d'estimation

Le SDK propose une fonction `previewRedeem` pour calculer à l'avance combien d'assets (tokens TRUST) on obtiendrait en échange de X shares à l'instant présent :

```typescript
const estimatedAssets = await previewRedeem(vaultId, sharesToRedeem);
```

Le développeur peut comparer ce montant à ce que l'utilisateur juge acceptable et éventuellement appeler `redeem` avec une contrainte `minAssets`.

Par défaut, si on ne spécifie rien, on assume généralement recevoir le taux courant.

---

## Atomicité

Un appel de `redeem` porte sur un seul vault et est **atomique** :
- Si une condition d'échec survient, rien n'est retiré ni brûlé
- La transaction revert et aucune part n'est brûlée

### Cas d'échec possibles

- Tenter de retirer plus de parts que ce qu'on possède
- Imposer `minAssets` et que la condition n'est pas remplie (prix a bougé défavorablement)
- Vault inexistant
- Contrat en pause

---

## redeemBatch

Le contrat MultiVault propose aussi une fonction `redeemBatch` pour effectuer **plusieurs retraits en une transaction** (parallèle du `depositBatch`).

Le SDK V2 a probablement une méthode correspondante (peut-être `batchRedeemStatement`).

### Utilité

Utile par exemple pour un utilisateur qui voudrait retirer de tous ses stakes d'un coup.

Les mêmes principes d'atomicité et de gas s'appliquent (batching withdrawals est efficient mais attention aux limites de gas).

---

## Effet sur le graphe

Après un `redeem`, l'Atom ou le Triple en question voit son **signal diminuer** (puisque des tokens ont été retirés de son vault).

Si beaucoup de monde retire, le poids de l'information baisse, ce qui peut affecter son classement ou sa crédibilité relative dans les applications construites sur Intuition.

**Important** : Le contenu (Atom/Triple) lui-même reste en place on-chain, seul le niveau de confiance change.

---

## Récupération des tokens

Pour un utilisateur, retirer signifie récupérer ses tokens $TRUST.

Sur le réseau Intuition L3, ceux-ci peuvent ensuite être :
- Bridgés vers Base
- Utilisés autrement

### Récompenses d'émission

Le protocole Intuition encourage aussi le maintien de stake en distribuant des récompenses d'émission de TRUST aux stakers (selon un schéma d'émission bi-hebdomadaire), mais cela sort du cadre immédiat de cette documentation.

---

## Tableau récapitulatif

| Fonction | Usage |
|----------|-------|
| `redeem` | Retrait unique depuis un vault |
| `redeemBatch` | Retraits multiples en une transaction |
| `previewRedeem` | Estimation du montant à recevoir |

| Paramètre | Valeur |
|-----------|--------|
| Exit fee | 0.75% |
| Protection | minAssets (optionnel) |

---

## Sources

- [Deposit and Return](https://docs.intuition.systems/docs/protocol/tokenomics/trust/deposit-and-return)
- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [@0xintuition/protocol (NPM)](https://www.npmjs.com/package/@0xintuition/protocol)

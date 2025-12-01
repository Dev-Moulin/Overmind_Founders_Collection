# Dépôts (deposit, batchDeposit), retraits (redeem) et getVaultShares

Le protocole Intuition V2 permet aux utilisateurs de **staker du token TRUST** sur des atomes ou des triples afin de signaler leur confiance. Ces opérations passent par le contrat **MultiVault** (EthMultiVaultV2), qui gère les dépôts, retraits et le système de bonding curve.

---

## Fonction deposit

Le MultiVault V2 unifie le dépôt sur atomes et triples via une **fonction deposit commune**.

### Paramètres

| Paramètre | Description |
|-----------|-------------|
| `termId` | ID du terme (atome ou triple) |
| `curveId` | Identifiant de la courbe de bonding |
| `amount` | Montant en TRUST (envoyé en msg.value) |
| `minShares` | Minimum de parts attendues (protection slippage) |

L'utilisateur spécifie l'ID de la "term" (terme pouvant être un atome ou un triple) et un identifiant de courbe de bonding (`curveId`), ainsi qu'un montant en TRUST (envoyé en `msg.value` sur Intuition L3 car TRUST est la monnaie native).

### Paramètre curveId

Le paramètre `curveId` indique **quelle courbe de bonding utiliser** pour calculer les parts :
- Par défaut, les triples utilisent une courbe prédéfinie (ex: linéaire ou progressive)
- Le contrat calcule le nombre de parts de vault à émettre en échange du dépôt
- Tient compte de la formule de la courbe et des frais éventuels

### Protection contre le slippage (minShares)

Pour sécuriser l'utilisateur contre les fluctuations, deposit prend un paramètre `minShares` :
- Si le calcul aboutit à **moins de parts que ce minimum**, la transaction est revertée
- Ce mécanisme évite de recevoir moins de parts que prévu
- Protège contre les variations de prix entre soumission et exécution

### Événement Deposited

Chaque dépôt réussi déclenche un événement **Deposited** détaillant :

```solidity
event Deposited(
    address sender,
    address receiver,
    bytes32 termId,
    uint256 curveId,
    uint256 amount,
    uint256 fees,
    uint256 shares
);
```

---

## Fonction depositBatch

La fonction `depositBatch` permet d'effectuer **plusieurs dépôts en une transaction** pour optimiser le gas.

### Paramètres

L'appelant fournit des tableaux :
- IDs de termes
- IDs de courbes
- Montants
- Minimums de parts

Et envoie la **somme totale des TRUST** à déposer.

### Validation

| Vérification | Description |
|--------------|-------------|
| Somme des montants | Doit correspondre à `msg.value` |
| Traitement individuel | Chaque dépôt traité dans la même exécution |
| Atomicité | Revert entier si une opération est invalide |

### Avantages

Cela réduit le coût global en mutualisant :
- Les frais fixes de transaction
- Les calculs partagés
- L'overhead de transaction

---

## Fonction redeem (retrait)

Le retrait (`redeem`) permet de **récupérer les tokens déposés** en échange de la brûlure des parts correspondantes.

### Paramètres

| Paramètre | Description |
|-----------|-------------|
| `termId` | ID du terme (atome ou triple) |
| `curveId` | ID de la courbe |
| `shares` | Nombre de parts à racheter |
| `minAssets` | Minimum de tokens attendus (protection slippage) |

### Fonctionnement

1. Le contrat calcule combien de TRUST retirer selon la courbe et l'état du vault
2. Prélève les éventuels frais de sortie
3. Transfère les fonds au receveur

### Événement Redeemed

```solidity
event Redeemed(
    address sender,
    address receiver,
    bytes32 termId,
    uint256 shares,
    uint256 amount,
    uint256 fees
);
```

---

## Fonction redeemBatch

La fonction `redeemBatch` offre la même possibilité **en lot**, pour retirer de multiples positions en une transaction.

- Revert global en cas de problème sur l'une d'elles
- Mêmes avantages de mutualisation que depositBatch

---

## Système de Bonding Curve

Le calcul des parts suit un **système de bonding curve configurable**.

### Principe

Chaque triple ou atome peut être associé à une **courbe de valorisation** :
- Linéaire
- Exponentielle progressive
- Autre (configurable)

Ces courbes sont définies dans le registre **BondingCurveRegistry**.

### Calcul lors d'un dépôt

Lors d'un dépôt, la formule de la courbe est utilisée pour déterminer le **prix actuel de la part** en fonction de la liquidité déjà présente dans le vault.

| Type de courbe | Comportement |
|----------------|--------------|
| Linéaire | Parts émises proportionnellement au montant ajouté |
| Progressive | Coût par part augmente avec le TRUST accumulé |

### Contrat TrustBonding

Le contrat **TrustBonding** intervient ici en :
- Fournissant les méthodes de calcul spécifiques à chaque type de courbe
- Tenant à jour les données associées aux triples

---

## Fonctions de prévisualisation

### previewDeposit (getVaultShares)

La fonction `previewDeposit` (aussi appelée `getVaultShares`) permet de **calculer à l'avance** le nombre de parts qui seraient accordées pour un dépôt donné, **sans effectuer réellement la transaction**.

```typescript
// Retourne le nombre de parts qu'on obtiendrait
const shares = await previewDeposit(termId, curveId, amount);
```

Cette fonction :
- Prend en compte les mêmes formules de bonding curve et frais que les fonctions effectives
- Garantit la cohérence entre la prévisualisation et la réalité
- Est une fonction `view` (sans frais de gas pour l'appel)

### previewRedeem

Inversement, `previewRedeem` permet d'estimer combien de TRUST on obtiendrait en retirant un certain nombre de parts :

```typescript
// Retourne le montant de TRUST qu'on obtiendrait
const assets = await previewRedeem(termId, curveId, shares);
```

### Utilité

Ces fonctions de lecture sont précieuses pour permettre aux clients (dApps, SDK) d'afficher le résultat attendu d'une opération avant de la soumettre.

Exemple d'affichage UI :
> « X TRUST vous donneront Y parts »

---

## Sécurité du système

Le système de dépôt/retrait d'Intuition V2 est conçu pour être :

| Aspect | Mécanisme |
|--------|-----------|
| Flexible | Dépôts multiples, tout type de terme |
| Sûr | Modificateurs `nonReentrant`, `whenNotPaused`, contrôles de slippage |
| Transparent | Fonctions de prévisualisation et événements |

---

## Tableau récapitulatif

| Fonction | Usage | Protection |
|----------|-------|------------|
| `deposit` | Dépôt unique sur un terme | `minShares` |
| `depositBatch` | Dépôts multiples | `minShares[]` |
| `redeem` | Retrait unique | `minAssets` |
| `redeemBatch` | Retraits multiples | `minAssets[]` |
| `previewDeposit` | Estimation parts pour dépôt | - (view) |
| `previewRedeem` | Estimation TRUST pour retrait | - (view) |

---

## Sources

- [EthMultiVaultV2.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/vaults/EthMultiVaultV2.sol)
- [Bonding curves (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/tree/main/contracts/bonding-curves)
- [Docs Intuition - Deposit and Return](https://docs.intuition.systems/docs/protocol/tokenomics/trust/deposit-and-return)

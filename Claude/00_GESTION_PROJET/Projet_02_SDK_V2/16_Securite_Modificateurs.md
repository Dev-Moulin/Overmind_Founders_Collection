# Sécurité, modificateurs d'accès et limitations dans les smart contracts

Les contrats Intuition V2 ont été conçus avec des considérations de **sécurité et de gouvernance strictes**.

---

## Pausabilité (whenNotPaused)

Un modificateur `whenNotPaused` protège les fonctions critiques :
- Création
- Dépôts
- Retraits

### Fonctionnement

| État | Comportement |
|------|--------------|
| Normal | Toutes les fonctions accessibles |
| Pausé | Fonctions critiques bloquées |

En cas de vulnérabilité découverte ou de situation d'urgence, un administrateur peut **pauser le contrat** (via OpenZeppelin Pausable) pour stopper provisoirement ces actions.

### Retrait d'urgence

Dans l'état pausé, seules des opérations spécifiques sont autorisées :
- Possiblement les **retraits d'urgence** (emergency redeem)
- Permet aux utilisateurs de sortir leurs fonds sans frais en cas de gel

Beta implémentait par exemple la possibilité de `redeemAtom` même en pause. Cette capacité est probablement conservée en V2.

---

## Reentrancy Guard (nonReentrant)

Toutes les fonctions financières sont protégées par un `nonReentrant` :
- `deposit`
- `depositBatch`
- `redeem`
- `redeemBatch`

### Protection

Empêche les **attaques de réentrance** :
- Même si un token TRUST ou un appel externe était effectué durant la transaction
- L'attaquant ne pourrait pas rappeler la fonction sur des états intermédiaires

Ce garde-fou s'appuie sur la librairie **OpenZeppelin ReentrancyGuard** (utilisée déjà en V1/Beta).

---

## Access Control (Timelocks et Proxy Administrators)

La gestion du protocole est confiée à des **adresses privilégiées sécurisées** via des Proxy Administrators et Timelocks.

### Contrats de Timelock

| Timelock | Rôle |
|----------|------|
| Upgrades TimelockController | Contrôle les upgrades de contrats (mise à jour logique MultiVault via Proxy Admin) |
| Parameters TimelockController | Contrôle les paramètres modifiables |

### Paramètres modifiables

Certains paramètres peuvent être ajustés par la gouvernance :

| Paramètre | Description |
|-----------|-------------|
| `AtomCreationFee` | Frais de création d'atome |
| `TripleCreationFee` | Frais de création de triple |
| `EntryFee` | Frais d'entrée sur dépôts |
| `ExitFee` | Frais de sortie sur retraits |
| Adresse Warden | Référence d'adresse |
| Adresse Paymaster | Référence d'adresse |

### Opérations de gouvernance

Dans le code, on voit des constantes d'opération utilisées pour la gestion des timelocks :
- `SET_ADMIN`
- `SET_EXIT_FEE`
- etc.

### Délai de sécurité

Une proposition d'ajustement doit **attendre un délai défini** avant d'être appliquée :
- Sécurité supplémentaire contre les changements malveillants ou instantanés
- En temps normal, aucune fonction sensible n'est accessible aux utilisateurs lambda

---

## Vérifications d'intégrité des entrées

Outre les validations de cohérence (atomes/triples non nuls, existants, non dupliqués), le code vérifie systématiquement :

### Correspondance des tableaux

```solidity
require(subjects.length == predicates.length, "Array length mismatch");
require(predicates.length == objects.length, "Array length mismatch");
```

Même longueur pour sujets, prédicats, objets dans `createTriples`, ou pour les listes dans `depositBatch`/`redeemBatch`.

### Correspondance des montants

```solidity
require(sum(amounts) == msg.value, "Value mismatch");
```

Somme des dépôts égale à `msg.value`.

### Limites minimales

```solidity
require(shares >= minShares, "Slippage exceeded");
require(assets >= minAssets, "Slippage exceeded");
```

`minShares` et `minAssets` dans les fonctions pour empêcher les résultats trop faibles.

### En cas de non-respect

La transaction est **revertée immédiatement**. Ces checks évitent :
- Incohérences
- Abus (ex: batch deposit avec tableau mal formé)

---

## Consommation de Gas

L'architecture a été pensée pour **minimiser les coûts** par usage de batch et de calculs off-chain lorsque possible.

### Fonctions de prévisualisation

Les fonctions `previewDeposit` et `previewRedeem` sont `view` (sans frais) :
- Permettent aux clients d'optimiser leurs appels
- Ajuster `minShares`/`minAssets`
- Regrouper plusieurs opérations

### Actions coûteuses

Certaines actions restent coûteuses :

| Action | Raison |
|--------|--------|
| Création de triple | Plusieurs stockages + plusieurs événements |
| Dépôt sur triple | Trois sous-dépôts (un par atome) |

### Recommandation : utiliser les batch

Les développeurs encouragent l'usage de `depositBatch` et `redeemBatch` pour **amortir le coût de l'overhead**.

### Limite inhérente EVM

On ne peut pas créer ou déposer un nombre infini d'éléments en une seule transaction sans risquer d'atteindre le **block gas limit**.

Par précaution, le protocole pourrait imposer une **taille maximale aux batchs** :
- Par ex. 50 triples par appel
- Pour rester en-deçà du gas limit
- Documenté off-chain plutôt qu'on-chain

---

## Protections diverses

### Erreurs custom

Le code utilise des modificateurs et des **erreurs custom** pour clarifier les échecs :

```solidity
error TripleExists();
error NotAtom();
error InsufficientFee();
```

Ces erreurs, combinées aux `require`, garantissent une lecture claire de la cause en cas d'échec.

### Audits de sécurité

Des **audits de sécurité** ont été menés (le repo mentionne des audits agrégés).

Le code a été examiné pour détecter des failles courantes :
- Initialisation incorrecte
- Overflow (Solidity 0.8 avec vérifications intégrées)
- Réentrance
- etc.

### Initializable et reinitialize

La présence d'`Initializable` et de fonctions `reinitialize()` pour le token TRUST indique un soin apporté à la **migration des contrats** :
- Éviter la réinitialisation accidentelle via UUPS proxies

---

## Tableau récapitulatif des protections

| Protection | Mécanisme | Cible |
|------------|-----------|-------|
| Pausabilité | `whenNotPaused` | Fonctions critiques |
| Anti-réentrance | `nonReentrant` | Fonctions financières |
| Contrôle d'accès | Timelocks + Proxy Admin | Upgrades et paramètres |
| Slippage | `minShares`, `minAssets` | Dépôts et retraits |
| Intégrité | Vérification tableaux/montants | Toutes les fonctions batch |
| Anti-spam | Frais de création | Atomes et triples |
| Unicité | Hash + mapping | Atomes et triples |

---

## Conclusion

La V2 des contrats Intuition renforce la sécurité via une combinaison de :

1. **Contrôles d'accès forts** : timelocks, rôles admin
2. **Gardes logiques** : pausable, anti-réentrance, require sur entrées
3. **Limitations économiques** : frais, min deposit

Tout en conservant une **flexibilité suffisante** pour évoluer (upgradeabilité et modules séparés).

Ces mesures, alliées aux audits, réduisent substantiellement les risques d'exploitation malveillante ou d'utilisation non conforme du protocole.

Les quelques contraintes (frais à payer, limites de taille de batch implicites) sont le prix à payer pour assurer la **viabilité et la sûreté** d'un système ouvert à tous.

---

## Sources

- [intuition-contracts-v2 (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2)
- [Upgradeable.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/utils/Upgradeable.sol)
- [VaultEvents.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/events/VaultEvents.sol)
- [Docs Intuition - Smart Contracts](https://docs.intuition.systems/docs/protocol/contracts)
- [TRUST Token (GitHub)](https://github.com/0xIntuition/trust-token)

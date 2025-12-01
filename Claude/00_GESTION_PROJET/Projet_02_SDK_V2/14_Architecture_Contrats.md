# Rôles de IntuitionLogic, IntuitionRouter, EthMultiVaultV2 (MultiVault), TripleStore, AtomStore et interactions

L'architecture des smart contracts Intuition V2 est **modularisée** pour séparer les responsabilités entre plusieurs contrats.

---

## IntuitionRouter

Il s'agit du **point d'entrée principal** pour les opérations de haut niveau sur le graphe de connaissances.

### Rôle

Le Router **orchestre les appels** aux autres contrats pour réaliser des opérations complexes en une seule transaction.

### Exemple : Création de triple via le Router

1. Vérifier les conditions de validité
2. Appeler le stockage des atomes/triples approprié
3. Éventuellement appeler le MultiVault pour créer le conteneur de vault du triple et gérer un dépôt initial
4. Émettre les événements

### Caractéristiques

| Aspect | Description |
|--------|-------------|
| Atomicité | Toutes les étapes dans une seule transaction |
| Interface stable | Contient les fonctions externes appelables par les utilisateurs |
| Routage | "Route" les appels vers la logique métier appropriée |
| Évolutivité | Facilite les mises à jour (logique dans IntuitionLogic) |

---

## IntuitionLogic

Ce contrat encapsule la **logique métier réutilisable**, notamment pour la validation des triples et atomes et le calcul des identifiants uniques.

### Conception

Peut être conçu soit comme :
- Une **bibliothèque interne**
- Un **module appelé** par le Router

### Fonctions fournies

| Fonction | Description |
|----------|-------------|
| `calculateAtomId` | Hash de l'atome à partir des données |
| `calculateTripleId` | Hash combiné des trois atomId |
| Validation | Vérifier qu'un triple n'existe pas encore |

### Caractéristiques

- **Ne stocke pas de données** de manière permanente (délègue aux stores)
- Aisément **upgradable ou substituable**
- Peut être vu comme le **"cerveau fonctionnel"** du système

Cette séparation permet de rendre le code plus lisible et de faciliter les tests ou les évolutions sans toucher au Router.

---

## AtomStore

Ce contrat est dédié au **stockage et à la gestion des atomes** (aussi appelés termes individuels).

### Rôle

| Fonction | Description |
|----------|-------------|
| Registre | Conserve la table des atomes existants |
| Mapping | Hash d'atome → contenu et inversement |
| Unicité | Vérifie la non-existence avant création |
| Stockage | Enregistre les données on-chain |

### Identification des atomes

Dans la V2, les atomes sont identifiés par un **bytes32 unique**, calculé en `keccak256` sur leurs données (chaîne de caractères ou autre).

### Événement AtomCreated

Lors de la création d'un atome via MultiVault, un événement est émis :

```solidity
event AtomCreated(
    bytes32 indexed atomId,
    bytes data,
    address creator
);
```

### Validations possibles

- Taille maximale des données
- Types pris en charge
- Format requis (URL, adresse Ethereum, etc.)

AtomStore joue le rôle de **registre global des identités** du protocole.

---

## TripleStore

De manière analogue, ce contrat **stocke et gère les triples** (relations sujet-prédicat-objet).

### Identification

Plutôt que de stocker directement trois références, Intuition V2 utilise l'**ID du triple** (hash des trois IDs d'atome) comme identifiant unique :

```
tripleId = keccak256(subjectId, predicateId, objectId)
```

### Fonctions

| Fonction | Description |
|----------|-------------|
| Mapping | tripleId → composition (sujet, prédicat, objet) |
| Vérification | `isTermCreated(tripleId)` pour vérifier l'existence |
| Anti-doublon | Empêche la création de duplicatas |
| Typage | Marquer qu'un ID correspond à un triple (vs atome) |

### Événement TripleCreated

Quand un triple est créé via le MultiVault/Router :

```solidity
event TripleCreated(
    bytes32 indexed tripleId,
    bytes32 subjectId,
    bytes32 predicateId,
    bytes32 objectId,
    address creator
);
```

TripleStore est le **registre des assertions** formant le graphe de connaissances on-chain.

---

## EthMultiVaultV2 (MultiVault)

C'est le **cœur économique** du protocole, chargé de tout ce qui a trait aux dépôts de TRUST et à l'émission de parts, ainsi qu'à la création des entités en tant que "vaults" économiques.

### Rôle principal

En V2, il s'appelle simplement **MultiVault** et gère :
- La création des termes (atoms/triples)
- Leurs vaults associés
- Les fonctions de dépôt/retrait

### Flux de création

Lorsque le Router/Logic veut créer un nouvel atome ou triple :

1. Invoque une fonction du MultiVault (`createAtoms` ou `createTriples`)
2. Le MultiVault calcule l'ID unique
3. Enregistre le terme via AtomStore/TripleStore
4. Prépare le vault correspondant pour les dépôts économiques

### Vault par terme

Chaque terme créé est traité comme un **vault distinct** (identifié par le termId) avec :
- Ses propres paramètres de bonding curve
- Son état (total TRUST déposé, total parts en circulation)

### Fonctions exposées

| Fonction | Description |
|----------|-------------|
| `createAtoms` | Créer un ou plusieurs atomes |
| `createTriples` | Créer un ou plusieurs triples |
| `deposit` | Staker sur un terme |
| `redeem` | Unstaker d'un terme |

### Sécurité

Le MultiVault comporte des modificateurs de sécurité globaux :
- `whenNotPaused` : pour geler le système en cas d'urgence
- `nonReentrant` : pour prévenir la réentrance sur dépôts/retraits

**MultiVault est la colonne vertébrale financière d'Intuition** : il connecte la couche de données (Atoms/Triples) à la couche tokenomics.

---

## TrustBonding

Ce contrat est spécifique au **mécanisme de staking** sur les triples (et éventuellement atomes) via les bonding curves.

### Rôle

Agit comme un **module complémentaire** du MultiVault pour implémenter la logique de :
- Partage des dépôts sur les triples entre leurs atomes sous-jacents
- Distribution des parts correspondantes

### Répartition tripartite

Dans la V2, lorsque vous déposez du TRUST sur un triple, les fonds sont **répartis sur les trois atomes liés**.

> Soutenir un triple revient à soutenir ses composants.

### Fonctionnement

1. Déposer X TRUST sur un triple
2. TrustBonding répartit (ex: X/3 sur chaque atome ou selon ratio prédéfini)
3. Enregistre que ce dépôt provient du contexte de tel triple
4. Stocke dans `tripleAtomShares` le nombre de parts de chaque atome attribuées

### Retrait via triple

Ces parts "fantômes" permettent à l'utilisateur de retirer exactement sa contribution :
- Passe par la fonction redeem du triple
- Libère les TRUST depuis les trois atomes proportionnellement

### Interactions

| Contrat | Interaction |
|---------|-------------|
| TripleStore | Connaître les atomes d'un triple |
| MultiVault | Effectuer les dépôts/retraits dans les vaults d'atome |
| BondingCurveRegistry | Appliquer la bonne courbe de valeur |

### Courbes par défaut

TrustBonding peut associer :
- Triples → courbe "OffsetProgressive" (progressive décalée)
- Atomes → courbe "Linear" (linéaire)

Ou toute autre configuration, en se référant aux contrats de courbe déployés (`LinearCurve`, `OffsetProgressiveCurve`).

---

## Interactions entre contrats

### Exemple : Création de triple avec dépôt de TRUST

```
Utilisateur
    │
    ▼
IntuitionRouter ─────────────────────────────────────────┐
    │                                                    │
    │ 1. Reçoit l'intention de créer un triple          │
    │    avec un certain montant de TRUST               │
    │                                                    │
    ▼                                                    │
IntuitionLogic                                           │
    │                                                    │
    │ 2. Vérifie et calcule l'ID unique                 │
    │                                                    │
    ▼                                                    │
MultiVault (createTriples)                               │
    │                                                    │
    │ 3. Enregistre le triple (via TripleStore)         │
    │    Génère l'événement TripleCreated               │
    │    Crée le vault économique du triple             │
    │                                                    │
    ▼                                                    │
TrustBonding                                             │
    │                                                    │
    │ 4. Répartit le TRUST sur les trois atomes         │
    │    Appelle MultiVault pour 3 dépôts atomiques     │
    │    Met à jour tripleAtomShares                    │
    │                                                    │
    ▼                                                    │
IntuitionRouter ◄────────────────────────────────────────┘
    │
    │ 5. Retourne l'ID du triple créé
    │
    ▼
Utilisateur (transaction terminée)
```

Tout cela se fait dans une **seule transaction utilisateur**.

---

## Avantages de l'architecture modulaire

| Avantage | Description |
|----------|-------------|
| Sécurité | Chaque composant plus simple à auditer |
| Mises à jour | Upgrader une partie sans toucher aux autres (proxies/timelocks) |
| Clarté | Séparation entre données sémantiques et logiques financières |
| Testabilité | Chaque module testable indépendamment |

---

## Sources

- [IntuitionRouter.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/IntuitionRouter.sol)
- [IntuitionLogic.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/lib/IntuitionLogic.sol)
- [AtomStore.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/stores/AtomStore.sol)
- [TripleStore.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/stores/TripleStore.sol)
- [TrustBonding.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/TrustBonding.sol)
- [EthMultiVaultV2.sol (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/vaults/EthMultiVaultV2.sol)

# Validation contractuelle des atomes et triples

Le protocole Intuition V2 impose plusieurs règles au niveau smart contract pour assurer la **cohérence des données**.

---

## Validation des Atomes

Un atome ne peut être créé qu'avec des **données non vides et uniques**.

### Calcul de l'ID

Lors de `createAtoms`, le MultiVault/AtomStore calcule le hash de l'atome (`calculateAtomId`) à partir des données fournies :

```solidity
atomId = keccak256(atomData)
```

### Unicité

| Situation | Comportement |
|-----------|--------------|
| Hash n'existe pas | Création autorisée |
| Hash existe déjà | Création empêchée ou retourne l'ID existant |

Deux atomes de contenu identique ne coexisteront pas, évitant les doublons dans le "dictionnaire global".

### Contraintes de taille

Le contrat peut fixer une **taille maximale** pour les données de l'atome :
- String trop longue → refusée pour limiter le gas
- Format requis selon le type d'atome (URL, adresse Ethereum, etc.)

Ces validations de format sont le plus souvent effectuées hors chaîne ou via des conventions.

### Garde-fou économique

La présence d'un **coût de création non négligeable** (0.1 TRUST sur testnet par ex.) décourage la création d'atomes vides ou farfelus.

### Frais de création

La création d'un atome requiert le paiement d'un **frais fixe au protocole** :

```solidity
require(msg.value >= atomCreationFee * numberOfAtoms, "Insufficient fee");
```

Le contrat vérifie `msg.value` et ne poursuit que si le montant couvre les frais pour chaque atome demandé, sinon il revert.

---

## Validation des Triples

### Composants existants

Un triple ne peut être créé que si chacun de ses trois composants est un **atome existant**.

Le contrat vérifie :

```solidity
require(isTermCreated(subjectId) == true, "Subject not found");
require(isTermCreated(predicateId) == true, "Predicate not found");
require(isTermCreated(objectId) == true, "Object not found");
```

### Pas de triples comme composants

Les `subjectId`, `predicateId` et `objectId` fournis doivent pointer vers des **atomes** (pas des triples).

| Vérification | Résultat si échec |
|--------------|-------------------|
| ID invalide | Transaction échoue |
| ID référant à un triple | Transaction échoue |

### Relations réflexives

Le contrat n'interdit pas explicitement qu'un sujet soit le même qu'objet :
- Un énoncé réflexif style "A → relatedTo → A" est **autorisé** si pertinent sémantiquement

### Unicité des triples

Ce qui est strictement empêché est la **duplication d'une même relation** :

```solidity
// Le mapping triplesByHash assure l'unicité
require(triplesByHash[tripleId] == 0, "Triple already exists");
```

Ainsi :
- Si Alice crée "A est ami de B"
- Personne ne pourra recréer exactement "A est ami de B" une seconde fois
- Options : déposer du TRUST sur le triple existant, ou créer un variant

### Frais de création des triples

À la création, un **frais fixe par triple** est exigé (analogue à celui des atomes) pour limiter le spam de triples non pertinents.

| Paramètre | Description |
|-----------|-------------|
| `TripleCreationFee` | Configurable dans TripleConfig du MultiVault |
| Modification | Modifiable par l'admin via timelock |
| Devise | Prélevé en TRUST |

### Dépôt initial optionnel

Si l'utilisateur fournit en plus du frais un **montant supplémentaire** pour "staker" immédiatement sur le triple :
- Le contrat l'accepte
- L'affecte comme dépôt initial (via TrustBonding)

Ce dépôt initial subit aussi une validation :

```solidity
// Minimum défini pour éviter des vaults sans liquidité
require(initialDeposit >= minDeposit, "Deposit below minimum");
```

---

## Résumé des règles de validation

### Atomes

| Règle | Description |
|-------|-------------|
| Non vide | Données obligatoires |
| Unique | Hash unique dans le système |
| Taille | Maximum configurable |
| Frais | atomCreationFee requis |

### Triples

| Règle | Description |
|-------|-------------|
| Composants existants | Les 3 IDs doivent être des atomes créés |
| Pas de triples comme composants | subjectId/predicateId/objectId = atomes uniquement |
| Unique | Un seul triple (s,p,o) possible |
| Frais | tripleCreationFee requis |
| Dépôt initial | Optionnel, mais avec minimum si fourni |

---

## Cohérence garantie

La cohérence des triples et atomes est garantie contractuellement par :

1. **Identifiants hash immuables** : keccak256 sur les données
2. **Vérification systématique** de l'existence des composants
3. **Unicité globale** des termes et assertions
4. **Frais/dépôts minimaux** qui alignent les incitations

Ces mécanismes découragent les entrées inconsistantes ou vides.

---

## Sources

- [intuition-contracts-v2 (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2)
- [Intuition Gitbook - Validation](https://intuition.gitbook.io)
- [Docs Intuition - Smart Contracts](https://docs.intuition.systems/docs/protocol/contracts)

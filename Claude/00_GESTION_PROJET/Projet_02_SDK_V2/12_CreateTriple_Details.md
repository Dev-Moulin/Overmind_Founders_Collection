# Fonctionnement de batchCreateTripleStatements et createTripleStatement

Ces fonctions (respectivement la version par lot et la version unitaire de création de "triples") permettent de créer de nouvelles assertions triples dans le graphe d'Intuition V2. Chaque triple est défini par trois atomes existants : un **sujet**, un **prédicat** et un **objet**.

---

## Validation des composants

Le code exige que chacun des identifiants fournis corresponde à un **atome valide déjà créé** (et non un triple) ; dans le cas contraire, la transaction est annulée.

### Règles de validation

| Règle | Description |
|-------|-------------|
| Atomes existants | Les trois IDs doivent pointer vers des atomes créés |
| Pas de triples comme composants | subjectId, predicateId, objectId ne peuvent pas être des triples |
| Composants non nuls | Aucun des trois IDs ne doit être nul ou manquant |
| Composants distincts | Les trois IDs doivent être présents et vérifiés |

Le contrat vérifie que les trois IDs d'atome sont bien présents et distincts avant de créer le triple.

---

## Déduplication et unicité

Une déduplication est assurée grâce à un **hash unique du triple** : si un triple identique (même sujet, prédicat, objet) existe déjà, la création est rejetée.

### Mécanisme de déduplication

```
tripleId = keccak256(subjectId, predicateId, objectId)
```

Le mapping `triplesByHash` empêche les doublons. Ainsi :
- Si Alice crée "A est ami de B"
- Personne (y compris Alice) ne pourra recréer exactement "A est ami de B" une seconde fois
- Ils devront soit déposer du TRUST sur le triple existant
- Soit créer un variant (ex: "B est ami de A" qui est un autre triple si l'arc est dirigé)

---

## Atomicité des opérations batch

La fonction par lot (`batchCreateTripleStatements`) effectue une **boucle de création** pour chaque triple de la liste et **révertit l'ensemble** si l'une des créations échoue.

### Garantie d'atomicité

| Comportement | Description |
|--------------|-------------|
| Tout ou rien | Si un triple échoue, aucun n'est créé |
| Transaction unique | Toutes les créations dans une seule transaction |
| Revert global | Une erreur annule l'ensemble du batch |

---

## Frais de création

En pratique, `batchCreateTripleStatements` attend en paiement au moins la **somme des frais fixes de création** pour chaque triple (`getTripleCost()`), faute de quoi elle réverte également.

### Calcul des frais

```
Frais total = nombre_de_triples × getTripleCost()
```

Le contrat vérifie que `msg.value` couvre les frais pour chaque triple demandé, sinon il revert.

---

## Événement TripleCreated

Lors de la création, un événement **TripleCreated** est émis, contenant :
- L'ID du triple (généré par keccak256 sur les trois IDs d'atome)
- Les composants du triple (subjectId, predicateId, objectId)
- Le créateur

```solidity
event TripleCreated(
    bytes32 indexed tripleId,
    bytes32 subjectId,
    bytes32 predicateId,
    bytes32 objectId,
    address creator
);
```

---

## Évolution vers createTriples

À noter que la fonction unitaire `createTripleStatement` sert le même but pour un seul triple.

Dans l'implémentation V2, l'interface a évolué vers une **fonction unique `createTriples`** capable de traiter un tableau d'entrées, ce qui équivaut à la version batch.

```typescript
// On peut appeler createTriples avec un seul élément
await createTriples([
  [subjectId, predicateId, objectId]
]);

// Ou avec plusieurs
await createTriples([
  [subjectId1, predicateId1, objectId1],
  [subjectId2, predicateId2, objectId2],
  [subjectId3, predicateId3, objectId3]
]);
```

---

## Coût en gas

En termes de gas, la création d'un triple implique :

| Opération | Description |
|-----------|-------------|
| Calcul du hash | keccak256 sur les trois IDs |
| Écriture stockage | Trois références d'atome + ID du triple |
| Dépôt initial | Traitement éventuel si montant fourni |
| Événement | Émission de TripleCreated |

### Avantage du batch

La version batch permet d'**économiser du gas** par rapport à des transactions séparées, en mutualisant certaines opérations :
- Vérification des conditions
- Paiement global des frais
- Overhead de transaction unique

---

## Résumé

Ces fonctions garantissent l'intégrité des données en :

1. **Validant l'existence** des atomes (pas de "composant vide")
2. **Assurant l'unicité** des triples (pas de doublons)
3. **Annulant toute création** en lot si une condition fait défaut
4. **Exécutant le tout** dans une seule transaction atomique

---

## Sources

- [intuition-contracts-v2 (GitHub)](https://github.com/0xIntuition/intuition-contracts-v2)
- [Intuition Gitbook - Triples](https://intuition.gitbook.io)
- [Docs Intuition - Smart Contracts](https://docs.intuition.systems/docs/protocol/contracts)

# Création de Triples (createTripleStatement & batchCreateTripleStatements)

Un **Triple** représente une relation de forme **sujet-prédicat-objet** reliant trois Atoms, à l'analogie d'une assertion sémantique dans un graphe de connaissances. Chaque composant du triple est identifié par l'ID d'un Atom existant. Le SDK V2 fournit des fonctions pour créer ces triplets on-chain.

---

## createTripleStatement

Crée un triple (une relation) en spécifiant les identifiants des trois Atoms à relier. Cette fonction correspond en interne à un appel de la fonction `createTriples` du MultiVault avec un seul triple.

### Exemple d'utilisation

```typescript
import { createAtomFromString, createTripleStatement } from '@0xintuition/sdk';

// Imaginons que atom1, atom2, atom3 soient des IDs d'Atoms existants
const triple = await createTripleStatement(
  { walletClient, publicClient, address },
  {
    args: [atom1Id, atom2Id, atom3Id],
    value: 1000000000000000000n  // dépôt de 1.0 TRUST (optionnel)
  }
);
console.log('Triple ID:', triple.state.termId);
```

### Workflow typique

Dans cet exemple tiré de la documentation, on crée d'abord trois Atoms simples (atom1, atom2, atom3) via `createAtomFromString`, puis on crée un Triple qui lie ces trois Atoms.

### Paramètres

- `args` : tableau des identifiants (IDs) de chaque Atom composant le triple `[subjectId, predicateId, objectId]`
- `value` : dépôt optionnel en wei (1e18 = 1 TRUST)

### Prérequis important

**Les Atoms référencés doivent exister préalablement** (avoir été créés) pour que le triple puisse être formé, sinon la transaction échouera.

---

## Calcul de l'ID du Triple

Le contrat MultiVault calcule un ID unique de Triple en hashant les trois IDs d'atom :

```
tripleId = keccak256(subjectId, predicateId, objectId)
```

Ainsi, un même ensemble (A, B, C) produira toujours le même `tripleId`. Si le triple identique a déjà été créé auparavant, le contrat pourrait refuser le doublon de la même manière que pour les Atoms (chaque triple étant unique dans le graphe).

---

## Dépôt lors de la création

Dans l'appel ci-dessus, on voit un paramètre `value` correspondant à un dépôt de 1 ETH (1 * 10^18 wei) – dans le contexte d'Intuition, cela signifie **1.0 TRUST** (car sur le réseau Intuition L3 le token natif est TRUST, 18 décimales).

Ce dépôt est **optionnel** lors de la création du triple :
- S'il est fourni, il sera staké immédiatement sur le triple nouvellement créé
- Sinon, on peut créer un triple avec `value: 0` (en ne payant que les frais de création) – le triple existera alors avec un signal initial nul

### Frais de création

Les frais de création d'un triple sont analogues à ceux d'un atom, soit **0,1 TRUST fixe**, prélevés lors de la transaction de création. Si vous fournissez un `value` supérieur, le surplus est traité comme un dépôt (après soustraction des frais fixes et frais d'entrée applicables).

---

## Résultat de la fonction

Le résultat de `createTripleStatement` inclura :
- Le hash de transaction
- Un objet d'état avec le `tripleId` créé (souvent appelé aussi `termId` dans l'API)
- Possiblement le détail du dépôt si fait

### Événement émis

Un événement **TripleCreated** est émis on-chain pour chaque triple créé, contenant le créateur et les trois IDs liés.

---

## batchCreateTripleStatements

Permet de créer **plusieurs triples en une seule transaction** (création groupée). Plutôt que d'appeler séparément la création pour chaque relation, on peut préparer des triplés en lot.

### Exemple d'utilisation

```typescript
import { batchCreateTripleStatements } from '@0xintuition/sdk';

const triplesData = [
  [subjectId1, predicateId1, objectId1],
  [subjectId2, predicateId2, objectId2],
  [subjectId3, predicateId3, objectId3],
];
const result = await batchCreateTripleStatements(
  { walletClient, publicClient, address },
  triplesData,
  1000000000000000000n  // dépôt optionnel de 1.0 TRUST par triple
);
console.log('Triples créés, IDs:', result.state);
```

### Structure des paramètres

La fonction accepte :
- Un tableau de triplets (chaque triplet étant un tableau de trois IDs d'atom)
- Un montant de dépôt par triple (optionnel, peut être mis à 0 ou omis)

Dans cet exemple, 1e18 wei soit 1 TRUST sera déposé sur **chaque** triple créé.

---

## Avantages du batch

L'avantage du batch est l'**efficacité** : toutes les créations sont regroupées dans une seule transaction, ce qui économise du gas par rapport à N transactions individuelles.

| Aspect | Batch | Transactions séparées |
|--------|-------|----------------------|
| Gas fixe | Payé 1 fois | Payé N fois |
| Overhead | Amorti | Répété |
| Efficacité | Haute | Basse |

La documentation souligne que les opérations groupées réduisent significativement le gas total dépensé par rapport à des opérations unitaires répétées. En contrepartie, une transaction plus lourde consommera plus de gas en une fois, donc il faut veiller à rester en deçà des limites de gas du bloc.

---

## Atomicité du batch

La création batch est **atomique** au niveau de la transaction :
- Si l'une des créations de triple dans la liste devait échouer (par exemple, un des tripleId existe déjà, ou un des Atom IDs n'est pas valide), alors **toute la transaction est revertée** et aucun des triples du lot n'est créé
- C'est **tout ou rien**

Cela garantit la cohérence du graphe (pas de création partielle) mais implique qu'une erreur sur un élément invalide le batch complet.

---

## Limites de batch

| Aspect | Détail |
|--------|--------|
| Limite protocole | Pas de limite arbitraire |
| Limite pratique | Contraintes de gas et taille de transaction |
| Recommandation | Dizaines de créations, pas des milliers |
| Solution si trop grand | Découper en plusieurs batches |

### Exemples pratiques

- Créer **10 triples** dans un batch consommera bien moins de gas que 10 transactions séparées
- Créer **1000 triples** en une transaction risque d'être impossible du fait des limites de bloc

En somme, utilisez le batch de manière judicieuse pour grouper un nombre modéré de créations liées, tout en surveillant la consommation de gas lors des tests.

---

## Tableau récapitulatif

| Propriété | Valeur/Comportement |
|-----------|---------------------|
| Calcul ID | `keccak256(subjectId, predicateId, objectId)` |
| Atomicité batch | Tout ou rien - si un échoue, tous échouent |
| Frais création | 0.1 TRUST par triple |
| Prérequis | Les 3 Atoms doivent exister |
| Unicité | Un triple ne peut exister qu'une fois |
| Événement | TripleCreated |

---

## Sources

- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [GitHub – intuition-ts](https://github.com/0xIntuition/intuition-ts)
- [@0xintuition/sdk (NPM)](https://www.npmjs.com/package/@0xintuition/sdk)

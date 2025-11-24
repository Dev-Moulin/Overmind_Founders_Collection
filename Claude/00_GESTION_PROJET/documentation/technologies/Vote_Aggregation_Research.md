# Recherche : Mécanisme d'Agrégation des Votes INTUITION v2

**Date** : 19 novembre 2025
**SDK Version** : `@0xintuition/sdk@2.0.0-alpha.4`
**Objectif** : Comprendre comment les votes sont comptabilisés dans le protocole INTUITION v2

---

## Question de recherche

**Problématique** : Lorsqu'un utilisateur crée plusieurs claims avec le même objet mais des prédicats différents, comment les votes sont-ils comptabilisés ?

### Scénario exemple

```
Claim 1: "Joseph Lubin is represented by Lion" (50 TRUST FOR)
Claim 2: "Joseph Lubin embodies Lion" (30 TRUST FOR)
Claim 3: "Joseph Lubin channels Lion" (20 TRUST FOR)
```

**Question** : Le totem "Lion" a-t-il :
- **Option A** : 3 vaults séparés avec 50, 30, 20 TRUST (votes séparés par triple) ?
- **Option B** : 1 vault partagé avec 100 TRUST total (votes agrégés par objet) ?

---

## Méthodologie de recherche

### 1. Analyse du SDK v2.0.0-alpha.4

Recherche effectuée dans le SDK installé localement :

```bash
/home/paul/THP_Linux/Dev_++/Overmind_Founders_Collection/
└── node_modules/.pnpm/@0xintuition+sdk@2.0.0-alpha.4_*/
    └── node_modules/@0xintuition/sdk/dist/
```

### 2. Fichiers analysés

- `index.d.ts` - Définitions TypeScript
- `index.mjs` - Code source du SDK
- `index.js` - Code compilé

---

## Découvertes principales

### 1. Fonction `calculateTripleId()`

**Emplacement** : `node_modules/@0xintuition/sdk/dist/index.mjs:878`

```typescript
function calculateTripleId(subjectAtomData, predicateAtomData, objectAtomData) {
  const salt = keccak256(toHex("TRIPLE_SALT"));
  return keccak256(
    encodePacked(
      ["bytes32", "bytes32", "bytes32", "bytes32"],
      [salt, subjectAtomData, predicateAtomData, objectAtomData]
    )
  );
}
```

**Analyse** :
- Le `tripleId` est calculé par un **hash cryptographique** des 3 composants
- Formule : `keccak256(SALT + subjectId + predicateId + objectId)`
- Changer **n'importe quel** composant produit un `tripleId` différent

**Conséquence** :
```
Triple 1: hash(Joseph Lubin + is represented by + Lion) = 0xabc123...
Triple 2: hash(Joseph Lubin + embodies + Lion)          = 0xdef456...  ← DIFFÉRENT !
Triple 3: hash(Joseph Lubin + channels + Lion)          = 0xghi789...  ← DIFFÉRENT !
```

### 2. Fonction `calculateCounterTripleId()`

**Emplacement** : `node_modules/@0xintuition/sdk/dist/index.mjs:887`

```typescript
function calculateCounterTripleId(tripleId) {
  const salt = keccak256(toHex("COUNTER_SALT"));
  return keccak256(encodePacked(["bytes32", "bytes32"], [salt, tripleId]));
}
```

**Analyse** :
- Chaque triple a un "counter triple" pour les votes AGAINST
- Le counter est dérivé du `tripleId` principal
- Confirme que les vaults sont assignés **par triple**, pas par objet

### 3. Fonction `batchCreateTripleStatements()`

**Emplacement** : `node_modules/@0xintuition/sdk/dist/index.mjs:198`

```typescript
async function batchCreateTripleStatements(config, data, depositAmount) {
  const { address, publicClient } = config;
  const tripleBaseCost = await getTripleCost({
    publicClient,
    address
  });

  // Calcul du coût total pour la création
  const [subjects, predicates, objects, deposits] = data;

  // ... création des triples avec transactions

  return {
    uris,
    state: state.map((i) => i.args),
    transactionHash: txHash
  };
}
```

**Analyse** :
- Les triples sont créés individuellement
- Chaque triple génère un événement avec son propre `termId`
- Pas de mécanisme d'agrégation automatique visible

### 4. Retour de `batchCreateTripleStatements`

**Type de retour** :

```typescript
{
  transactionHash: `0x${string}`;
  state: [{
    creator: `0x${string}`;
    termId: `0x${string}`;      // ← ID unique du triple
    subjectId: `0x${string}`;
    predicateId: `0x${string}`;
    objectId: `0x${string}`;
  }];
}
```

**Analyse** :
- Chaque triple retourne son propre `termId`
- Ce `termId` sert d'identifiant pour les vaults
- Confirme l'unicité de chaque triple

---

## Architecture des Vaults

### Structure du MultiVault

D'après le code SDK et les recherches web :

```
MultiVault Contract (ERC-1155 + ERC-4626 hybrid)
├── Triple 1 (termId: 0xabc123...)
│   ├── Vault FOR (positiveVault)
│   │   ├── totalShares
│   │   └── totalAssets (TRUST FOR)
│   └── Vault AGAINST (negativeVault)
│       ├── totalShares
│       └── totalAssets (TRUST AGAINST)
├── Triple 2 (termId: 0xdef456...)
│   ├── Vault FOR
│   └── Vault AGAINST
└── Triple 3 (termId: 0xghi789...)
    ├── Vault FOR
    └── Vault AGAINST
```

**Caractéristiques** :
- Chaque triple = 2 vaults (FOR et AGAINST)
- Les vaults sont identifiés par le `termId` du triple
- Pas de partage de vaults entre triples

---

## Réponse à la question de recherche

### ✅ RÉPONSE : Option A - Votes séparés par triple

Les votes sont comptabilisés **indépendamment pour chaque triple complet** (sujet + prédicat + objet).

### Preuve technique

1. **Fonction `calculateTripleId()`** : Hash de tous les composants
2. **Chaque triple a un `termId` unique** : Pas de réutilisation
3. **Vaults assignés par `termId`** : Un triple = une paire de vaults
4. **Pas de fonction d'agrégation** : Aucune fonction `getObjectTotalVotes()` trouvée

### Exemple concret

```javascript
// On-chain
Triple 1: "Joseph Lubin is represented by Lion"
  termId: 0xabc123...
  Vault FOR:     50 TRUST
  Vault AGAINST: 5 TRUST
  NET:           45 TRUST

Triple 2: "Joseph Lubin embodies Lion"
  termId: 0xdef456...
  Vault FOR:     30 TRUST
  Vault AGAINST: 2 TRUST
  NET:           28 TRUST

Triple 3: "Joseph Lubin channels Lion"
  termId: 0xghi789...
  Vault FOR:     20 TRUST
  Vault AGAINST: 0 TRUST
  NET:           20 TRUST

// Résultat
Total on-chain pour "Lion" : AUCUN
Les 3 triples sont indépendants avec leurs propres scores (45, 28, 20)
```

---

## Implications pour le projet

### 1. Agrégation client-side nécessaire

Puisque le protocole ne fait **pas** d'agrégation automatique, nous devons :

**Query GraphQL** : Récupérer tous les triples d'un fondateur
```graphql
query GetFounderTotems($founderId: String!) {
  triples(where: { subject_id: { _eq: $founderId } }) {
    id
    predicate { id, label }
    object { id, label }
    positiveVault { totalAssets }
    negativeVault { totalAssets }
  }
}
```

**Agrégation côté client** : Regrouper par `object.id`
```typescript
function aggregateByObject(triples) {
  // Grouper par objectId
  // Sommer les NET scores (FOR - AGAINST) de chaque triple
  // Retourner les totems avec scores agrégés
}
```

### 2. Liberté de prédicat

**Avantage** : Les users peuvent créer n'importe quel prédicat
- "is represented by"
- "embodies"
- "channels"
- "resonates with"
- etc.

**Conséquence** : Enrichit le knowledge graph INTUITION

### 3. Gestion des prédicats négatifs

**Problème potentiel** :
```
Claim: "Joseph Lubin does NOT embody Lion"
→ Si les gens votent FOR ce claim
→ L'agrégation par objet compterait ça comme un vote pour "Lion" ❌
```

**Solution** : Utiliser le NET score (FOR - AGAINST)
- Si les gens votent AGAINST un claim négatif, le NET sera faible/négatif
- L'agrégation par NET score résout le problème naturellement
- Le système s'auto-régule via les votes AGAINST

---

## Décisions d'implémentation

### Stratégie d'agrégation retenue

**Agrégation par objet avec NET score** :

```typescript
// Pour chaque objet (totem)
totalNetScore = Σ (claim.voteFor - claim.voteAgainst)

// Exemple
Lion:
  Claim 1: (50 FOR - 5 AGAINST) = 45
  Claim 2: (30 FOR - 2 AGAINST) = 28
  Claim 3: (20 FOR - 0 AGAINST) = 20
  ─────────────────────────────────
  Total NET:                      93 TRUST
```

**Avantages** :
✅ Agrège tous les claims pour un même totem
✅ Gère les prédicats négatifs correctement
✅ Utilise le système FOR/AGAINST comme prévu
✅ Auto-régulateur (la communauté vote AGAINST les mauvais claims)

### Affichage pour les users

**Transparence totale** :
- Afficher le score NET agrégé par totem
- Permettre de voir le détail des claims individuels
- Montrer le nombre de claims par totem
- Indiquer le prédicat le plus utilisé

---

## Fonctions utilitaires implémentées

### 1. Agrégation des votes

**Fichier** : `apps/web/src/utils/aggregateVotes.ts`

```typescript
export function aggregateTriplesByObject(
  triples: Triple[]
): AggregatedTotem[]
```

### 2. Hook React (à implémenter)

**Fichier prévu** : `apps/web/src/hooks/useFounderTotems.ts`

```typescript
// À IMPLÉMENTER
export function useFounderTotems(founderId: string) {
  // Query GraphQL + Agrégation
  // Retourne les totems triés par NET score
}
```

> **Note** : Ce hook n'est pas encore implémenté. Utiliser `useAllTotems.ts` existant.

### 3. Helper formatage

**Fichier** : `apps/web/src/utils/aggregateVotes.ts`

```typescript
export function formatTrustAmount(amount: bigint): string
export function getWinningTotem(totems: AggregatedTotem[]): AggregatedTotem | null
```

---

## Sources

### Code source SDK

- **SDK Package** : `@0xintuition/sdk@2.0.0-alpha.4`
- **Fichiers analysés** :
  - `node_modules/@0xintuition/sdk/dist/index.d.ts` (lignes 884, 972, 3537)
  - `node_modules/@0xintuition/sdk/dist/index.mjs` (lignes 198, 392, 878, 887)

### Documentation officielle

- **INTUITION Docs** : https://www.docs.intuition.systems/
- **SDK Docs** : https://www.docs.intuition.systems/docs/developer-tools/sdks/overview
- **GraphQL API** : https://www.docs.intuition.systems/docs/developer-tools/graphql-api/overview

### Repositories GitHub

- **Monorepo TypeScript** : https://github.com/0xIntuition/intuition-ts
- **Smart Contracts v2** : https://github.com/0xIntuition/intuition-contracts-v2
- **SDK Package** : https://github.com/0xIntuition/intuition-ts/tree/main/packages/sdk

### Articles Medium

- **$TRUST Token** : https://medium.com/0xintuition/introducing-intuitions-native-token-trust-9c08188b7ea3
  > "Every claim receives an associated vault... with Claims having **two vaults—one affirmative and one negative vault**."

- **Tokenomics** : https://medium.com/0xintuition/intuition-trust-tokenomics-17af2ffeb138

---

## Conclusion

**Le protocole INTUITION v2 traite chaque triple (sujet+prédicat+objet) comme une entité unique avec ses propres vaults FOR/AGAINST. Il n'y a pas d'agrégation automatique par objet.**

**Pour notre projet "Overmind Founders Collection"** :
- Nous agrégeons les votes **côté client** par objet (totem)
- Nous utilisons le **NET score** (FOR - AGAINST) de chaque claim
- Les users ont la **liberté** de créer n'importe quel prédicat
- Le système se **régule naturellement** via les votes AGAINST

Cette approche combine :
✅ La flexibilité du protocole INTUITION
✅ Une UX pertinente pour notre use case (vote de totems)
✅ Un système auto-régulateur et transparent

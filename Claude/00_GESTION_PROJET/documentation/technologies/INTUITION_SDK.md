# INTUITION Protocol & SDK - Documentation Technique

**Dernière mise à jour** : 21 novembre 2025
**Réseau** : INTUITION L3 Testnet (Chain ID: 13579)

---

## Vue d'ensemble

INTUITION Protocol permet de créer un graphe de connaissances on-chain en utilisant trois primitives :
- **Atoms** : Unités atomiques de connaissance (personnes, concepts, objets)
- **Triples** : Relations entre Atoms au format RDF (Sujet-Prédicat-Objet)
- **Signals** : Votes/Stakes pour affirmer ou rejeter un Triple

---

## Configuration Réseau

### ⚠️ IMPORTANT : Réseau utilisé

**INTUITION L3 Testnet** (Chain ID: **13579**)

```typescript
// Configuration correcte
import { intuitionTestnet } from '@0xintuition/sdk';

// ❌ NE PAS UTILISER
// import { base } from 'viem/chains'; // Chain ID 8453 - INCORRECT
// import { baseSepolia } from 'viem/chains'; // Chain ID 84532 - INCORRECT
```

### Adresses des contrats (INTUITION L3 Testnet)

```typescript
// Récupérer l'adresse du MultiVault
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
const vaultAddress = getMultiVaultAddressFromChainId(13579); // INTUITION L3 Testnet
```

### GraphQL API

```typescript
import { createClient } from '@0xintuition/graphql';

const client = createClient({
  apiUrl: 'https://api-testnet.intuition.systems/v1/graphql'
});
```

### Faucets

- **$TRUST** : https://testnet.hub.intuition.systems/

---

## Concepts clés

### 1. Atoms (Unités de base)

**Ce qu'on crée :**
- Un Atom par fondateur (42 Atoms)
- Un Atom par totem proposé (animaux, objets, traits)
- Un Atom pour chaque prédicat

**Méthodes SDK disponibles :**
```typescript
// Créer un Atom simple
createAtomFromString(config, value, deposit?)

// Créer un Atom avec métadonnées
createAtomFromThing(config, {
  url: string,
  name: string,
  description: string,
  image: string  // Le SDK gère l'upload IPFS automatiquement
}, deposit?)

// Créer un Atom depuis un compte Ethereum
createAtomFromEthereumAccount(config, address)
```

**Retour de `createAtomFromString`** :
```typescript
{
  uri: string,
  transactionHash: string,
  state: { termId: Hex }  // ID unique de l'atom
}
```

### 2. Triples (Propositions/Claims)

**Structure :**
Un Triple = `[Sujet] + [Prédicat] + [Objet]`

**Pour notre projet :**
- **Sujet** = Fondateur (ex: Joseph Lubin)
- **Prédicat** = Relation (ex: "represented_by", "embodies", "channels")
- **Objet** = Totem proposé (ex: Lion)

**Méthodes SDK :**
```typescript
// Créer un seul triple
createTripleStatement(config, subjectId, predicateId, objectId, deposit?)

// Créer plusieurs triples en batch
batchCreateTripleStatements(config, [
  [subjectIds],
  [predicateIds],
  [objectIds],
  [depositAmounts]
])
```

**Retour de `batchCreateTripleStatements`** :
```typescript
{
  transactionHash: string,
  state: [{
    creator: Hex,
    termId: Hex,      // ID du triple
    subjectId: Hex,
    predicateId: Hex,
    objectId: Hex
  }]
}
```

### 3. Signals/Votes

**Comment ça fonctionne :**
- Chaque Triple a **2 vaults** : FOR (affirmatif) et AGAINST (négatif)
- Les users déposent du $TRUST dans un des vaults
- Plus de $TRUST déposé = plus de conviction
- Les dépôts sont **récupérables** après

**Méthodes de dépôt :**
```typescript
// Voter pour un Triple (FOR)
depositTriple(config, tripleId, amount, true)  // isPositive = true

// Voter contre un Triple (AGAINST)
depositTriple(config, tripleId, amount, false) // isPositive = false

// Voter pour un Atom
depositAtom(config, atomId, amount)
```

**Process de vote (2 étapes)** :
```typescript
// 1. Approve - Autoriser le contrat MultiVault
await approve(vaultAddress, amount);

// 2. Deposit - Déposer dans le vault
await depositTriple(tripleId, amount, isPositive);
```

**Hook implémenté** : `useVote.ts` gère automatiquement ces 2 étapes avec gestion d'erreurs et toasts.

---

## ⚠️ Agrégation des votes - CRITIQUE

### Découverte principale

Les votes sont comptabilisés **indépendamment pour chaque triple** (sujet + prédicat + objet).

**Conséquence** : Un même totem peut avoir **plusieurs claims** avec des prédicats différents.

### Stratégie d'agrégation (client-side)

**Approche correcte** :
1. Récupérer TOUS les triples pour un fondateur
2. Grouper par `objectId` (totem)
3. Calculer le NET score de chaque claim : `FOR - AGAINST`
4. Sommer les NET scores de tous les claims pour un même totem
5. Le totem avec le score NET total le plus élevé gagne

**Fonction implémentée** : `utils/aggregateVotes.ts`
```typescript
import { aggregateTriplesByObject, getWinningTotem } from '@/utils/aggregateVotes';

// Agréger les triples par totem
const aggregatedTotems = aggregateTriplesByObject(triples);

// Obtenir le totem gagnant
const winner = getWinningTotem(aggregatedTotems);
```

**Exemple concret** :
```
Totem: Lion
├─ Claim 1: [Joseph] [represented_by] [Lion] → NET +80 (90 FOR - 10 AGAINST)
├─ Claim 2: [Joseph] [embodies] [Lion] → NET +50 (60 FOR - 10 AGAINST)
└─ Claim 3: [Joseph] [channels] [Lion] → NET +20 (20 FOR - 0 AGAINST)

Total Lion: NET +150 (agrégé)
```

### ❌ Approche incorrecte (NE PAS UTILISER)

```typescript
// ❌ INCORRECT - Ne récupère qu'UN seul triple
query GetWinningTotem {
  triples(
    where: { subject_id: { _eq: $founderId } }
    order_by: { positiveVault: { totalAssets: desc } }
    limit: 1  // ❌ ERREUR !
  ) { ... }
}
```

---

## Prédicats suggérés

Le modal propose des prédicats par défaut :
- **"is represented by"** - Prédicat principal
- **"has totem"**
- **"is symbolized by"**
- **"embodies"**
- **"channels"**
- **"resonates with"**

Les utilisateurs sont libres de créer n'importe quel prédicat.

---

## Architecture des fichiers clés

### Hooks

```
apps/web/src/hooks/
├── useIntuition.ts        # Hook SDK INTUITION (création atoms/triples)
├── useVote.ts             # Hook vote (approve + deposit) ✅ Implémenté
├── useAllProposals.ts     # Hook GraphQL propositions
├── useAllTotems.ts        # Hook avec agrégation ✅ Implémenté
└── useWithdraw.ts         # Hook retrait (à implémenter)
```

### Utils

```
apps/web/src/utils/
└── aggregateVotes.ts      # Fonction d'agrégation ✅ 17 tests passants
```

### GraphQL

```
apps/web/src/lib/graphql/
├── queries.ts             # Requêtes GraphQL
└── types.ts               # Types TypeScript
```

---

## État d'implémentation

### ✅ Complété

| Composant | Description |
|-----------|-------------|
| Hook `useIntuition.ts` | Création atoms/triples via SDK |
| Hook `useVote.ts` | Vote (approve + deposit) avec gestion erreurs |
| Hook `useAllTotems.ts` | Récupération avec agrégation |
| Utils `aggregateVotes.ts` | Agrégation client-side (17 tests) |
| `ProposalModal` | Création de claims |
| `VoteModal` | Interface de vote |

### ⏳ À implémenter

| Issue | Description |
|-------|-------------|
| #31 | Composant TransactionProgress |
| #32 | Gestion erreurs proposition |
| #41 | Hook useWithdraw |
| #42 | Gestion erreurs vote |

---

## Coûts et frais

### Frais de création
- **5% creator fees** : Reversés au créateur de l'Atom/Triple
- **2% protocol fees** : Pour le protocole INTUITION
- **Gas** : ~0.001 ETH par transaction

### Frais de vote
- **7% total** : 5% creator + 2% protocol
- Les $TRUST déposés sont **récupérables**

---

## Ressources

### Documentation officielle
- **SDK Overview** : https://www.docs.intuition.systems/docs/developer-tools/sdks/overview
- **GraphQL API** : https://www.docs.intuition.systems/docs/developer-tools/graphql-api/overview
- **Testnet Hub** : https://testnet.hub.intuition.systems/

### GitHub
- **Monorepo** : https://github.com/0xIntuition/intuition-ts
- **SDK Package** : https://github.com/0xIntuition/intuition-ts/tree/main/packages/sdk
- **GraphQL Package** : https://github.com/0xIntuition/intuition-ts/tree/main/packages/graphql

### Explorers
- **INTUITION Explorer** : https://explorer.intuition.systems/

---

## Notes techniques

### SDK INTUITION v2.0.0-alpha

#### ⚠️ IMPORTANT : Bug SDK alpha et fix V2

Le SDK alpha (`@0xintuition/sdk@2.0.0-alpha.4`) a un bug dans `batchCreateTripleStatements` qui calcule mal le `msg.value`.

**Problème identifié** :
- Le SDK calcule : `msg.value = tripleBaseCost + depositAmount`
- Mais le contrat V2 valide : `msg.value == sum(assets[])`
- Résultat : Erreur `MultiVault_InsufficientBalance`

**Solution implémentée** : Appel direct au contrat via viem (contourne le SDK)

```typescript
// CORRECT pour V2 : assets[0] inclut TOUT (base cost + user deposit)
const totalAssetValue = tripleBaseCost + depositAmountWei;

const { request } = await publicClient.simulateContract({
  account: walletClient.account,
  address: multiVaultAddress,
  abi: MultiVaultAbi,
  functionName: 'createTriples',
  args: [[subjectId], [predicateId], [objectId], [totalAssetValue]],
  value: totalAssetValue,  // msg.value = sum(assets)
});
```

**Formule V2** :
- `assets[i] = tripleBaseCost + userDeposit`
- `msg.value = sum(assets[])`
- Le contrat déduit `tripleBaseCost` en interne de chaque `assets[i]`

#### Vérification de triple existant (évite `TripleExists`)

Avant de créer un triple, on vérifie s'il existe déjà via GraphQL :

```typescript
// Requête GET_TRIPLE_BY_ATOMS
const existingTriple = await findTriple(subjectId, predicateId, objectId);
if (existingTriple) {
  throw new ClaimExistsError({
    termId: existingTriple.termId,
    subjectLabel: existingTriple.subjectLabel,
    predicateLabel: existingTriple.predicateLabel,
    objectLabel: existingTriple.objectLabel,
  });
}
```

**`ClaimExistsError`** : Erreur personnalisée qui contient les infos du triple existant pour rediriger l'utilisateur vers la page de vote.

#### Autres notes SDK

1. **`batchCreateTripleStatements`** attend des tableaux :
   ```typescript
   [[subjectId], [predicateId], [objectId], [depositAmount]]
   ```
   Pour un seul triple, on passe des tableaux à un élément.

2. **Upload IPFS** : Le SDK gère automatiquement l'upload IPFS des images lors de la création d'atoms avec `createAtomFromThing()`.

3. **Chain ID** : Toujours utiliser `intuitionTestnet.id` (13579), jamais `base.id` (8453).

4. **Récupérer la config du contrat** :
   ```typescript
   import { multiCallIntuitionConfigs } from '@0xintuition/protocol';

   const config = await multiCallIntuitionConfigs({ publicClient, address: multiVaultAddress });
   // config.triple_cost - Coût de base pour créer un triple
   // config.min_deposit - Dépôt minimum requis
   // config.formatted_triple_cost - Version formatée en ETH
   ```

---

**Architecture** : Frontend-only (pas de backend)
**Fonction d'agrégation** : `utils/aggregateVotes.ts` (17 tests passants)

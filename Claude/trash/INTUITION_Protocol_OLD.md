# INTUITION Protocol - Atoms, Triples & Signals

## Vue d'ensemble

INTUITION Protocol permet de créer un graphe de connaissances on-chain en utilisant trois primitives :
- **Atoms** : Unités atomiques de connaissance (personnes, concepts, objets)
- **Triples** : Relations entre Atoms au format RDF (Sujet-Prédicat-Objet)
- **Signals** : Votes/Stakes pour affirmer ou rejeter un Triple

## Comment l'utiliser pour notre projet

### 1. Atoms (Unités de base)

**Ce qu'on va créer :**
- Un Atom par fondateur (42 Atoms)
- Un Atom par totem proposé (animaux, objets, traits)
- Un Atom pour le prédicat "represented_by" ou "has_totem"

**Méthodes SDK disponibles :**
```typescript
// Installation
npm install @0xintuition/sdk viem@2.x.x

// Créer un Atom simple
createAtomFromString(text: string)

// Créer un Atom avec métadonnées
createAtomFromThing({
  url: string,
  name: string,
  description: string,
  image: string
})

// Créer un Atom depuis un compte Ethereum
createAtomFromEthereumAccount(address: string)

// Créer avec upload IPFS
createAtomFromIpfsUpload(metadata: object)
```

**Exemple :**
```typescript
// Créer l'Atom pour un fondateur
const founderAtom = await createAtomFromThing({
  url: 'https://intuition.systems/founders/joseph-lubin',
  name: 'Joseph Lubin',
  description: 'Co-founder of Ethereum, Founder of ConsenSys',
  image: 'ipfs://...'
});

// Créer l'Atom pour un totem
const totemAtom = await createAtomFromString('Lion');

// Créer l'Atom pour le prédicat
const predicateAtom = await createAtomFromString('represented_by');
```

### 2. Triples (Propositions)

**Structure :**
Un Triple = `[Sujet] [Prédicat] [Objet]`

**Pour notre projet :**
- Sujet = Fondateur (ex: Joseph Lubin)
- Prédicat = "represented_by"
- Objet = Totem proposé (ex: Lion)

**Méthode SDK :**
```typescript
createTripleStatement(
  subjectId: bigint,
  predicateId: bigint,
  objectId: bigint
)
```

**Exemple :**
```typescript
// Proposition : "Joseph Lubin est représenté par Lion"
const triple = await createTripleStatement(
  founderAtom.termId,      // Joseph Lubin
  predicateAtom.termId,    // represented_by
  totemAtom.termId         // Lion
);
```

### 3. Signals (Votes)

**Comment ça fonctionne :**
- Chaque Triple a **2 vaults** : FOR (affirmatif) et AGAINST (négatif)
- Les users déposent du $TRUST dans un des vaults
- Plus de $TRUST déposé = plus de conviction
- Les dépôts sont **récupérables** après

**Méthodes de dépôt :**
```typescript
// Voter pour un Triple (FOR)
depositTriple(tripleId: bigint, amount: bigint, isPositive: true)

// Voter contre un Triple (AGAINST)
depositTriple(tripleId: bigint, amount: bigint, isPositive: false)

// Voter pour un Atom
depositAtom(atomId: bigint, amount: bigint)
```

**Exemple :**
```typescript
import { parseEther } from 'viem';

// Un user vote FOR "Joseph Lubin represented_by Lion"
await depositTriple(
  triple.tripleId,
  parseEther('10'), // 10 $TRUST tokens
  true              // isPositive = FOR
);
```

### 4. Récupération des données

**Via GraphQL API :**
```typescript
import { createClient } from '@0xintuition/graphql';

const client = createClient({
  apiUrl: 'https://testnet.intuition.sh/v1/graphql'
});

// Récupérer les détails d'un Atom
const query = `
  query GetAtom($id: String!) {
    atoms_by_pk(id: $id) {
      id
      label
      creator {
        id
      }
    }
  }
`;

// Récupérer les Triples avec les votes
const triplesQuery = `
  query GetTriples {
    triples(order_by: { created_at: desc }) {
      id
      subject { label }
      predicate { label }
      object { label }
      vault_for_balance
      vault_against_balance
    }
  }
`;
```

**Via SDK :**
```typescript
// Récupérer les détails d'un Atom
getAtomDetails(atomId: bigint)

// Récupérer les détails d'un Triple
getTripleDetails(tripleId: bigint)
```

## Coûts et frais

### Frais de création
- **5% creator fees** : Reversés au créateur de l'Atom/Triple
- **2% protocol fees** : Pour le protocole INTUITION
- Coûts décrits comme "sub-cent" (moins d'un centime)

### Frais de vote (Signal)
- Dépôt de $TRUST tokens
- Les tokens sont **récupérables** (withdrawable)
- Le montant déposé représente la conviction

## Configuration technique

### Installation
```bash
npm install @0xintuition/sdk viem@2.x.x
```

### Setup de base
```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Client pour lire la blockchain
const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

// Client pour écrire (transactions)
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http()
});

// Récupérer l'adresse du MultiVault
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
const vaultAddress = getMultiVaultAddressFromChainId(base.id);
```

### Réseaux supportés
- Intuition Network (mainnet)
- Base Mainnet ✅ (on utilise celui-ci)
- Ethereum Mainnet
- Arbitrum
- Leurs testnets respectifs

## Adresses des contrats (Base Mainnet)

```
Trust Token: 0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3
BaseEmissionsController: 0x7745bDEe668501E5eeF7e9605C746f9cDfb60667
EmissionsAutomationAdapter: 0xb1ce9Ac324B5C3928736Ec33b5Fd741cb04a2F2d
```

## Sources et documentation

### Documentation officielle
- **SDK Overview** : https://www.docs.intuition.systems/docs/developer-tools/sdks/overview
- **Architecture** : https://www.docs.intuition.systems/docs/developer-tools/deep-dive/architecture
- **GraphQL API** : https://www.docs.intuition.systems/docs/developer-tools/graphql-api/overview

### GitHub
- **Monorepo TypeScript** : https://github.com/0xIntuition/intuition-ts
- **Smart Contracts v2** : https://github.com/0xIntuition/intuition-contracts-v2
- **SDK Package** : https://github.com/0xIntuition/intuition-ts/tree/main/packages/sdk
- **GraphQL Package** : https://github.com/0xIntuition/intuition-ts/tree/main/packages/graphql

### Articles Medium
- **$TRUST Token** : https://medium.com/0xintuition/introducing-intuitions-native-token-trust-9c08188b7ea3
- **Tokenomics** : https://medium.com/0xintuition/intuition-trust-tokenomics-17af2ffeb138
- **Season 1 Airdrop** : https://medium.com/0xintuition/intuition-season-1-airdrop-6c956932571d

### Whitepaper
- **PDF** : https://cdn.prod.website-files.com/65cdf366e68587fd384547f0/66ccda1f1b3bbf2d30c4f522_intuition_whitepaper.pdf

### Autres ressources
- **Site officiel** : https://www.intuition.systems/
- **Portal** : https://portal.intuition.systems/
- **Explorer** : https://explorer.intuition.systems/
- **Delphi Digital Report** : https://members.delphidigital.io/reports/intuition-protocol-building-the-internets-trust-layer

## Flux de travail pour notre projet

### Phase 1 : Initialisation
1. Créer les 42 Atoms pour les fondateurs
2. Créer l'Atom prédicat "represented_by"
3. Déployer l'interface de proposition

### Phase 2 : Propositions
1. Users proposent des totems (créent des Atoms)
2. Chaque proposition crée un Triple automatiquement
3. Triple = `[Fondateur] [represented_by] [Totem]`

### Phase 3 : Vote
1. Users connectent leur wallet
2. Déposent du $TRUST dans le vault FOR du Triple choisi
3. Les votes sont enregistrés on-chain

### Phase 4 : Résultats
1. Query GraphQL pour récupérer tous les Triples par fondateur
2. Trier par `vault_for_balance` (montant de $TRUST en FOR)
3. Le Triple avec le plus de votes FOR gagne

## Avantages pour notre projet

✅ **Données on-chain** : Tout est stocké sur la blockchain
✅ **Pas de backend complexe** : Le protocol gère la persistence
✅ **Intégration native** : Utilise l'infrastructure INTUITION existante
✅ **Knowledge graph** : Les totems deviennent partie du graphe de connaissances
✅ **Transparence** : Tous les votes sont publics et vérifiables
✅ **Récupérable** : Les users peuvent retirer leur $TRUST après le vote

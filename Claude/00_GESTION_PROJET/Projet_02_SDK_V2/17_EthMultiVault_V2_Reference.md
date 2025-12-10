# EthMultiVault V2 - Référence Contrat

> **Date:** 2 décembre 2025
> **Source:** Recherche Internet + Documentation INTUITION + Docs sources 1-3
> **Usage:** Signatures réelles du contrat V2, différences SDK vs contrat, architecture complète

---

## 0. Packages SDK et Imports

### @0xintuition/sdk (Haut niveau)
```typescript
import {
  createAtomFromString,
  createAtomFromThing,
  createAtomFromEthereumAccount,
  createAtomFromIpfsUpload,
  createTripleStatement,
  batchCreateTripleStatements,
  batchDepositStatement,
  // ... autres exports
} from '@0xintuition/sdk';
```

### @0xintuition/protocol (Bas niveau)
```typescript
import {
  deposit,
  redeem,
  getAtomCost,
  getTripleCost,
  previewDeposit,
  previewRedeem,
  getMultiVaultAddressFromChainId,
  getEthMultiVaultAddressFromChainId,
  // ... autres exports
} from '@0xintuition/protocol';
```

**Différence clé:**
- `@0xintuition/sdk` : Fonctions haut niveau avec abstractions (plus simple)
- `@0xintuition/protocol` : Appels directs au contrat (plus contrôle)

---

## 1. Fonctions Batch du Contrat V2

### batchDeposit
Dépôts multiples en une transaction.

```solidity
function batchDeposit(
    address receiver,
    bytes32[] calldata termIds,
    uint256[] calldata curveIds,
    uint256[] calldata assets,
    uint256[] calldata minShares
) external payable returns (uint256[] memory sharesReceived)
```

**Note:** `msg.value` doit égaler la somme de `assets[]`.

### batchDepositCurve
Variante avec courbe spécifique.

```solidity
function batchDepositCurve(
    address receiver,
    bytes32[] calldata termIds,
    uint256 curveId,           // Courbe unique pour tous
    uint256[] calldata assets,
    uint256[] calldata minShares
) external payable returns (uint256[] memory)
```

### batchRedeem
Retraits multiples utilisant un **pourcentage** (0-100).

```solidity
function batchRedeem(
    address receiver,
    bytes32[] calldata termIds,
    uint256[] calldata curveIds,
    uint256[] calldata percentages,  // 0-100 (pas des shares absolues!)
    uint256[] calldata minAssets
) external returns (uint256[] memory assetsReceived)
```

**Important:** `percentages` est un tableau de pourcentages (0-100), pas des valeurs absolues de shares!

### batchRedeemCurve
Variante avec courbe unique.

```solidity
function batchRedeemCurve(
    address receiver,
    bytes32[] calldata termIds,
    uint256 curveId,
    uint256[] calldata percentages,
    uint256[] calldata minAssets
) external returns (uint256[] memory)
```

---

## 2. Fonctions de Création (Single + Batch)

### createAtom (Single)
Création d'un atom unique.

```solidity
function createAtom(
    bytes calldata atomData
) external payable returns (bytes32 atomId)
```

**Coût:** `msg.value` = `getAtomCost()`

**Variantes SDK:**
```typescript
// Depuis une chaîne simple
const atomId = await createAtomFromString(
  { walletClient, publicClient, address },
  { args: ["Mon Atom Label"] }
);

// Depuis un Thing (JSON-LD structuré)
const atomId = await createAtomFromThing(
  { walletClient, publicClient, address },
  { args: [{ name: "...", description: "...", ... }] }
);

// Depuis une adresse Ethereum
const atomId = await createAtomFromEthereumAccount(
  { walletClient, publicClient, address },
  { args: [ethereumAddress] }
);

// Depuis IPFS
const atomId = await createAtomFromIpfsUpload(
  { walletClient, publicClient, address },
  { args: [ipfsCid] }
);
```

### batchCreateAtom
Création de plusieurs atoms en une transaction.

```solidity
function batchCreateAtom(
    bytes[] calldata atomData
) external payable returns (bytes32[] memory atomIds)
```

**Coût:** `msg.value` = `atomCost * atomData.length`

### createTriple (Single)
Création d'un triple unique.

```solidity
function createTriple(
    bytes32 subjectId,
    bytes32 predicateId,
    bytes32 objectId
) external payable returns (bytes32 termId)
```

**Coût:** `msg.value` = `getTripleCost()`

**SDK:**
```typescript
const tripleId = await createTripleStatement(
  { walletClient, publicClient, address },
  { args: [subjectAtomId, predicateAtomId, objectAtomId] }
);
```

### batchCreateTriple
Création de plusieurs triples en une transaction.

```solidity
function batchCreateTriple(
    bytes32[] calldata subjectIds,
    bytes32[] calldata predicateIds,
    bytes32[] calldata objectIds
) external payable returns (bytes32[] memory termIds)
```

**Coût:** `msg.value` = `tripleCost * subjects.length`

**Atomicité:** Tout ou rien - si un triple échoue, tous revert.

**SDK:**
```typescript
const tripleIds = await batchCreateTripleStatements(
  { walletClient, publicClient, address },
  {
    args: [
      [subjectId1, subjectId2, ...],
      [predicateId1, predicateId2, ...],
      [objectId1, objectId2, ...]
    ],
    value: tripleCost * BigInt(count)
  }
);
```

### Validation Triple (Important)
```
- Les 3 composants (subject, predicate, object) doivent être des Atoms existants
- Un Triple ne peut pas contenir un autre Triple comme composant
- L'unicité est garantie par keccak256(subjectId, predicateId, objectId)
- Si le hash existe déjà → revert "Triple already exists"
```

---

## 3. Fonctions de Dépôt/Retrait (Single)

### deposit (Single)
Dépôt unique sur un vault.

```solidity
function deposit(
    address receiver,
    bytes32 termId,
    uint256 curveId,
    uint256 minShares
) external payable returns (uint256 shares)
```

**SDK:**
```typescript
import { deposit } from '@0xintuition/protocol';

const txHash = await deposit(
  { walletClient, publicClient, address },
  {
    args: [
      BigInt(vaultId),           // termId du vault
      BigInt(depositAmount),     // montant en wei
      walletClient.account.address // receiver des shares
    ],
    value: BigInt(depositAmount)
  }
);
```

**Notes:**
- `receiver` : Adresse qui recevra les shares
- `curveId` : Généralement `1` (OffsetProgressiveCurve)
- `minShares` : Protection slippage (0 pour accepter tout)

### redeem (Single)
Retrait unique depuis un vault.

```solidity
function redeem(
    address receiver,
    bytes32 termId,
    uint256 curveId,
    uint256 shares,
    uint256 minAssets
) external returns (uint256 assets)
```

**SDK:**
```typescript
import { redeem } from '@0xintuition/protocol';

const txHash = await redeem(
  { walletClient, publicClient, address },
  {
    args: [
      BigInt(vaultId),           // termId du vault
      BigInt(sharesAmount),      // shares à brûler
      walletClient.account.address, // receiver des assets
      walletClient.account.address  // owner des shares
    ]
  }
);
```

---

## 4. Fonctions de Prévisualisation (View)

### previewDeposit
```solidity
function previewDeposit(
    bytes32 termId,
    uint256 curveId,
    uint256 assets
) external view returns (uint256 shares, uint256 assetsAfterFees)
```

**Retourne:**
- `shares`: Nombre de shares qu'on recevra
- `assetsAfterFees`: Montant après frais protocole

**Usage pratique:**
```typescript
// Avant un dépôt, prévoir combien de shares on aura
const { shares, assetsAfterFees } = await previewDeposit(termId, 1, amount);
console.log(`Pour ${amount} TRUST, je recevrai ~${shares} shares`);
```

### previewDepositCurve
```solidity
function previewDepositCurve(
    bytes32 termId,
    uint256 curveId,
    uint256 assets
) external view returns (uint256 shares)
```

### previewRedeem
```solidity
function previewRedeem(
    bytes32 termId,
    uint256 curveId,
    uint256 shares
) external view returns (uint256 assetsAfterFees, uint256 sharesUsed)
```

**Retourne:**
- `assetsAfterFees`: ETH/TRUST qu'on recevra après frais
- `sharesUsed`: Shares qui seront brûlées

**Usage pratique:**
```typescript
// Avant un retrait, prévoir combien d'ETH on récupère
const { assetsAfterFees } = await previewRedeem(termId, 1, myShares);
console.log(`Mes ${myShares} shares valent ~${assetsAfterFees} TRUST`);
```

### previewRedeemCurve
```solidity
function previewRedeemCurve(
    bytes32 termId,
    uint256 curveId,
    uint256 shares
) external view returns (uint256 assets)
```

### currentSharePrice (Read)
```typescript
// Obtenir le prix actuel d'une share dans un vault
const sharePrice = await publicClient.readContract({
  address: multiVaultAddress,
  abi: multiVaultAbi,
  functionName: 'currentSharePrice',
  args: [termId, curveId]
});
```

---

## 5. Fonctions de Coût et Utilitaires

### getAtomCost
```solidity
function getAtomCost() external view returns (uint256)
```
Retourne le coût de création d'un atom (~0.1 TRUST).

### getTripleCost
```solidity
function getTripleCost() external view returns (uint256)
```
Retourne le coût de création d'un triple (~0.1 TRUST).

### isTermCreated
```solidity
function isTermCreated(bytes32 termId) external view returns (bool)
```
Vérifie si un term (atom ou triple) existe déjà.

### calculateAtomId
```solidity
function calculateAtomId(bytes calldata atomData) external pure returns (bytes32)
```
Calcule l'ID d'un atom à partir de ses données (sans le créer).

```
atomId = keccak256(atomData)
```

### calculateTripleId
```solidity
function calculateTripleId(
    bytes32 subjectId,
    bytes32 predicateId,
    bytes32 objectId
) external pure returns (bytes32)
```
Calcule l'ID d'un triple à partir de ses composants (sans le créer).

```
tripleId = keccak256(subjectId, predicateId, objectId)
```

### Helpers SDK pour addresses
```typescript
import {
  getMultiVaultAddressFromChainId,
  getEthMultiVaultAddressFromChainId
} from '@0xintuition/protocol';

// Obtenir l'adresse du contrat selon la chain
const address = getMultiVaultAddressFromChainId(1155);  // Mainnet
const address = getMultiVaultAddressFromChainId(13579); // Testnet
```

---

## 6. Structures de Configuration

### GeneralConfig
```solidity
struct GeneralConfig {
    uint256 minDeposit;        // Dépôt minimum (0.01 TRUST = 10^16 wei)
    uint256 minShare;          // Shares minimum (1e6 wei)
    uint256 atomUriMaxLength;  // Taille max données atom (1000 octets)
    uint256 feeDenominator;    // Dénominateur frais (10000 = basis points)
}
```

### VaultFees
```solidity
struct VaultFees {
    uint256 entryFee;      // Frais entrée: 0.5% (50 bp)
    uint256 exitFee;       // Frais sortie: 0.75% (75 bp)
    uint256 protocolFee;   // Frais protocole: 1.25% (125 bp)
}
```

**Calcul des frais:**
```
fee = (amount * feeRate) / feeDenominator
// Ex: (100 TRUST * 50) / 10000 = 0.5 TRUST
```

**Frais max:** 10% (1000 bp)

### AtomConfig
```solidity
struct AtomConfig {
    uint256 atomCost;           // Coût création atom (~0.1 TRUST)
    uint256 atomCreationFee;    // Frais additionnel
}
```

### TripleConfig
```solidity
struct TripleConfig {
    uint256 tripleCost;              // Coût création triple (~0.1 TRUST)
    uint256 atomDepositFraction;     // Redistribution aux atoms (0.9%)
}
```

### BondingCurveConfig
```solidity
struct BondingCurveConfig {
    uint256 curveId;
    address curveAddress;     // Adresse du contrat courbe
    bool isActive;
}
```

---

## 7. Types de Bonding Curves

| Courbe | ID | Comportement |
|--------|-----|--------------|
| LinearCurve | 0 | Parts proportionnelles au montant |
| OffsetProgressiveCurve | 1 | Coût par part augmente avec la liquidité |

**curveId par défaut:** `1` (OffsetProgressiveCurve)

### BondingCurveRegistry
Le contrat **BondingCurveRegistry** gère les courbes disponibles.

```solidity
// Obtenir l'adresse d'une courbe
function getCurveAddress(uint256 curveId) external view returns (address)

// Vérifier si une courbe est active
function isCurveActive(uint256 curveId) external view returns (bool)
```

### Comportement OffsetProgressiveCurve
- Premier dépôt : prix bas par share
- Plus le vault a de liquidité, plus le prix par share augmente
- Avantage aux premiers déposants (early stakers)
- Incite à la découverte de nouveaux Atoms/Triples

---

## 8. Différences SDK vs Contrat

| Aspect | SDK (`@0xintuition/sdk`) | Contrat (EthMultiVaultV2) |
|--------|--------------------------|---------------------------|
| Noms fonctions | `batchDepositStatement` | `batchDeposit` |
| | `createAtomFromString` | `createAtom` |
| | `createTripleStatement` | `createTriple` |
| Abstraction | Haut niveau, encodage auto | Bas niveau, bytes bruts |
| Args redeem | Peut-être shares absolues | Pourcentages (0-100) |
| Gestion value | Automatique (somme) | Manuelle (`msg.value`) |
| Types | TypeScript natif | bytes32, uint256 |
| Erreurs | Messages lisibles | Codes erreur solidity |

**Important:** Le SDK peut abstraire certains détails. Toujours vérifier les signatures réelles du contrat.

### Pattern d'appel SDK
```typescript
// SDK haut niveau
const result = await createAtomFromString(
  { walletClient, publicClient, address },  // Contexte
  { args: [...], value: ... }               // Options
);
```

### Pattern d'appel Contrat (Wagmi/Viem)
```typescript
// Appel direct au contrat
const { writeContract } = useWriteContract();

writeContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'createAtom',
  args: [encodedData],
  value: atomCost
});
```

---

## 9. Frais Récapitulatif

| Type | Valeur | Basis Points |
|------|--------|--------------|
| Frais entrée | 0.5% | 50 bp |
| Frais sortie | 0.75% | 75 bp |
| Frais protocole | 1.25% | 125 bp |
| Redistribution triple → atoms | 0.9% | 90 bp |
| **Total entrée** | ~1.75% | 175 bp |

### Exemple de dépôt 100 TRUST
```
Montant:           100 TRUST
- Frais entrée:    -0.5 TRUST
- Frais protocole: -1.25 TRUST
= Contribution:     98.25 TRUST
```

### Redistribution Triple → Atoms
Quand on dépose sur un Triple, ~0.9% est redistribué aux 3 Atoms composants :
```
Dépôt: 100 TRUST sur Triple [Subject]-[Predicate]-[Object]
  → Vault Triple:  99.1 TRUST (après frais protocole)
  → Vault Subject: +0.3 TRUST
  → Vault Predicate: +0.3 TRUST
  → Vault Object: +0.3 TRUST
```

Ce mécanisme incite à créer des Triples avec des Atoms de qualité.

---

## 10. Événements

### Deposited
```solidity
event Deposited(
    address indexed sender,
    address indexed receiver,
    bytes32 indexed termId,
    uint256 curveId,
    uint256 amount,
    uint256 fees,
    uint256 shares
);
```

### Redeemed
```solidity
event Redeemed(
    address indexed sender,
    address indexed receiver,
    bytes32 indexed termId,
    uint256 shares,
    uint256 amount,
    uint256 fees
);
```

### AtomCreated
```solidity
event AtomCreated(
    bytes32 indexed atomId,
    address indexed creator,
    bytes atomData
);
```

### TripleCreated
```solidity
event TripleCreated(
    bytes32 indexed termId,
    bytes32 indexed subjectId,
    bytes32 indexed predicateId,
    bytes32 objectId,
    bytes32 counterTermId
);
```

### Écoute des événements avec Wagmi
```typescript
import { useWatchContractEvent } from 'wagmi';

// Surveiller les nouveaux dépôts
useWatchContractEvent({
  address: multiVaultAddress,
  abi: multiVaultAbi,
  eventName: 'Deposited',
  onLogs(logs) {
    // logs[0].args contient { sender, receiver, termId, ... }
    console.log('New deposit:', logs);
  }
});
```

---

## 11. Adresses Contrats et Réseaux

### Mainnet (Intuition L3 - Chain ID: 1155)
```
EthMultiVault: 0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e
RPC: https://rpc.intuition.systems
WebSocket: wss://rpc.intuition.systems
Explorer: https://explorer.intuition.systems
Token: $TRUST (natif)
```

### Testnet (Intuition L3 Testnet - Chain ID: 13579)
```
EthMultiVault: 0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91
RPC: https://testnet.rpc.intuition.systems
WebSocket: wss://testnet.rpc.intuition.systems
Explorer: https://testnet.explorer.intuition.systems
Token: $tTRUST (natif test)
```

### Configuration Wagmi
```typescript
import { defineChain } from 'viem';

export const intuitionMainnet = defineChain({
  id: 1155,
  name: 'Intuition',
  nativeCurrency: { name: 'TRUST', symbol: 'TRUST', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.intuition.systems'] }
  },
  blockExplorers: {
    default: { name: 'Intuition Explorer', url: 'https://explorer.intuition.systems' }
  }
});

export const intuitionTestnet = defineChain({
  id: 13579,
  name: 'Intuition Testnet',
  nativeCurrency: { name: 'tTRUST', symbol: 'tTRUST', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.rpc.intuition.systems'] }
  },
  blockExplorers: {
    default: { name: 'Intuition Testnet Explorer', url: 'https://testnet.explorer.intuition.systems' }
  }
});
```

---

## 12. Limitations et Erreurs Courantes

### Limitations Découvertes
1. **Pas de fonction combinée redeem+deposit** → MAIS possible via Multicall3 (voir section 15)
2. **Créer atom + triple + deposit = 3 tx séparées** (ou 2 si triple inclut le dépôt initial)
3. **Pas de MAX_BATCH_SIZE explicite** → Arrays limités par le gas uniquement
4. **batchRedeem utilise un pourcentage** (0-100) et non des shares absolues
5. **HasCounterStake** → Impossible d'avoir position FOR et AGAINST simultanément sur le même triple

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `MinimumDepositNotMet` | Dépôt < 0.01 TRUST | Augmenter le montant |
| `TripleExists` | Triple déjà créé | Vérifier avec `isTermCreated()` |
| `AtomExists` | Atom déjà créé | Utiliser l'ID existant |
| `InsufficientValue` | `msg.value` insuffisant | Calculer avec `getAtomCost()/getTripleCost()` |
| `Pausable: paused` | Contrat en pause | Attendre la reprise |
| `HasCounterStake` | Position opposée existe | Retirer d'abord l'autre position |
| Out of gas | Batch trop grand | Réduire la taille du batch |
| `UserRejectedRequestError` | Utilisateur a annulé | Gérer l'erreur côté UI |

### Modificateurs de Sécurité
```solidity
// Toutes les fonctions d'écriture utilisent :
modifier whenNotPaused;      // Contrat doit être actif
modifier nonReentrant;       // Protection réentrance
```

---

## 13. Architecture Contrats (Vue d'ensemble)

```
┌─────────────────────────────────────────────────────────────────┐
│                     IntuitionRouter                             │
│              (Point d'entrée principal)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│   IntuitionLogic      │       │   EthMultiVaultV2     │
│   (Logique métier)    │       │   (Gestion vaults)    │
└───────────┬───────────┘       └───────────┬───────────┘
            │                               │
    ┌───────┴───────┐               ┌───────┴───────┐
    ▼               ▼               ▼               ▼
┌─────────┐   ┌───────────┐   ┌───────────┐   ┌─────────────────┐
│AtomStore│   │TripleStore│   │TrustBonding│   │BondingCurve     │
│ (atoms) │   │ (triples) │   │ (frais)    │   │Registry (curves)│
└─────────┘   └───────────┘   └───────────┘   └─────────────────┘
```

### Stores
- **AtomStore**: Mapping atomId → données atom
- **TripleStore**: Mapping tripleId → (subject, predicate, object) + mapping `triplesByHash`
- **tripleAtomShares**: Distribution des shares aux atoms composants d'un triple

---

## 14. Sources

### Documentation officielle INTUITION
- [SDK v2 Overview](https://docs.intuition.systems/docs/developer-tools/sdks/overview)
- [SDK Getting Started](https://docs.intuition.systems/docs/developer-tools/sdks/getting-started)
- [Contracts Deployments](https://docs.intuition.systems/docs/developer-tools/contracts/deployments)
- [Bonding Curves](https://docs.intuition.systems/docs/protocol/tokenomics/trust/bonding-curve)
- [Deposit and Return](https://docs.intuition.systems/docs/protocol/tokenomics/trust/deposit-and-return)
- [GraphQL API](https://docs.intuition.systems/docs/developer-tools/graphql/overview)

### GitHub & NPM
- [EthMultiVaultV2.sol](https://github.com/0xIntuition/intuition-contracts-v2/blob/main/contracts/vaults/EthMultiVaultV2.sol)
- [intuition-contracts-v2](https://github.com/0xIntuition/intuition-contracts-v2)
- [intuition-ts](https://github.com/0xIntuition/intuition-ts)
- [@0xintuition/sdk (NPM)](https://www.npmjs.com/package/@0xintuition/sdk)
- [@0xintuition/protocol (NPM)](https://www.npmjs.com/package/@0xintuition/protocol)

### Documentation Wagmi/Viem
- [Wagmi Getting Started](https://wagmi.sh/react/getting-started)
- [useWriteContract](https://wagmi.sh/react/hooks/useWriteContract)
- [useWaitForTransactionReceipt](https://wagmi.sh/react/hooks/useWaitForTransactionReceipt)
- [useWatchContractEvent](https://wagmi.sh/react/hooks/useWatchContractEvent)

---

## 15. Transaction Atomique redeem + deposit - IMPOSSIBLE via Multicall3

> **Ajouté:** 9 décembre 2025
> **Mis à jour:** 9 décembre 2025 - **ABANDONNÉ** après découverte de l'incompatibilité

### Problème initial

Le contrat INTUITION V2 n'a **PAS** de fonction native pour combiner redeem + deposit en une seule transaction.

| Fonction | Mutabilité |
|----------|-----------|
| `redeemBatch` | NONPAYABLE |
| `depositBatch` | PAYABLE |
| `multicall` | ❌ N'existe pas |
| `switchPosition` | ❌ N'existe pas |

### Tentative : Multicall3

Nous avons tenté d'utiliser **Multicall3** (`0xcA11bde05977b3631167028862bE2a173976CA11`) pour combiner les appels.

### Pourquoi ça NE FONCTIONNE PAS

**Découverte critique** : Le contrat `MultiVault.sol` vérifie les permissions :

```solidity
function redeemBatch(address receiver, ...) {
    if (!_isApprovedToRedeem(msg.sender, receiver)) revert NotApproved();
    // ...
}
```

**Problème fondamental** :
- Quand on appelle via Multicall3 : `msg.sender = Multicall3` (pas le user wallet)
- Le contrat vérifie si Multicall3 est approuvé pour redeem → **NON**
- Transaction échoue avec `NotApproved`

C'est une **limitation EVM** :
- Multicall3 utilise `CALL` (pas `DELEGATECALL`)
- `CALL` change le `msg.sender`
- Seul un contrat Router avec `DELEGATECALL` préserverait `msg.sender`

### Solution actuelle

**2 transactions séquentielles** :
1. `redeemBatch()` - 1ère signature
2. `depositBatch()` - 2ème signature

C'est la seule approche viable sans déployer un contrat Router custom.

### Alternative future (non implémentée)

Un **OFCRouter** custom pourrait être développé (comme Uniswap SwapRouter) :

```solidity
contract OFCRouter is Multicall {
    function switchPosition(uint256 fromTermId, uint256 toTermId, ...) external payable {
        // Utilise delegatecall interne → msg.sender préservé
        multiVault.redeemAtom(...);
        multiVault.depositAtom{value: ...}(...);
    }
}
```

**Prérequis** : Développement Solidity + audit de sécurité + déploiement.

---

**Dernière mise à jour:** 9 décembre 2025

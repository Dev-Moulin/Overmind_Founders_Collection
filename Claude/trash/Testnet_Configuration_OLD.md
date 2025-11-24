# Configuration Testnet pour le développement

## Réseau choisi : INTUITION L3 Testnet

Pour le développement et les tests, nous utilisons **INTUITION L3 Testnet** (Chain ID: 13579).

### Pourquoi INTUITION L3 Testnet ?
- ✅ Réseau natif de l'écosystème INTUITION
- ✅ Migration directe vers INTUITION Mainnet
- ✅ Architecture L3 optimisée pour les opérations d'information
- ✅ Performances élevées (18M+ transactions testées)
- ✅ Contrats INTUITION déployés nativement

### Architecture du réseau
INTUITION L3 est un rollup Arbitrum Orbit Layer-3 qui settle sur Base, optimisé pour les opérations haute-fréquence sur l'information.

## Configuration réseau INTUITION L3 Testnet

### Paramètres réseau

```typescript
{
  chainId: 13579,
  chainName: "INTUITION Testnet",
  nativeCurrency: {
    name: "Test Trust",
    symbol: "tTRUST",
    decimals: 18
  },
  rpcUrls: {
    http: "https://testnet.rpc.intuition.systems/http",
    webSocket: "wss://testnet.rpc.intuition.systems/ws"
  },
  blockExplorer: "https://testnet.explorer.intuition.systems"
}
```

### Ajouter le réseau à MetaMask

**Manuellement :**
1. Ouvrir MetaMask → Paramètres → Réseaux → Ajouter un réseau
2. Renseigner :
   - **Nom du réseau** : INTUITION Testnet
   - **RPC URL** : `https://testnet.rpc.intuition.systems/http`
   - **Chain ID** : `13579`
   - **Symbole** : `tTRUST`
   - **Explorateur** : `https://testnet.explorer.intuition.systems`

**Programmatiquement :**
```typescript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x350B', // 13579 en hexadécimal
    chainName: 'INTUITION Testnet',
    nativeCurrency: {
      name: 'Test Trust',
      symbol: 'tTRUST',
      decimals: 18
    },
    rpcUrls: ['https://testnet.rpc.intuition.systems/http'],
    blockExplorerUrls: ['https://testnet.explorer.intuition.systems']
  }]
});
```

## Adresses des contrats (INTUITION L3 Testnet)

### Contrats INTUITION Protocol

Les adresses des contrats sont automatiquement récupérées via le SDK :

```typescript
import { getMultiVaultAddressFromChainId } from '@0xintuition/sdk';
import { intuitionTestnet } from '@0xintuition/protocol';

const vaultAddress = getMultiVaultAddressFromChainId(intuitionTestnet.id);
```

**Adresses principales (Chain ID 13579) :**
```
MultiVault:                 0xDE80b6EE63f7D809427CA350e30093F436A0fe35
AtomWalletFactory:          0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91
BondingCurveRegistry:       0x75dD32b522c89566265eA32ecb50b4Fc4d00ADc7
SatelliteEmissionsCtrl:     0x006C022b854022C1646dA5094F1D77A17D3897AB
Token tTRUST:               0x778f87476f266817f1D715fC172E51C4B85FBb16
```

## Configuration du SDK

### Installation

```bash
npm install @0xintuition/sdk @0xintuition/protocol viem@2.x.x
```

### Setup de base

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { intuitionTestnet } from '@0xintuition/protocol';
import { privateKeyToAccount } from 'viem/accounts';

// Client pour lire la blockchain
const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http()
});

// Client pour écrire (transactions)
const account = privateKeyToAccount('0xVOTRE_CLE_PRIVEE_TESTNET');
const walletClient = createWalletClient({
  account,
  chain: intuitionTestnet,
  transport: http()
});
```

### Configuration avec custom RPC

Pour de meilleures performances, vous pouvez utiliser l'endpoint complet :

```typescript
import { http } from 'viem';
import { intuitionTestnet } from '@0xintuition/protocol';

const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http('https://testnet.rpc.intuition.systems/http')
});

// Avec WebSocket pour les événements en temps réel
const publicClientWs = createPublicClient({
  chain: intuitionTestnet,
  transport: http('wss://testnet.rpc.intuition.systems/ws')
});
```

## Obtenir des tokens de test

### 1. tTRUST pour les gas fees

**INTUITION Testnet Faucet :**
- https://testnet.hub.intuition.systems/

Le faucet vous donnera :
- tTRUST pour payer les frais de gas
- tTRUST pour faire des dépôts de vote

**Montant nécessaire :** ~100 tTRUST suffit pour tester

### 2. Vérifier votre balance

```typescript
const balance = await publicClient.getBalance({
  address: account.address
});
console.log('tTRUST Balance:', formatEther(balance));
```

## Configuration GraphQL API

### URL Testnet

```typescript
import { createClient } from '@0xintuition/graphql';

const client = createClient({
  apiUrl: 'https://testnet.intuition.sh/v1/graphql'
});
```

### Exemple de query

```typescript
const query = `
  query GetTestAtoms {
    atoms(limit: 10, order_by: { created_at: desc }) {
      id
      label
      creator {
        id
      }
    }
  }
`;

const result = await client.request(query);
```

## Workflow de test

### Étape 1 : Setup wallet testnet

1. Créer un nouveau wallet pour le testnet (JAMAIS utiliser un wallet mainnet)
2. Ajouter le réseau INTUITION L3 Testnet à MetaMask
3. Obtenir du tTRUST via le faucet

### Étape 2 : Tester la création d'Atoms

```typescript
import { createAtomFromString } from '@0xintuition/sdk';
import { intuitionTestnet } from '@0xintuition/protocol';

const testAtom = await createAtomFromString(
  walletClient,
  'Test Totem Lion'
);
console.log('Atom créé:', testAtom.transactionHash);
```

### Étape 3 : Tester la création de Triples

```typescript
import { createTriples } from '@0xintuition/sdk';

const result = await createTriples(walletClient, {
  atomIds: [
    founderAtomId,    // Subject
    predicateAtomId,   // Predicate
    totemAtomId        // Object
  ]
});
console.log('Triple créé:', result.transactionHash);
```

### Étape 4 : Tester les votes (deposits)

```typescript
import { deposit } from '@0xintuition/sdk';
import { parseEther } from 'viem';

// Voter FOR sur un triple
await deposit(walletClient, {
  tripleId: tripleId,
  amount: parseEther('10'), // 10 tTRUST
  isFor: true
});
```

## Explorers et outils

### INTUITION L3 Testnet Explorer
- **Explorer** : https://testnet.explorer.intuition.systems
- Vérifier les transactions
- Voir les contrats
- Vérifier les balances
- Explorer les Atoms et Triples créés

### Status Page
- **Status** : https://testnet.uptime.intuition.systems
- Voir l'état du réseau
- Vérifier les performances RPC
- Monitoring en temps réel

### Bridge (si nécessaire)
- **Bridge** : https://testnet.bridge.intuition.systems
- Bridge depuis d'autres testnets

## Vérification de la configuration

### Checklist avant de commencer

- [ ] Wallet testnet créé
- [ ] Réseau INTUITION L3 ajouté à MetaMask (Chain ID: 13579)
- [ ] tTRUST reçu via faucet (>50 tTRUST)
- [ ] SDK installé (`@0xintuition/sdk`, `@0xintuition/protocol`)
- [ ] Clients viem configurés avec `intuitionTestnet`
- [ ] RPC endpoint vérifié

### Script de test complet

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { intuitionTestnet } from '@0xintuition/protocol';
import { privateKeyToAccount } from 'viem/accounts';
import {
  getMultiVaultAddressFromChainId,
  createAtomFromString
} from '@0xintuition/sdk';

async function testSetup() {
  // 1. Setup clients
  const publicClient = createPublicClient({
    chain: intuitionTestnet,
    transport: http()
  });

  const account = privateKeyToAccount(process.env.TESTNET_PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: intuitionTestnet,
    transport: http()
  });

  // 2. Vérifier balance tTRUST
  const balance = await publicClient.getBalance({
    address: account.address
  });
  console.log('tTRUST Balance:', formatEther(balance));

  // 3. Récupérer vault address
  const vaultAddress = getMultiVaultAddressFromChainId(intuitionTestnet.id);
  console.log('MultiVault Address:', vaultAddress);

  // 4. Créer un Atom de test
  try {
    const testAtom = await createAtomFromString(
      walletClient,
      'Test Setup Successful'
    );
    console.log('✅ Setup OK! Transaction:', testAtom.transactionHash);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testSetup();
```

## Migration vers Mainnet

### Différences à changer

1. **Réseau** : `intuitionTestnet` → `intuition` (mainnet)
2. **RPC URL** : `testnet.rpc.intuition.systems` → `rpc.intuition.systems`
3. **Chain ID** : `13579` (testnet) → TBD (mainnet)
4. **Token** : `tTRUST` → `TRUST`
5. **Faucet** : Pas de faucet, vrais tokens nécessaires

### Exemple de config mainnet

```typescript
// À venir - mainnet pas encore lancé
import { intuition } from '@0xintuition/protocol'; // Quand disponible

const publicClient = createPublicClient({
  chain: intuition,
  transport: http()
});
```

### Données testnet non transférables

⚠️ **Important** : Les Atoms/Triples créés sur testnet **ne seront PAS** sur mainnet.

Il faudra tout recréer sur mainnet :
- Les Atoms des fondateurs
- Le prédicat "represented_by"
- Tous les totems proposés
- Tous les votes

## Bonnes pratiques testnet

### Sécurité
- ✅ Utiliser un wallet dédié testnet
- ✅ Ne JAMAIS mettre de vrais fonds
- ✅ Stocker la clé privée dans `.env` (ne pas commit)
- ✅ Ajouter `.env` au `.gitignore`

### Tests
- ✅ Tester toutes les fonctionnalités une par une
- ✅ Vérifier les transactions dans l'explorer
- ✅ Tester les cas d'erreur (rejet transaction, etc.)
- ✅ Vérifier les montants et balances

### Débogage
- ✅ Console.log les transaction hashes
- ✅ Sauvegarder les IDs des Atoms/Triples importants
- ✅ Utiliser l'explorer pour vérifier les données on-chain
- ✅ Tester avec plusieurs wallets différents

## Problèmes courants

### Erreur : "Insufficient funds"
- **Solution** : Obtenir plus de tTRUST via faucet
- Besoin : ~50-100 tTRUST pour créer Atoms/Triples et voter

### Erreur : "Wrong network"
- **Solution** : Vérifier que le wallet est bien sur INTUITION L3 Testnet
- Chain ID doit être `13579` (0x350B en hex)

### Erreur : "Cannot connect to RPC"
- **Solution** : Vérifier le RPC endpoint
- Utiliser : `https://testnet.rpc.intuition.systems/http`
- Vérifier le status : https://testnet.uptime.intuition.systems

### Faucet ne fonctionne pas
- **Solution** :
  - Vérifier que vous êtes sur le bon réseau (Chain ID 13579)
  - Attendre quelques minutes entre les requêtes
  - Demander sur Discord INTUITION

### Transaction bloquée en pending
- **Solution** :
  - Vérifier le status du réseau : https://testnet.uptime.intuition.systems
  - Attendre quelques minutes (L3 peut être plus lent parfois)
  - Vérifier dans l'explorer : https://testnet.explorer.intuition.systems

## Ressources

### Documentation officielle
- **SDK Docs** : https://www.docs.intuition.systems/docs/developer-tools/sdks/overview
- **Testnet Hub** : https://testnet.hub.intuition.systems/
- **Protocol Docs** : https://intuition.gitbook.io/

### Outils
- **Testnet Faucet** : https://testnet.hub.intuition.systems/
- **Explorer** : https://testnet.explorer.intuition.systems
- **Status Page** : https://testnet.uptime.intuition.systems
- **Bridge** : https://testnet.bridge.intuition.systems

### Monitoring
- **RPC Health** : Visible sur https://testnet.uptime.intuition.systems
- **Network Stats** : Visible sur l'explorer
- **GraphQL Endpoint** : https://testnet.intuition.sh/v1/graphql

### Support
- **Discord INTUITION** : Demander de l'aide à la communauté
- **GitHub Issues** : https://github.com/0xIntuition/intuition-ts/issues
- **Twitter** : @0xIntuition

## Performances testnet

Le testnet INTUITION L3 a démontré d'excellentes performances :
- **18M+ transactions** traitées pendant la phase de test
- **990K+ comptes** uniques actifs
- Architecture optimisée pour les opérations d'information haute-fréquence
- Rollup L3 sur Arbitrum Orbit settling sur Base

## Conversion Chain ID

**Décimal** : `13579`
**Hexadécimal** : `0x350B`

```typescript
// Conversion
const chainIdDec = 13579;
const chainIdHex = '0x' + chainIdDec.toString(16); // '0x350b'
```

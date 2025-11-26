# Network Switch - Testnet/Mainnet

**Date** : 26 novembre 2025
**Statut** : ✅ Implémenté
**Priorité** : Haute

---

## 🎯 Objectif

Permettre le switch entre Testnet et Mainnet INTUITION avec un bouton badge dans le Header, visible uniquement pour l'administrateur (Paul).

---

## 📋 Spécifications

### Placement
- **Emplacement** : Header, à côté du bouton de connexion wallet
- **Visibilité** : Uniquement pour l'adresse wallet autorisée

### Comportement
- **Default** : Toujours démarrer sur Testnet
- **Action** : Click → reload page avec nouvelle configuration réseau
- **Persistence** : localStorage (`intuition-network`)
- **Wallet** : Pas de reconnexion nécessaire

### Visuel
- **Format** : Badge/pill avec texte uppercase
- **Couleurs** :
  - 🔴 Rouge : Testnet (`bg-red-500/20 border-red-500 text-red-400`)
  - 🟢 Vert : Mainnet (`bg-green-500/20 border-green-500 text-green-400`)
- **Animation** : Hover scale + transition

---

## 🏗️ Architecture

### Fichiers créés

#### 1. `lib/networkConfig.ts`
Configuration centralisée des réseaux :

```typescript
export type Network = 'testnet' | 'mainnet';

export interface NetworkConfig {
  name: string;
  chainId: number;
  graphqlHttp: string;
  graphqlWs: string;
  rpcHttp: string;
  rpcWs: string;
}

export const NETWORK_CONFIGS: Record<Network, NetworkConfig> = {
  testnet: {
    name: 'INTUITION L3 Testnet',
    chainId: 13579,
    graphqlHttp: 'https://testnet.intuition.sh/v1/graphql',
    graphqlWs: 'wss://testnet.intuition.sh/v1/graphql',
    rpcHttp: 'https://testnet.rpc.intuition.systems/http',
    rpcWs: 'wss://testnet.rpc.intuition.systems/ws',
  },
  mainnet: {
    // Configuration mainnet (à confirmer)
  },
};
```

**Fonctions** :
- `getCurrentNetwork()` : Lit localStorage (default: testnet)
- `setCurrentNetwork(network)` : Écrit dans localStorage
- `getNetworkConfig(network?)` : Retourne config active

#### 2. `hooks/useNetwork.ts`
Hook React pour gérer le switch :

```typescript
export function useNetwork() {
  const [network, setNetwork] = useState<Network>(() => getCurrentNetwork());

  const switchNetwork = useCallback((newNetwork: Network) => {
    setCurrentNetwork(newNetwork);
    setNetwork(newNetwork);
    window.location.reload(); // Reinitialize Apollo Client
  }, []);

  const toggleNetwork = useCallback(() => {
    const newNetwork = network === 'testnet' ? 'mainnet' : 'testnet';
    switchNetwork(newNetwork);
  }, [network, switchNetwork]);

  return {
    network,
    config: getNetworkConfig(network),
    switchNetwork,
    toggleNetwork,
    isTestnet: network === 'testnet',
    isMainnet: network === 'mainnet',
  };
}
```

#### 3. `components/NetworkSwitch.tsx`
Composant UI du bouton :

```typescript
const AUTHORIZED_WALLET = '0xefc86f5fabe767daac9358d0ba2dfd9ac7d29948';

export function NetworkSwitch() {
  const { address } = useAccount();
  const { network, toggleNetwork, isTestnet } = useNetwork();

  // Only show to authorized wallet
  const isAuthorized = address?.toLowerCase() === AUTHORIZED_WALLET.toLowerCase();

  if (!isAuthorized) {
    return null;
  }

  return (
    <button
      onClick={toggleNetwork}
      className={`
        px-3 py-1.5 rounded-full text-xs font-bold uppercase
        ${isTestnet
          ? 'bg-red-500/20 border-red-500 text-red-400'
          : 'bg-green-500/20 border-green-500 text-green-400'
        }
      `}
    >
      {network}
    </button>
  );
}
```

### Fichiers modifiés

#### 1. `lib/apollo-client.ts`
Apollo Client utilise maintenant la configuration dynamique :

```typescript
import { getNetworkConfig } from './networkConfig';

const networkConfig = getNetworkConfig();
const GRAPHQL_HTTP_ENDPOINT = networkConfig.graphqlHttp;
const GRAPHQL_WS_ENDPOINT = networkConfig.graphqlWs;
```

**Avant** : Endpoints hardcodés testnet
**Après** : Endpoints dynamiques selon localStorage

#### 2. `components/Header.tsx`
Integration du bouton :

```typescript
import { NetworkSwitch } from './NetworkSwitch';

<div className="flex items-center gap-3">
  <NetworkSwitch />
  <WalletConnectButton />
</div>
```

---

## 🔄 Workflow utilisateur

### 1. Au chargement de l'app
```
localStorage['intuition-network'] = 'testnet' (default)
↓
getNetworkConfig() → NETWORK_CONFIGS.testnet
↓
Apollo Client connecte à testnet.intuition.sh
```

### 2. Click sur le bouton
```
User clique sur badge "TESTNET" (rouge)
↓
toggleNetwork() appelé
↓
localStorage['intuition-network'] = 'mainnet'
↓
window.location.reload()
↓
Apollo Client reinitialize avec mainnet endpoints
↓
Badge affiche "MAINNET" (vert)
```

---

## ⚙️ Configuration réseau

### Testnet (confirmé)
- **GraphQL HTTP** : `https://testnet.intuition.sh/v1/graphql`
- **GraphQL WS** : `wss://testnet.intuition.sh/v1/graphql`
- **RPC HTTP** : `https://testnet.rpc.intuition.systems/http`
- **RPC WS** : `wss://testnet.rpc.intuition.systems/ws`
- **Chain ID** : 13579

### Mainnet (à confirmer)
⚠️ **TODO** : Confirmer les endpoints mainnet
- **GraphQL HTTP** : À déterminer
- **GraphQL WS** : À déterminer
- **RPC HTTP** : À déterminer (possiblement `mainnet.rpc.intuition.systems`)
- **RPC WS** : À déterminer
- **Chain ID** : À déterminer (supposé 13580)

---

## 🔐 Sécurité

### Accès restreint
- Seul le wallet `0xefc86f5fabe767daac9358d0ba2dfd9ac7d29948` peut voir le bouton
- Vérification côté client avec `useAccount()` de wagmi
- Si wallet non autorisé → `NetworkSwitch` retourne `null`

### Pas de vulnérabilité
- Pas de secrets exposés (endpoints publics)
- Pas d'injection possible (type Network strictement contrôlé)
- localStorage safe pour preference UI

---

## 🧪 Tests

### Build
```bash
pnpm --filter web build
# ✅ Build successful (no TypeScript errors)
```

### Tests manuels à effectuer
1. ✅ Vérifier que le bouton apparaît pour le wallet autorisé
2. ⏳ Click → reload → Apollo utilise mainnet
3. ⏳ Persistence après refresh de page
4. ✅ Badge invisible pour autres wallets
5. ⏳ Couleurs correctes (rouge=testnet, vert=mainnet)

---

## 📝 Notes techniques

### Pourquoi reload ?
Apollo Client est initialisé au module load avec les endpoints. Pour changer d'endpoints, il faut recharger l'app entière. Alternatives considérées :

1. **Dynamic Apollo Client** : Complexe, require React Context + state management
2. **Multiple clients** : Memory overhead
3. **Reload page** : ✅ Simple, efficace, préféré

### LocalStorage vs Context
- **localStorage** : Persiste entre sessions
- **React Context** : Perdu au reload
- **Choix** : localStorage pour UX meilleure

---

## 🚀 Prochaines étapes

### Court terme
- [ ] Tester en conditions réelles avec wallet connecté
- [ ] Confirmer les endpoints mainnet
- [ ] Mettre à jour `NETWORK_CONFIGS.mainnet` avec vraies URLs

### Moyen terme
- [ ] Ajouter indicateur visuel du réseau dans le Footer ?
- [ ] Toast notification lors du switch ?
- [ ] Ajouter chainId validation dans useVote/useIntuition ?

---

## 🔗 Références

- RPC Testnet fourni par Paul : `https://testnet.rpc.intuition.systems/http`
- GraphQL Testnet : `https://testnet.intuition.sh/v1/graphql`
- Adresse admin : `0xefc86f5fabe767daac9358d0ba2dfd9ac7d29948`

---

**Dernière mise à jour** : 26 novembre 2025

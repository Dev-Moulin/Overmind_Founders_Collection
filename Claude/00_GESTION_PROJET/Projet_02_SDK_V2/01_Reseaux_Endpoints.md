# Réseaux cibles et endpoints du protocole Intuition

Le SDK Intuition V2 prend en charge plusieurs réseaux EVM, y compris le réseau Intuition lui-même (un rollup L3) ainsi que des réseaux de test et mainnets Ethereum compatibles.

## Réseaux supportés

| Réseau | Chain ID | Type | Token |
|--------|----------|------|-------|
| Intuition Network Mainnet (L3) | 1155 | Production | $TRUST |
| Intuition Network Testnet (L3) | 13579 | Développement | $tTRUST |
| Ethereum Mainnet (L1) | 1 | Production | ETH |
| Ethereum Sepolia (Testnet) | 11155111 | Développement | ETH |
| Base Mainnet (L2) | 8453 | Production | ETH |
| Base Sepolia | - | Développement | ETH |
| Arbitrum One (L2) | 42161 | Production | ETH |
| Arbitrum Sepolia | - | Développement | ETH |

Dans votre cas, vous avez indiqué utiliser le testnet et mainnet en SDK V2.xx, ce qui correspond vraisemblablement aux réseaux Intuition L3 (testnet 13579 et mainnet 1155). Il convient donc d'utiliser les endpoints et contrats spécifiques à ces réseaux Intuition.

## Endpoints RPC

| Réseau | URL | WebSocket |
|--------|-----|-----------|
| Mainnet Intuition | `https://rpc.intuition.systems` | `wss://rpc.intuition.systems` |
| Testnet Intuition | `https://testnet.rpc.intuition.systems` | `wss://testnet.rpc.intuition.systems` |

## Explorateurs

| Réseau | URL |
|--------|-----|
| Mainnet | `https://explorer.intuition.systems` |
| Testnet | `https://testnet.explorer.intuition.systems` |

## Contrats MultiVault

Le contrat principal MultiVault (cœur du protocole Intuition V2) a des adresses dédiées sur chaque réseau :

| Réseau | Adresse |
|--------|---------|
| Intuition Mainnet L3 | `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` |
| Intuition Testnet L3 | `0x2Ece8D4dEdcB9918A398528f3fa4688b1d2CAB91` |

Ces adresses permettent de configurer correctement le SDK afin de pointer vers les bons contrats cibles.

### Fonctions de configuration

```typescript
// Récupérer l'adresse du MultiVault pour un réseau Intuition
getMultiVaultAddressFromChainId(chainId)

// Récupérer l'adresse de l'EthMultiVault pour un réseau Ethereum
getEthMultiVaultAddressFromChainId(chainId)
```

## Note sur les réseaux Ethereum

Si vous utilisiez à la place un réseau Ethereum (par ex. Sepolia) pour des tests, il faudrait alors utiliser l'EthMultiVault déployé sur ce réseau. Cependant, Intuition V2 ayant son propre L3, on suppose ici que l'intégration se fait principalement sur le testnet Intuition et éventuellement le mainnet Intuition, où $TRUST est la devise native.

---

## Sources

- [Contracts Deployments](https://docs.intuition.systems/docs/developer-tools/contracts/deployments)
- [SDK Overview](https://docs.intuition.systems/docs/developer-tools/sdks/overview)

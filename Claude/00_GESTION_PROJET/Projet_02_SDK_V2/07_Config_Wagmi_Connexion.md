# Configuration de Wagmi et connexion du wallet

## Contexte et technologies utilisées

Le projet consiste à réaliser une application **100% front-end** en React (TypeScript/JavaScript) permettant à des utilisateurs de créer des totems (avec une catégorie) et de recueillir des votes pour ou contre sur ces totems.

Étant donné qu'il s'agit d'une DApp Ethereum (ou compatible EVM), toutes les interactions avec la blockchain se feront **côté client** via un portefeuille utilisateur (ex : MetaMask) plutôt qu'avec une clé privée stockée dans le code. En effet, 99% des dApps Ethereum utilisent MetaMask ou un wallet similaire pour gérer les comptes utilisateurs, plutôt que de demander la clé privée : le wallet injecte un objet web3 dans la page, ce qui permet de signer des transactions via le wallet sans exposer la clé privée. Cette approche renforce la sécurité (la clé privée n'est jamais partagée) et s'aligne avec l'expérience utilisateur attendue : toute transaction doit être signée par l'utilisateur via son portefeuille, au lieu d'être envoyée directement par l'application (utiliser un wallet externe est indispensable pour conserver le caractère trustless de la DApp).

---

## Stack technologique : Wagmi + Viem

Pour implémenter ces fonctionnalités, nous utiliserons la bibliothèque **Wagmi** (hooks React pour Ethereum) qui repose sur **Viem** en interne.

Wagmi, qui utilise Viem comme dépendance, fournit un ensemble complet de hooks React pour faciliter le développement Web3 :
- Connexion du wallet
- Lecture des soldes/ENS
- Signature de messages
- Interactions avec les contrats
- Mécanismes de cache, de persistance et de déduplication des requêtes intégrés

En d'autres termes, **Wagmi contient tout le nécessaire pour se connecter à un wallet et interagir avec un smart contract depuis React**. Nous privilégions donc cette solution côté front-end, sans composant serveur Node.js.

---

## Configuration initiale de Wagmi

La première étape est de configurer Wagmi dans l'application React et d'implémenter la connexion du wallet utilisateur.

### Étapes de configuration

Wagmi nécessite de spécifier :
1. Les **réseaux (chains)** supportés (Ethereum mainnet, testnets, etc.)
2. Les **connectors de wallet** (par exemple MetaMask, WalletConnect, etc.)

Configuration initiale via :
- `createConfig`
- ou `configureChains`

### Provider React

Une fois la configuration prête, on encapsule l'application React avec le provider `<WagmiConfig>` (ou `<WagmiProvider>` selon la version) afin de rendre les hooks utilisables dans tous les composants :

```tsx
import { WagmiConfig } from 'wagmi';
import { config } from './wagmi-config';

function App() {
  return (
    <WagmiConfig config={config}>
      {/* Votre application */}
    </WagmiConfig>
  );
}
```

---

## Interface de connexion du wallet

Pour l'interface de connexion du wallet, deux approches sont possibles :

### Option 1 : Hooks bas niveau de Wagmi (manuel)

Utiliser les hooks pour construire son propre composant de connexion :
- `useConnect` : proposer la connexion via MetaMask (ou tout connector configuré)
- `useAccount` : récupérer l'adresse de l'utilisateur connecté
- `useDisconnect` : gérer la déconnexion

On peut obtenir la liste des connecteurs disponibles et permettre à l'utilisateur d'en sélectionner un, puis appeler `connect(connector)` pour initier la connexion.

```typescript
import { useConnect, useAccount, useDisconnect } from 'wagmi';

function ConnectButton() {
  const { connectors, connect } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>Connecté : {address}</p>
        <button onClick={() => disconnect()}>Déconnecter</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.id} onClick={() => connect({ connector })}>
          Connecter avec {connector.name}
        </button>
      ))}
    </div>
  );
}
```

### Option 2 : Kits UI tiers (recommandé)

Wagmi s'intègre avec des **kits UI tiers** qui fournissent des boutons/modal de connexion déjà stylés et gèrent de nombreux cas edge (plusieurs wallets, mobile, etc.) :

| Kit | Description |
|-----|-------------|
| **RainbowKit** | Modal de connexion élégant, multi-wallet |
| **ConnectKit** | Interface de connexion personnalisable |
| **Web3Modal** | Solution WalletConnect officielle |

Ces bibliothèques sont construites sur Wagmi et offrent une **UX fluide** pour la connexion wallet sans effort supplémentaire.

---

## Résumé de la configuration & connexion

1. **Configurer Wagmi** avec les bonnes chaînes et connecteurs (par ex. Injected pour MetaMask)
2. **Entourer l'appli** de `<WagmiConfig>`
3. **Implémenter un bouton** "Connecter le wallet"
4. Lorsque l'utilisateur clique, **Wagmi ouvre la fenêtre du wallet** (MetaMask)
5. S'il confirme, **son adresse est liée** à l'application

> La connexion du wallet est une fonctionnalité de base de toute DApp, indispensable pour autoriser ensuite les opérations d'écriture sur la blockchain (transactions).

---

## Hooks de connexion

| Hook | Usage |
|------|-------|
| `useConnect` | Initier la connexion, liste des connecteurs |
| `useAccount` | Récupérer l'adresse connectée, état de connexion |
| `useDisconnect` | Déconnecter le wallet |

---

## Sources

- [Wagmi Getting Started](https://wagmi.sh/react/getting-started)
- [useAccount](https://wagmi.sh/react/hooks/useAccount)
- [useConnect](https://wagmi.sh/react/hooks/useConnect)
- [useDisconnect](https://wagmi.sh/react/hooks/useDisconnect)
- [RainbowKit Docs](https://docs.family.co/rainbowkit)
- [Reddit - How do dApps deal with private keys](https://www.reddit.com/r/ethdev/comments/18hgsvl/how_do_dapps_deal_with_private_keys/)

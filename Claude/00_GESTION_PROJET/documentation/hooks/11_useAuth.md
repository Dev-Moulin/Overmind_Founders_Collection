# Hooks Authentification

> Fichiers:
> - `apps/web/src/hooks/useWalletAuth.ts` (117 lignes)
> - `apps/web/src/hooks/useWhitelist.ts` (98 lignes)

## Description

Ces hooks gèrent l'authentification par signature wallet et la vérification d'éligibilité NFT.

---

## 1. useWalletAuth

Hook pour l'authentification par signature de message.

### Interface

```typescript
export function useWalletAuth(): UseWalletAuthResult;

interface UseWalletAuthResult {
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
  logout: () => void;
}

type AuthStatus = 'idle' | 'pending' | 'authenticated' | 'error';
```

### Flux d'Authentification

```
1. User clique "S'authentifier"
   │
2. generateAuthMessage(address)
   │  → Génère message avec nonce + timestamp
   │
3. signMessageAsync({ message })
   │  → Wallet popup demande signature
   │
4. verifyWalletSignature(address, message, signature)
   │  → Vérifie la signature côté client
   │
5. sessionStorage.setItem('wallet_auth', {...})
   │  → Stocke l'état d'auth en session
   │
6. status = 'authenticated'
```

### Exemple d'Utilisation

```tsx
function AuthButton() {
  const { isConnected } = useAccount();
  const { authenticate, isAuthenticated, status, error, logout } = useWalletAuth();

  if (!isConnected) {
    return <ConnectWalletButton />;
  }

  if (isAuthenticated) {
    return (
      <div>
        <span className="status">✅ Authentifié</span>
        <button onClick={logout}>Déconnexion</button>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <button
        onClick={authenticate}
        disabled={status === 'pending'}
      >
        {status === 'pending' ? 'Signature en cours...' : "S'authentifier"}
      </button>
    </div>
  );
}
```

### Gestion des Erreurs

| Erreur | Message | Cause |
|--------|---------|-------|
| Wallet non connecté | "Wallet non connecté" | `address` undefined |
| User rejected | "Signature refusée" | Utilisateur refuse dans le wallet |
| Vérification échouée | Variable | Signature invalide |

### Stockage

L'état d'authentification est stocké dans `sessionStorage`:

```typescript
// Structure stockée
{
  address: "0x...",
  authenticatedAt: 1732524800000
}
```

---

## 2. useWhitelist

Hook pour vérifier l'éligibilité via possession d'un NFT.

### Interface

```typescript
export function useWhitelist(address?: Address): {
  isEligible: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  balance: bigint;
  contractAddress: Address;
};
```

### Configuration

```typescript
// NFT Contract sur Base Mainnet
const NFT_CONTRACT = '0x98e240326966e86ad6ec27e13409ffb748788f8c';

// Note importante: Cross-chain verification
// - NFT sur Base Mainnet
// - Application sur INTUITION L3 Testnet
```

### Exemple d'Utilisation

```tsx
function VoteGate({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const { isEligible, isLoading, error, balance } = useWhitelist(address);

  if (isLoading) {
    return (
      <div className="loading">
        <Spinner />
        <p>Vérification de l'éligibilité...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Erreur lors de la vérification</p>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="not-eligible">
        <h2>Accès Restreint</h2>
        <p>Vous devez posséder le NFT Founders pour participer.</p>
        <a
          href={`https://basescan.org/address/${NFT_CONTRACT}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Voir le contrat NFT
        </a>
      </div>
    );
  }

  // User has the NFT - show content
  return (
    <div>
      <p className="eligible-badge">
        ✅ Éligible ({balance.toString()} NFT{balance > 1n ? 's' : ''})
      </p>
      {children}
    </div>
  );
}
```

### Cross-Chain Verification

```typescript
useReadContract({
  address: NFT_CONTRACT,
  abi: ABI,
  functionName: 'balanceOf',
  args: [address],
  chainId: base.id, // Force lecture sur Base Mainnet
  query: {
    enabled: !!address,
    staleTime: 60_000, // Cache 1 minute
    retry: 2,
  },
});
```

**Important:** L'application tourne sur INTUITION L3 Testnet mais vérifie la possession du NFT sur Base Mainnet grâce au paramètre `chainId: base.id`.

---

## Combinaison des Deux Hooks

```tsx
function ProtectedVotePage() {
  const { address, isConnected } = useAccount();
  const { isEligible, isLoading: eligibilityLoading } = useWhitelist(address);
  const { isAuthenticated, authenticate, status } = useWalletAuth();

  // Étape 1: Connexion wallet
  if (!isConnected) {
    return (
      <div>
        <h2>Connexion requise</h2>
        <ConnectButton />
      </div>
    );
  }

  // Étape 2: Vérification NFT
  if (eligibilityLoading) {
    return <div>Vérification de l'éligibilité...</div>;
  }

  if (!isEligible) {
    return (
      <div>
        <h2>NFT Requis</h2>
        <p>Vous devez posséder le NFT Founders pour voter.</p>
      </div>
    );
  }

  // Étape 3: Authentification
  if (!isAuthenticated) {
    return (
      <div>
        <h2>Authentification requise</h2>
        <p>Signez un message pour prouver que vous êtes le propriétaire du wallet.</p>
        <button onClick={authenticate} disabled={status === 'pending'}>
          {status === 'pending' ? 'Signature...' : "S'authentifier"}
        </button>
      </div>
    );
  }

  // Toutes les vérifications passées
  return <VotingInterface />;
}
```

---

## Dépendances

### useWalletAuth

- `wagmi` : `useAccount`, `useSignMessage`
- `../utils/auth` : `generateAuthMessage`, `verifyWalletSignature`

### useWhitelist

- `wagmi` : `useReadContract`
- `wagmi/chains` : `base`
- `viem` : `Address`

---

## Sécurité

### useWalletAuth

- **Nonce**: Unique à chaque tentative d'auth
- **Timestamp**: Protection contre les replay attacks
- **Session Storage**: Données effacées à la fermeture du navigateur

### useWhitelist

- **Cross-chain**: Vérifie sur le bon réseau (Base Mainnet)
- **Cache**: Évite les appels répétés (staleTime: 1 min)
- **Retry**: 2 tentatives en cas d'échec réseau

---

**Dernière mise à jour** : 25 novembre 2025

# Stack Technique Frontend

**Dernière mise à jour** : 21 novembre 2025

---

## Vue d'ensemble

Le frontend de l'application de vote des totems INTUITION utilise une stack moderne React avec TypeScript et des outils web3 optimisés.

---

## Stack principale

### React + Vite + TypeScript

**Versions** :
- **React** : ^18.3.0
- **Vite** : ^5.4.0
- **TypeScript** : ^5.5.0

**Pourquoi Vite ?**
- ⚡ Démarrage ultra-rapide (< 1 seconde)
- 🔥 Hot Module Replacement instantané
- 📦 Build optimisé avec Rollup
- 🎯 Parfait pour SPA (Single Page Applications)
- Plus rapide que Next.js pour ce cas d'usage

**Pourquoi TypeScript ?**
- 🛡️ Type safety pour éviter les erreurs
- 📝 Autocomplétion dans l'IDE
- 🔧 Refactoring plus sûr
- Essential pour travailler avec wagmi/viem

### Installation de base

```bash
npm create vite@latest intuition-founders-vote -- --template react-ts
cd intuition-founders-vote
npm install
```

---

## Connexion Wallet

### wagmi v2 (^2.19.4)

**wagmi** est la bibliothèque de référence pour les React Hooks Ethereum.

**Installation** :
```bash
npm install wagmi viem@2.x.x @tanstack/react-query
```

**Configuration** :
```typescript
// src/config/wagmi.ts
import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { intuitionTestnet } from '@0xintuition/sdk';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, intuitionTestnet],  // Base pour NFT, INTUITION L3 pour le protocole
  connectors: [
    injected(),
    walletConnect({
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
    }),
  ],
  transports: {
    [base.id]: http(),                    // Chain ID 8453 - Vérification NFT
    [intuitionTestnet.id]: http(),        // Chain ID 13579 - Opérations INTUITION
  },
});
```

> **Note** : Base Mainnet (8453) est utilisé **uniquement** pour vérifier la possession du NFT Overmind Founders Collection (whitelist). Toutes les opérations INTUITION (atoms, triples, votes) se font sur **INTUITION L3 Testnet** (13579).

**Setup dans App** :
```typescript
// src/main.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </WagmiProvider>
);
```

**Hooks principaux** :
- `useAccount()` - Adresse connectée, statut
- `useConnect()` - Connexion de wallets
- `useDisconnect()` - Déconnexion
- `useBalance()` - Balance ETH et tokens
- `useReadContract()` - Lire les smart contracts
- `useWriteContract()` - Écrire sur les smart contracts
- `useWaitForTransactionReceipt()` - Attendre confirmation

### viem v2 (^2.21.0)

**viem** remplace ethers.js avec une API plus moderne et TypeScript-first.

**Pourquoi viem ?**
- 📦 Plus léger qu'ethers.js (40% plus petit)
- 🔒 Type-safe par défaut
- ⚡ Plus rapide
- 🎯 API moderne et cohérente
- Intégration native avec wagmi

**Exemples d'usage** :
```typescript
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';

// Convertir 10 TRUST en wei
const amount = parseEther('10'); // "10000000000000000000"

// Convertir wei en TRUST
const trust = formatEther('150000000000000000000'); // "150"

// Pour des tokens avec décimales custom
const usdc = parseUnits('100', 6); // USDC a 6 décimales
```

### RainbowKit (^2.1.0)

**RainbowKit** fournit une UI pré-construite et magnifique pour la connexion wallet.

**Pourquoi RainbowKit ?**
- ✅ UI moderne et professionnelle out-of-the-box
- ✅ Support de nombreux wallets (MetaMask, Coinbase, WalletConnect, etc.)
- ✅ Thèmes light/dark
- ✅ Customisable
- ✅ Maintenance active et communauté forte
- ✅ Built on top de wagmi

**Installation** :
```bash
npm install @rainbow-me/rainbowkit
```

**Configuration** :
```typescript
// src/main.tsx
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
```

**Usage** :
```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

function Header() {
  return (
    <header>
      <h1>INTUITION Founders Vote</h1>
      <ConnectButton />
    </header>
  );
}
```

**Customisation** :
```typescript
<RainbowKitProvider
  theme={darkTheme({
    accentColor: '#6B46C1', // Couleur INTUITION
    borderRadius: 'medium',
  })}
>
```

---

## INTUITION SDK

### @0xintuition/sdk (^2.0.0-alpha.4)

**Installation** :
```bash
npm install @0xintuition/sdk
```

**Usage** :
```typescript
import {
  createAtomFromString,
  createAtomFromThing,
  batchCreateTripleStatements,
  getMultiVaultAddressFromChainId,
  intuitionTestnet
} from '@0xintuition/sdk';

// Récupérer l'adresse du vault (INTUITION L3 Testnet)
const vaultAddress = getMultiVaultAddressFromChainId(intuitionTestnet.id); // 13579

// Créer un Atom simple
const atom = await createAtomFromString(config, 'Lion');

// Créer un Atom avec métadonnées (image uploadée automatiquement sur IPFS)
const atomWithImage = await createAtomFromThing(config, {
  url: 'https://example.com/lion',
  name: 'Lion',
  description: 'King of the jungle',
  image: imageFile  // Le SDK gère l'upload IPFS automatiquement
});

// Créer un Triple (claim)
const triple = await batchCreateTripleStatements(config, [
  [founderAtomId],    // Subjects
  [predicateAtomId],  // Predicates
  [totemAtomId],      // Objects
  [depositAmount]     // Deposits
]);
```

> **Note importante** : Le SDK INTUITION gère automatiquement l'upload des images sur IPFS lors de la création d'atoms avec `createAtomFromThing()`. Pas besoin de service externe comme Pinata.

### @0xintuition/graphql (latest)

**Installation** :
```bash
npm install @0xintuition/graphql
```

**Configuration** :
```typescript
import { createClient } from '@0xintuition/graphql';

export const intuitionClient = createClient({
  apiUrl: 'https://api-testnet.intuition.systems/v1/graphql'
});
```

**Exemple de query** :
```typescript
function FounderTotems({ founderId }) {
  const { data, loading } = useTriplesQuery({
    variables: {
      where: {
        subject_id: { _eq: founderId }
      }
    }
  });

  if (loading) return <div>Loading...</div>;

  // Agrégation des votes par totem
  const aggregatedTotems = aggregateTriplesByObject(data.triples);

  return (
    <div>
      {aggregatedTotems.map(totem => (
        <TotemCard key={totem.objectId} totem={totem} />
      ))}
    </div>
  );
}
```

---

## State Management

### TanStack Query (React Query) v5

**Déjà inclus avec wagmi**, pas besoin d'installer séparément.

**Pourquoi React Query ?**
- ✅ Cache automatique des données
- ✅ Refetch intelligent
- ✅ Optimistic updates
- ✅ Gestion du loading/error states
- ✅ Subscriptions en temps réel

**Configuration avancée** :
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // Cache 5 secondes
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});
```

**Custom hooks** :
```typescript
import { useQuery } from '@tanstack/react-query';

function useTotemVotes(tripleId: string) {
  return useQuery({
    queryKey: ['totem-votes', tripleId],
    queryFn: async () => {
      const result = await intuitionClient.request(GET_TRIPLE_VOTES, {
        tripleId
      });
      return result.triples_by_pk;
    },
    refetchInterval: 5000, // Refetch toutes les 5s
  });
}
```

### Zustand (optionnel)

Pour l'état global de l'app (UI state, user preferences, etc.)

**Installation** :
```bash
npm install zustand
```

**Store exemple** :
```typescript
import { create } from 'zustand';

interface AppStore {
  selectedFounder: string | null;
  setSelectedFounder: (id: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedFounder: null,
  setSelectedFounder: (id) => set({ selectedFounder: id }),
  theme: 'dark',
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  })),
}));
```

---

## Styling

### Tailwind CSS v3

**Installation** :
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Configuration** (`tailwind.config.js`) :
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        intuition: {
          purple: '#6B46C1',
          dark: '#1A1A1A',
          gray: '#2D2D2D',
        },
      },
    },
  },
  plugins: [],
};
```

**Usage** :
```tsx
<button className="bg-intuition-purple hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
  Vote for this Totem
</button>
```

### Framer Motion (animations)

**Installation** :
```bash
npm install framer-motion
```

**Exemples** :
```tsx
import { motion } from 'framer-motion';

function TotemCard({ totem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.05 }}
      className="card"
    >
      <h3>{totem.name}</h3>
    </motion.div>
  );
}
```

---

## Routing

### React Router v6

**Installation** :
```bash
npm install react-router-dom
```

**Configuration** :
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/founders" element={<FoundersList />} />
        <Route path="/founder/:id" element={<FounderDetail />} />
        <Route path="/propose" element={<Propose />} />
        <Route path="/results" element={<Results />} />
        <Route path="/my-votes" element={<MyVotes />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Notifications

### Sonner (toasts)

**Installation** :
```bash
npm install sonner
```

**Setup** :
```tsx
// src/main.tsx ou App.tsx
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      {/* ... */}
    </>
  );
}
```

**Usage** :
```tsx
import { toast } from 'sonner';

function VoteButton() {
  const handleVote = async () => {
    try {
      await depositTriple(/*...*/);
      toast.success('Vote successful!');
    } catch (error) {
      toast.error('Vote failed');
    }
  };

  return <button onClick={handleVote}>Vote</button>;
}
```

---

## Utilitaires

### date-fns (dates)

```bash
npm install date-fns
```

```typescript
import { format, formatDistanceToNow } from 'date-fns';

const date = format(new Date(triple.created_at), 'PPP');
const timeAgo = formatDistanceToNow(new Date(triple.created_at), {
  addSuffix: true
});
```

### clsx (conditional classes)

```bash
npm install clsx
```

```tsx
import clsx from 'clsx';

<div className={clsx(
  'card',
  isSelected && 'ring-2 ring-purple-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
```

---

## Structure du projet

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/              # Composants UI génériques
│   │   ├── ConnectButton.tsx
│   │   ├── FounderCard.tsx
│   │   ├── TotemCard.tsx
│   │   ├── ProposalModal.tsx
│   │   ├── VoteModal.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── FoundersList.tsx
│   │   ├── FounderDetail.tsx
│   │   ├── Propose.tsx
│   │   ├── Results.tsx
│   │   └── MyVotes.tsx
│   ├── hooks/
│   │   ├── useIntuition.ts      # Création atoms/triples
│   │   ├── useVote.ts           # Vote (approve + deposit)
│   │   ├── useAllProposals.ts   # Query propositions
│   │   ├── useAllTotems.ts      # Query + agrégation
│   │   └── useWithdraw.ts       # Retrait
│   ├── config/
│   │   ├── wagmi.ts
│   │   └── constants.ts
│   ├── lib/
│   │   └── graphql/
│   │       ├── queries.ts
│   │       └── types.ts
│   ├── utils/
│   │   └── aggregateVotes.ts    # Agrégation client-side
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Variables d'environnement

```env
# .env.example
VITE_WALLETCONNECT_PROJECT_ID=
VITE_INTUITION_API_URL=https://api-testnet.intuition.systems/v1/graphql
VITE_ALCHEMY_API_KEY=
```

> **Note** : Pas besoin de `VITE_PINATA_JWT` - le SDK INTUITION gère l'upload IPFS automatiquement.

---

## Scripts package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "test": "vitest"
  }
}
```

---

## DevTools recommandés

- **VS Code Extensions** :
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript
  - GraphQL

- **Browser Extensions** :
  - React Developer Tools
  - TanStack Query DevTools
  - MetaMask / Coinbase Wallet

---

## Performance

### Code splitting

```tsx
import { lazy, Suspense } from 'react';

const Results = lazy(() => import('./pages/Results'));

<Suspense fallback={<Loading />}>
  <Results />
</Suspense>
```

### Image optimization

```tsx
<img
  src={totem.image}
  alt={totem.name}
  loading="lazy"
  decoding="async"
/>
```

---

## Testing

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

## Build & Deploy

### Build

```bash
npm run build
```

Produit un dossier `dist/` prêt pour la production.

### Déploiement

**Options** :
- **Vercel** : `npx vercel` (recommandé)
- **Netlify** : Drag & drop du dossier dist
- **GitHub Pages** : Via GitHub Actions
- **IPFS** : Upload du build sur IPFS

---

## Ressources

- **Vite** : https://vitejs.dev/
- **React** : https://react.dev/
- **wagmi** : https://wagmi.sh/
- **viem** : https://viem.sh/
- **RainbowKit** : https://rainbowkit.com/
- **TanStack Query** : https://tanstack.com/query/
- **Tailwind CSS** : https://tailwindcss.com/
- **Framer Motion** : https://framer.com/motion/
- **Sonner** : https://sonner.emilkowal.ski/
- **INTUITION SDK** : https://www.docs.intuition.systems/docs/developer-tools/sdks/overview

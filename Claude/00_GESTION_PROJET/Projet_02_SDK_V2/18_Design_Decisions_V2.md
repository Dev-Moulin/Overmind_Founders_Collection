# Design Decisions V2 - Système de Vote OFC

> **Date:** 2 décembre 2025
> **Branche:** feature/3-triples-system
> **Statut:** En cours d'implémentation
> **Référence technique:** [17_EthMultiVault_V2_Reference.md](./17_EthMultiVault_V2_Reference.md)

---

## 0. Vue d'ensemble

Ce document décrit les décisions de design pour le système de vote OFC utilisant le protocole INTUITION V2.

### Flux utilisateur simplifié
```
1. Utilisateur sélectionne un fondateur (panneau gauche)
2. Voit les totems existants + stats (panneau centre)
3. Vote FOR/AGAINST sur un totem ou en crée un nouveau (panneau droit)
4. Ajoute au panier → Valide le panier → Transaction blockchain
```

### Technologies utilisées
- **Frontend**: React + TypeScript + Wagmi/Viem
- **Backend**: GraphQL INTUITION + Smart Contracts EthMultiVaultV2
- **Blockchain**: Intuition L3 (Chain ID: 1155) avec token natif $TRUST

---

## 1. Système 3 Triples (remplace OFC:)

### Problème actuel
On utilise un préfixe `OFC:` hardcodé dans le label de la catégorie :
```
Triple 2: [Totem] → [has category] → [OFC:Animal]  ← préfixe hardcodé
```

Pour récupérer les catégories, on doit faire un filtre `LIKE 'OFC:%'` ce qui est fragile.

### Nouvelle architecture : 3 Triples

```
Triple 1: [Fondateur] → [has totem] → [Totem]           ← Vote FOR/AGAINST
Triple 2: [Totem] → [has category] → [Animal]           ← Catégorie (sans préfixe)
Triple 3: [Animal] → [tag category] → [Overmind Founders Collection]  ← Marqueur système
```

### Avantages
- Plus de préfixe hardcodé
- Query par égalité exacte (plus performant)
- Extensible à d'autres collections
- Sémantiquement correct

### Atoms système à créer
| Atom | Label | Description | termId |
|------|-------|-------------|--------|
| Prédicat | `has totem` | Lien fondateur → totem | À créer |
| Prédicat | `has category` | Lien totem → catégorie | À créer |
| Prédicat | `tag category` | Marqueur catégorie système | À créer |
| Prédicat | `embodies` | Opinion forte (alternative à has totem) | À créer |
| Objet | `Overmind Founders Collection` | Identifiant collection | À créer |
| Catégories initiales | `Animal`, `Objet`, `Trait`, `Concept`, `Element`, `Mythologie` | 6 catégories de base | À créer |

> **Note** : Les catégories sont **dynamiques**. L'utilisateur peut créer un totem dans une catégorie existante OU créer une nouvelle catégorie (ex: "IA", "Science", "Film"). Le système crée automatiquement le Triple 3 si la catégorie n'existe pas encore.

### Création des Atoms système (Code)
```typescript
import { createAtomFromString, getAtomCost } from '@0xintuition/sdk';

// Créer les prédicats système
const predicates = ['has totem', 'has category', 'tag category', 'embodies'];
const atomCost = await getAtomCost();

for (const predicate of predicates) {
  const atomId = await createAtomFromString(
    { walletClient, publicClient, address },
    { args: [predicate], value: atomCost }
  );
  console.log(`Predicate "${predicate}" created with ID: ${atomId}`);
}
```

---

## 2. Simplification Prédicats (2 seulement)

### Problème actuel
6 prédicats disponibles créent de la confusion :
- is represented by
- has totem
- is symbolized by
- embodies
- channels
- resonates with

### Décision : 2 prédicats seulement

| Prédicat | Sémantique | Usage |
|----------|------------|-------|
| `has totem` | Neutre/associatif | Vote standard |
| `embodies` | Opinion forte | Vote avec conviction |

### Raison
- Simplifie l'UX
- Réduit la charge cognitive
- 2 niveaux d'engagement suffisent

### Impact sur les Triples
Avec 2 prédicats, un utilisateur peut exprimer :
```
[Vitalik] → [has totem] → [Lion]      // Association standard
[Vitalik] → [embodies] → [Innovation]  // Conviction forte
```

Les deux créent des Triples votables (FOR/AGAINST).

---

## 3. UI 3 Panneaux

### Layout Desktop

```
┌─────────────────┬─────────────────┬─────────────────┐
│                 │                 │                 │
│   FONDATEURS    │   VOTE MARKET   │   VOTE TOTEM    │
│     (liste)     │    (stats)      │    (action)     │
│                 │                 │                 │
│   - Cards       │   - Agrégation  │   - Sélection   │
│   - Filtres     │   - Graphiques  │   - Montant     │
│   - Recherche   │   - Tendances   │   - Confirm     │
│                 │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
     Gauche            Centre            Droite
```

### Comportement
- **Panneau gauche** : Liste des fondateurs, toujours visible
- **Panneau centre** : Vote Market (stats agrégées par fondateur sélectionné)
- **Panneau droite** : Vote Totem (action de vote sur un totem spécifique)

### Mobile
- Navigation par tabs ou swipe
- Un panneau à la fois

---

## 4. Vote Market (Stats agrégées)

### Concept
Afficher les statistiques agrégées de tous les votes pour un fondateur donné.

### Données affichées
```typescript
interface VoteMarketStats {
  founderId: string;
  totalVotes: number;           // Nombre total de votes
  totalStaked: bigint;          // ETH/TRUST total staké
  uniqueVoters: number;         // Votants uniques
  topTotems: TotemStats[];      // Top 5 totems par votes
  recentActivity: Activity[];   // Activité récente
  forVsAgainst: {
    for: bigint;                // Total TRUST position FOR
    against: bigint;            // Total TRUST position AGAINST (counter-triple)
  };
}

interface TotemStats {
  totemId: string;
  name: string;
  category: string;
  forStake: bigint;
  againstStake: bigint;
  netScore: bigint;             // for - against
  voterCount: number;
}
```

### Agrégation
- Par fondateur (tous ses totems)
- Par catégorie (optionnel)
- Par période (24h, 7j, 30j, all)

### Query GraphQL pour agrégation
```graphql
query GetFounderVoteMarket($founderId: String!) {
  triples(
    where: {
      subject: { id: { _eq: $founderId } }
      predicate: { label: { _in: ["has totem", "embodies"] } }
    }
  ) {
    id
    object { id label }
    vault {
      totalShares
      positionCount
    }
    counterTriple {
      vault {
        totalShares
        positionCount
      }
    }
  }
}
```

---

## 5. Presets Montants

### Nouveau vote (pas de position existante)
```typescript
const MIN_DEPOSIT = BigInt(10 ** 16);  // 0.01 TRUST (protocole)

const getNewVotePresets = (balance: bigint) => ({
  min: MIN_DEPOSIT,                    // Minimum protocole: 0.01 TRUST
  suggested: balance * 20n / 100n,     // 20% du solde
  max: balance * 50n / 100n            // 50% du solde (sécurité)
});
```

### Modification vote (position existante)
```typescript
const getModifyPresets = (currentShares: bigint, sharePrice: bigint) => {
  const currentValue = currentShares * sharePrice / BigInt(10 ** 18);
  return {
    add10: currentValue * 10n / 100n,    // +10%
    add25: currentValue * 25n / 100n,    // +25%
    double: currentValue,                 // x2
    withdraw50: currentShares * 50n / 100n, // -50% (en shares pour redeem)
    withdrawAll: currentShares            // Tout retirer
  };
};
```

### Affichage
- Boutons preset cliquables
- Input manuel toujours disponible
- Validation en temps réel (min, max, balance)
- Conversion automatique TRUST ↔ shares avec `previewDeposit`

### Hook usePresets
```typescript
const usePresets = (balance: bigint, existingPosition?: Position) => {
  const presets = useMemo(() => {
    if (existingPosition) {
      return getModifyPresets(existingPosition.shares, existingPosition.sharePrice);
    }
    return getNewVotePresets(balance);
  }, [balance, existingPosition]);

  return presets;
};
```

---

## 6. Panier de Votes (localStorage)

### Persistance
```typescript
interface VoteCartItem {
  id: string;                    // UUID unique
  founderId: string;             // Atom ID du fondateur
  founderName: string;           // Label pour affichage
  totemId: string | null;        // Atom ID du totem (null si nouveau)
  totemName: string;             // Label du totem
  predicateId: string;           // has-totem ou embodies
  direction: 'FOR' | 'AGAINST';  // Direction du vote
  amount: bigint;                // Montant en wei
  createdAt: number;             // Timestamp création
  // Données de prévisualisation (mises à jour dynamiquement)
  estimatedShares?: bigint;
  estimatedFees?: bigint;
}

interface StoredVoteCart {
  items: VoteCartItem[];
  lastUpdated: number;           // timestamp
  version: number;               // pour migrations futures
}

// Clé localStorage
const STORAGE_KEY = 'ofc_vote_cart';
```

### Expiration
- Pas d'expiration automatique
- Clear manuel par l'utilisateur
- Warning si items > 24h (prix ont pu changer)

### Synchronisation
- Save on change (debounced 500ms)
- Load on mount
- Merge conflicts : local wins
- Serialization BigInt : `JSON.stringify` avec replacer custom

```typescript
// Serialization pour BigInt
const serializeCart = (cart: StoredVoteCart): string => {
  return JSON.stringify(cart, (_, value) =>
    typeof value === 'bigint' ? value.toString() + 'n' : value
  );
};

const deserializeCart = (json: string): StoredVoteCart => {
  return JSON.parse(json, (_, value) => {
    if (typeof value === 'string' && value.endsWith('n')) {
      return BigInt(value.slice(0, -1));
    }
    return value;
  });
};
```

---

## 7. Prévisualisation Coûts

### Hook usePreviewDeposit
```typescript
import { previewDeposit } from '@0xintuition/protocol';

const usePreviewDeposit = (termId: string, amount: bigint) => {
  const [preview, setPreview] = useState<{
    shares: bigint;
    assetsAfterFees: bigint;
  } | null>(null);

  const debouncedAmount = useDebounce(amount, 300);

  useEffect(() => {
    if (!termId || debouncedAmount <= 0n) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      const result = await publicClient.readContract({
        address: multiVaultAddress,
        abi: multiVaultAbi,
        functionName: 'previewDeposit',
        args: [termId, 1n, debouncedAmount]  // curveId = 1
      });
      setPreview({
        shares: result[0],
        assetsAfterFees: result[1]
      });
    };

    fetchPreview();
  }, [termId, debouncedAmount]);

  return preview;
};
```

### Hook usePreviewRedeem
```typescript
const usePreviewRedeem = (termId: string, shares: bigint) => {
  // Similar implementation avec previewRedeem
  // Retourne { assetsAfterFees, sharesUsed }
};
```

### Affichage dans le panier
```
┌─────────────────────────────────────┐
│ Vote FOR "Lion" pour Joseph Lubin   │
│ Montant: 0.1 TRUST                  │
│ ─────────────────────────────────── │
│ Shares estimées: ~1,234.56          │
│ Frais protocole: ~0.00175 TRUST     │
│ Net après frais: ~0.09825 TRUST     │
└─────────────────────────────────────┘
```

### Paramètres
- `curveId = 1` : Bonding curve par défaut (OffsetProgressiveCurve)
- Recalcul à chaque changement de montant (debounced 300ms)
- Frais totaux : ~1.75% (entry fee 0.5% + protocol fee 1.25%)

---

## 8. Gestion Erreur HasCounterStake

### Problème
Un utilisateur ne peut pas voter FOR s'il a déjà voté AGAINST (et vice-versa) sur le même triple.

Le contrat lèvera l'erreur `HasCounterStake` si on essaie de déposer sur un triple alors qu'on a déjà une position sur son counter-triple.

### Détection préalable
```typescript
// Vérifier si l'utilisateur a une position sur le counter-triple
const checkHasCounterStake = async (tripleId: string, userAddress: string) => {
  // Récupérer le counterTripleId
  const counterTripleId = await publicClient.readContract({
    address: multiVaultAddress,
    abi: multiVaultAbi,
    functionName: 'getCounterTriple',
    args: [tripleId]
  });

  // Vérifier les shares de l'utilisateur sur le counter-triple
  const counterShares = await publicClient.readContract({
    address: multiVaultAddress,
    abi: multiVaultAbi,
    functionName: 'getVaultShares',
    args: [counterTripleId, userAddress]
  });

  return counterShares > 0n;
};
```

### Solution UX
```
┌─────────────────────────────────────┐
│ ⚠️ Position opposée détectée        │
│                                     │
│ Vous avez déjà voté AGAINST ce      │
│ totem avec 0.05 TRUST (125 shares). │
│                                     │
│ Pour voter FOR, vous devez d'abord  │
│ retirer votre position AGAINST.     │
│                                     │
│ [Retirer et voter FOR] [Annuler]    │
└─────────────────────────────────────┘
```

### Flow automatique
1. Détecter la position opposée (avant d'ajouter au panier)
2. Proposer le retrait automatique
3. Enchaîner avec le nouveau vote
4. **Limitation** : Pas de batch possible → 2 transactions séparées
   - Transaction 1 : `redeem` du counter-triple
   - Transaction 2 : `deposit` sur le triple souhaité

---

## 9. Batch Operations

### Cas d'usage
- Voter sur plusieurs totems en une fois (batchDeposit)
- Retirer plusieurs positions (batchRedeem)
- Création multiple de triples (batchCreateTriple)

**⚠️ Limitation découverte** : Pas de fonction combinée redeem+deposit → changement de camp = 2 tx

### Implémentation actuelle (séquentielle)
```typescript
// Phase 1: Traitement séquentiel du panier
const processCart = async (cart: VoteCartItem[]) => {
  const results: TransactionResult[] = [];

  for (const item of cart) {
    try {
      // 1. Créer le totem si nouveau
      if (!item.totemId) {
        const totemId = await createAtomFromString(...);
        item.totemId = totemId;
      }

      // 2. Créer le triple si nouveau
      const tripleId = await createTripleStatement(
        { walletClient, publicClient, address },
        { args: [item.founderId, item.predicateId, item.totemId] }
      );

      // 3. Déposer sur le triple (ou counter-triple si AGAINST)
      const targetId = item.direction === 'FOR' ? tripleId : counterTripleId;
      await deposit(
        { walletClient, publicClient, address },
        { args: [...], value: item.amount }
      );

      results.push({ success: true, item });
    } catch (error) {
      results.push({ success: false, item, error });
    }
  }

  return results;
};
```

### Implémentation future (batch)
```typescript
// Phase future: Batch natif du contrat
const processCartBatch = async (cart: VoteCartItem[]) => {
  // Séparer les items par type d'opération
  const deposits = cart.filter(i => i.direction === 'FOR' && i.totemId);
  const newTotems = cart.filter(i => !i.totemId);

  // Batch deposits
  if (deposits.length > 0) {
    const termIds = deposits.map(i => i.tripleId);
    const amounts = deposits.map(i => i.amount);
    const totalValue = amounts.reduce((a, b) => a + b, 0n);

    await batchDeposit(
      { walletClient, publicClient, address },
      {
        args: [userAddress, termIds, [1n, ...], amounts, [0n, ...]],
        value: totalValue
      }
    );
  }
};
```

### Priorité
- **Phase actuelle** : séquentiel (plus simple, plus sûr, meilleure gestion d'erreurs)
- **Phase future** : batch natif (gas optimization ~30-50% sur multiples opérations)

---

## 10. Phases d'implémentation

| Phase | Nom | Dépendances | Priorité | Statut |
|-------|-----|-------------|----------|--------|
| ~~1~~ | ~~Vote AGAINST~~ | - | ✅ | Fait |
| ~~1b~~ | ~~Panier base~~ | Phase 1 | ✅ | Fait |
| **2** | Système 3 Triples | - | Haute | 🚧 En cours |
| **3** | Simplification Prédicats | Phase 2 | Haute | En attente |
| **4** | Panier + Prévisualisation | Phases 2-3 | Moyenne | En attente |
| **5** | Vote Market | - | Moyenne | En attente |
| **6** | Batch Triples | Phase 2 | Basse | En attente |
| **7** | Refonte UI 3 Panneaux | Phases 4-5 | Basse | En attente |
| **8** | Graphe de Visualisation | - | Nice to have | En attente |

### Détail Phase 2 (en cours)
```
2.1 ✅ Modifier categories.json (retirer OFC:, ajouter tagPredicate, systemObject)
2.2 ✅ Modifier predicates.json (réduire à 2 prédicats)
2.3 🚧 Modifier queries GraphQL (retirer le filtre OFC:%)
2.4 🚧 Adapter useIntuition.ts pour 3 triples
2.5    Script de création des atoms système (predicates + catégories)
2.6    Tests d'intégration
```

### Fichiers impactés Phase 2
- `packages/shared/src/data/categories.json` ✅
- `packages/shared/src/data/predicates.json` ✅
- `packages/web/src/hooks/useIntuition.ts` 🚧
- `packages/web/src/graphql/queries.ts` 🚧
- `packages/web/src/utils/tripleHelpers.ts` (nouveau)

---

## 11. Gestion des Transactions (Wagmi/Viem)

### Pattern de transaction complet
```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const VoteButton = ({ tripleId, amount, direction }) => {
  // 1. Préparation de la transaction
  const {
    data: txHash,
    isPending,        // En attente de signature wallet
    error: writeError,
    writeContract
  } = useWriteContract();

  // 2. Suivi du minage
  const {
    isLoading: isConfirming,  // Transaction en cours de minage
    isSuccess,                 // Transaction confirmée
    error: confirmError
  } = useWaitForTransactionReceipt({ hash: txHash });

  // 3. Exécution
  const handleVote = () => {
    writeContract({
      address: MULTI_VAULT_ADDRESS,
      abi: multiVaultAbi,
      functionName: 'deposit',
      args: [receiverAddress, tripleId, 1n, 0n],  // curveId=1, minShares=0
      value: amount
    });
  };

  // 4. UI basée sur les états
  return (
    <button
      onClick={handleVote}
      disabled={isPending || isConfirming}
    >
      {isPending && 'Confirmez dans votre wallet...'}
      {isConfirming && 'Transaction en cours...'}
      {!isPending && !isConfirming && `Vote ${direction}`}
    </button>
  );
};
```

### Gestion des erreurs
```typescript
const handleError = (error: Error) => {
  // Erreur utilisateur (annulation)
  if (error.name === 'UserRejectedRequestError') {
    toast.error('Transaction annulée');
    return;
  }

  // Erreur contrat
  if (error.message.includes('HasCounterStake')) {
    toast.error('Vous avez déjà une position opposée');
    return;
  }

  if (error.message.includes('MinimumDepositNotMet')) {
    toast.error('Montant minimum: 0.01 TRUST');
    return;
  }

  // Erreur générique
  toast.error(`Erreur: ${error.shortMessage || error.message}`);
};
```

### États de la transaction
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   INITIAL   │ --> │  isPending  │ --> │isConfirming │ --> │  isSuccess  │
│             │     │  (wallet)   │     │  (mining)   │     │  (done!)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                   │
                          v                   v
                    ┌─────────────┐     ┌─────────────┐
                    │writeError   │     │confirmError │
                    │(rejected)   │     │(reverted)   │
                    └─────────────┘     └─────────────┘
```

---

## 12. Fichiers de configuration

### categories.json

> **Catégories dynamiques** : Les catégories listées ci-dessous sont les **suggestions initiales**. L'utilisateur peut créer une nouvelle catégorie en saisissant un nom libre (ex: "IA", "Film", "Science"). Le système vérifie si la catégorie existe déjà (via Triple 3) et la crée automatiquement si besoin.

```json
{
  "predicate": {
    "id": "has-category",
    "label": "has category",
    "termId": null
  },
  "tagPredicate": {
    "id": "tag-category",
    "label": "tag category",
    "termId": null
  },
  "systemObject": {
    "id": "overmind-founders-collection",
    "label": "Overmind Founders Collection",
    "termId": null
  },
  "initialCategories": [
    { "id": "animal", "label": "Animal", "termId": null },
    { "id": "objet", "label": "Objet", "termId": null },
    { "id": "trait", "label": "Trait", "termId": null },
    { "id": "concept", "label": "Concept", "termId": null },
    { "id": "element", "label": "Element", "termId": null },
    { "id": "mythologie", "label": "Mythologie", "termId": null }
  ]
}
```

### Flux création nouvelle catégorie
```
1. User saisit "Claude" dans catégorie "IA" (nouvelle)
2. Système vérifie si Triple 3 [IA] → [tag category] → [Overmind Founders Collection] existe
3. Si non → créer atom "IA" + Triple 3
4. Créer Triple 2 : [Claude] → [has category] → [IA]
5. Créer Triple 1 : [Fondateur] → [has totem] → [Claude] + TRUST
```

### predicates.json
```json
[
  {
    "id": "has-totem",
    "label": "has totem",
    "description": "Associative/neutral: X has totem Y",
    "termId": null,
    "isDefault": true
  },
  {
    "id": "embodies",
    "label": "embodies",
    "description": "Strong opinion: X embodies/incarnates Y",
    "termId": null,
    "isDefault": false
  }
]
```

---

## 13. Représentations UI Détaillées

### Panneau Gauche - Infos Fondateur
```
┌─────────────────────────────────────┐
│         ┌─────────────┐             │
│         │             │             │
│         │   PHOTO     │             │
│         │  Fondateur  │             │
│         │             │             │
│         └─────────────┘             │
│                                     │
│       VITALIK BUTERIN               │
│       @VitalikButerin               │
│                                     │
├─────────────────────────────────────┤
│  🏷️ Tags                            │
│  ┌────────┐ ┌────────┐ ┌─────────┐  │
│  │Ethereum│ │  Tech  │ │Visionary│  │
│  └────────┘ └────────┘ └─────────┘  │
│                                     │
├─────────────────────────────────────┤
│  📝 Description                     │
│  Co-founder of Ethereum, writer,    │
│  researcher in cryptography and     │
│  economics...                       │
│                                     │
├─────────────────────────────────────┤
│  🔗 Liens                           │
│  [Twitter] [GitHub] [Website]       │
│                                     │
├─────────────────────────────────────┤
│  📊 Vote Market           [▼]       │
│  ┌─────────────────────────────┐    │
│  │ Total TRUST:    150.5 TRUST │    │
│  │ Votants:        45          │    │
│  │ Totems:         12          │    │
│  │ Top:            🦁 Lion     │    │
│  │ FOR/AGAINST:    78% / 22%   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Panneau Centre - FounderCenterPanel (avec onglets)

Le panneau central utilise des **onglets** pour naviguer entre différentes vues :

```
┌───────────────────────────────────────────────────────────┐
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Totems  │ │ Trading │ │Création │ │ Market  │          │
│  │   ✓     │ │         │ │         │ │         │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└───────────────────────────────────────────────────────────┘
```

#### Onglet "Totems" (défaut)
```
┌───────────────────────────────────────────────────────────┐
│  🎯 Totems existants (12)                    [Filtrer ▼]  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 🦁 Lion     │ │ 🦅 Eagle    │ │ 💡 Innovation│         │
│  │             │ │             │ │              │         │
│  │ FOR:  45.2  │ │ FOR:  32.1  │ │ FOR:  28.7   │         │
│  │ AGAINST: 12 │ │ AGAINST: 8  │ │ AGAINST: 5   │         │
│  │ Score: +33  │ │ Score: +24  │ │ Score: +23   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 🐺 Wolf     │ │ 🔥 Fire     │ │ 🌟 Star      │         │
│  │             │ │             │ │              │         │
│  │ FOR:  18.5  │ │ FOR:  15.2  │ │ FOR:  12.0   │         │
│  │ AGAINST: 6  │ │ AGAINST: 3  │ │ AGAINST: 2   │         │
│  │ Score: +12  │ │ Score: +12  │ │ Score: +10   │         │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                           │
│                    [Voir plus...]                         │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  👤 Mes positions sur ce fondateur                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🦁 Lion        FOR     0.5 TRUST [Modifier] [Retirer]│ │
│  │ 🦅 Eagle       AGAINST 0.2 TRUST [Modifier] [Retirer]│ │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

#### Onglet "Création" - Formulaire nouveau totem
```
┌───────────────────────────────────────────────────────────┐
│  ✨ CRÉER UN NOUVEAU TOTEM pour Vitalik Buterin           │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  1️⃣ Nom du totem                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Phoenix                                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  2️⃣ Catégorie                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Mythologie                                    [▼]   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Suggestions:                                             │
│  [Animal] [Objet] [Trait] [Concept] [Element] [Mythologie]│
│                                                           │
│  ── ou créer nouvelle catégorie ──                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Nouvelle catégorie: IA                              │  │
│  └─────────────────────────────────────────────────────┘  │
│  ⓘ Une nouvelle catégorie sera créée automatiquement      │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  3️⃣ Prédicat (relation)                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ ● has totem     Association neutre (recommandé)     │  │
│  │ ○ embodies      Opinion forte, "incarne"            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│  📋 Récapitulatif                                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Triple 1: [Vitalik] → [has totem] → [Phoenix]       │  │
│  │ Triple 2: [Phoenix] → [has category] → [Mythologie] │  │
│  │                                                     │  │
│  │ Coût estimé: ~2x triple_cost + min_deposit          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │        ➡️ CONTINUER VERS LE VOTE                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  Le totem sera créé et vous pourrez voter dessus         │
│  dans le panneau de droite.                              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

#### Onglet "Trading" (graphique)
```
┌───────────────────────────────────────────────────────────┐
│  📈 Market Graph - Vitalik Buterin                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                     │  │
│  │     ████                                            │  │
│  │     ████  ▓▓▓▓                                      │  │
│  │  ░░ ████  ▓▓▓▓  ████                               │  │
│  │  ░░ ████  ▓▓▓▓  ████  ▓▓▓▓                         │  │
│  │  ░░ ████  ▓▓▓▓  ████  ▓▓▓▓  ████                   │  │
│  │  ───────────────────────────────────────────────   │  │
│  │  Lun   Mar   Mer   Jeu   Ven   Sam   Dim           │  │
│  │                                                     │  │
│  │  ████ FOR    ▓▓▓▓ AGAINST    ░░ Neutral            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Panneau Droite - VoteTotemPanel (action vote)

Le panneau droit gère uniquement l'**action de vote** (montant, direction, panier).
Il reçoit le totem sélectionné :
- Soit depuis l'onglet "Totems" (clic sur un totem existant)
- Soit depuis l'onglet "Création" (bouton "Continuer vers le vote")

```
┌─────────────────────────────────────┐
│  🗳️ VOTER SUR UN TOTEM              │
│                                     │
├─────────────────────────────────────┤
│  📌 Totem sélectionné               │
│  ┌─────────────────────────────────┐│
│  │ 🦅 Phoenix                       ││
│  │ Catégorie: Mythologie           ││
│  │ Prédicat: has totem             ││
│  │ Fondateur: Vitalik Buterin      ││
│  └─────────────────────────────────┘│
│  (vient de l'onglet Création)       │
│                                     │
├─────────────────────────────────────┤
│  1️⃣ Montant                         │
│                                     │
│  Presets:                           │
│  [Min] [10%] [25%] [50%] [Custom]   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │        0.25 TRUST               ││
│  └─────────────────────────────────┘│
│  Balance: 1.5 TRUST                 │
│                                     │
├─────────────────────────────────────┤
│  2️⃣ Direction du vote               │
│                                     │
│  ┌───────────┐    ┌───────────┐     │
│  │    FOR    │    │  AGAINST  │     │
│  │     ✓     │    │           │     │
│  └───────────┘    └───────────┘     │
│                                     │
├─────────────────────────────────────┤
│  📋 Prévisualisation                │
│  ┌─────────────────────────────────┐│
│  │ Shares estimées:   ~125.3       ││
│  │ Frais protocole:   ~0.004 TRUST ││
│  │ Net après frais:   ~0.246 TRUST ││
│  └─────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │      ➕ AJOUTER AU PANIER        ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### Interaction Centre ↔ Droite

```
┌─────────────────────┐           ┌─────────────────────┐
│   PANNEAU CENTRE    │           │   PANNEAU DROITE    │
│   (FounderCenter)   │           │   (VoteTotem)       │
├─────────────────────┤           ├─────────────────────┤
│                     │           │                     │
│  Onglet Totems:     │  ──────>  │  Reçoit le totem    │
│  - Clic sur card    │  totem    │  existant           │
│                     │  existant │                     │
│                     │           │                     │
│  Onglet Création:   │  ──────>  │  Reçoit le nouveau  │
│  - Formulaire       │  nouveau  │  totem à créer      │
│  - "Continuer"      │  totem    │                     │
│                     │           │                     │
└─────────────────────┘           └─────────────────────┘
```

**Note**: La création du totem (atoms + triples) n'est exécutée qu'au moment
de la validation du panier, pas au moment du "Continuer vers le vote".

### Panier (Haut droite, overlay)
```
┌─────────────────────────────────────┐
│  🛒 Panier (3)              [✕]     │
├─────────────────────────────────────┤
│                                     │
│  1. Vitalik → Lion (FOR)            │
│     0.25 TRUST  ~125 shares         │
│                        [🗑️]         │
│                                     │
│  2. Vitalik → Eagle (AGAINST)       │
│     0.10 TRUST  ~48 shares          │
│                        [🗑️]         │
│                                     │
│  3. Elon → Wolf (FOR)               │
│     0.50 TRUST  ~230 shares         │
│                        [🗑️]         │
│                                     │
├─────────────────────────────────────┤
│  Total:           0.85 TRUST        │
│  Frais estimés:   ~0.015 TRUST      │
│  ─────────────────────────          │
│  Net:             ~0.835 TRUST      │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │      ✅ VALIDER (3 votes)       ││
│  └─────────────────────────────────┘│
│                                     │
│  [Vider le panier]                  │
└─────────────────────────────────────┘
```

---

**Dernière mise à jour:** 10 décembre 2025 - Ajout mockups UI panneau central (onglets + formulaire création)
